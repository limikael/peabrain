import Repl from "./Repl.js";
import EventEmitter from "../utils/EventEmitter.js";

/*global._refRegistry = new Set();
global.ref=obj=>{ global._refRegistry.add(obj); };
global.unref=obj=>{ global._refRegistry.delete(obj); };*/

global.EventEmitter=EventEmitter;

global.serial=new EventEmitter();
serial.write=data=>serialWrite(data);
setSerialDataFunc(d=>serial.emit("data",d));

global.console={};
console.log=(...args)=>serialWrite(args.map(s=>String(s)).join(" ")+"\r\n");

repl=new Repl(serial,global);

global.getInfo=()=>{
	return ({
		wifiStatus: wifiGetStatus()
	});
}

global.loadSettings=()=>{
	global.settings={};

	if (fileExists("/settings.json")) {
		let fid=fileOpen("/settings.json");
		let s="";

		do {
			let chunk=fileRead(fid,64);
			s+=chunk;
		} while (chunk.length)

		fileClose(fid);
	}

	console.log(JSON.stringify(global.settings));
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
