import Repl from "./Repl.js";
import EventEmitter from "../utils/EventEmitter.js";
import "./boot-fs.js";

global.EventEmitter=EventEmitter;

global.serial=new EventEmitter();
serial.write=data=>serialWrite(data);
setSerialDataFunc(d=>serial.emit("data",d));

global.console={};
console.log=(...args)=>serialWrite(args.map(s=>String(s)).join(" ")+"\r\n");

repl=new Repl(serial,global);

httpServerSetRequestFunc(()=>{
	try {
		let message=JSON.parse(httpServerGetPostData());
        let res=global[message.method](...message.params);
		let response={id: message.id, result: res};
		let responseBody=JSON.stringify(response,null,2)+"\n";
		httpServerSend(200,"application/json",responseBody);
	}

	catch (e) {
		let response={error: {message: e.message}};
		let responseBody=JSON.stringify(response,null,2)+"\n";
		httpServerSend(500,"application/json",responseBody);
	}
});


global.getInfo=()=>{
	return ({
		wifiStatus: wifiGetStatus(),
		ip: wifiGetIp()
	});
}

global.loadSettings=()=>{
	global.settings={};
	if (fileExists("/settings.json"))
		global.settings=JSON.parse(readFile("/settings.json"));

	if (global.settings.wifiSsid)
		wifiConnect(global.settings.wifiSsid,global.settings.wifiPassword);

	else
		wifiDisconnect();
}

global.waitFor=async (p)=>{
	if (typeof p=="function")
		p=p();

	//global.gc();
	setBootInProgress(true);
	//global.gc();

	await p;

	console.log("Boot complete.");

	//global.gc();
	setBootInProgress(false);
	//global.gc();
}

if (global.RemoteDevice) {
	global.getMasterDevice=()=>{
		if (!global.__instance_MasterDevice)
			global.__instance_MasterDevice=new MasterDevice(canBus);

		return global.__instance_MasterDevice;
	}

	RemoteDevice.prototype.flush=function() {
		//console.log("flushing, id="+this.getNodeId()+" gen="+this.getGeneration()+" cgen="+this.getCommitGeneration());
		let generation=this.getGeneration();
		if (this.getCommitGeneration()==generation &&
				!this.isRefreshInProgress())
			return;

		return new Promise(resolve=>{
			//console.log("******* will flush...");
			let check=()=>{
				//console.log("check... refreshing: "+this.isRefreshInProgress());

				if (this.getCommitGeneration()>=generation &&
						!this.isRefreshInProgress()) {
					this.off("commitGenerationChange",check);
					resolve();
				}
				//console.log("checking...");
			}

			this.on("commitGenerationChange",check);
		});
	};
}

loadSettings();
