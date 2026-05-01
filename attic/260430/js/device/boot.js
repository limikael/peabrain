import Repl from "./Repl.js";
import EventEmitter from "../utils/EventEmitter.js";
import "./boot-fs.js";
import "./boot-can.js";

global.EventEmitter=EventEmitter;

global.serial=new EventEmitter();
serial.write=data=>serialWrite(data);
setSerialDataFunc(d=>serial.emit("data",d));

global.console={};
console.log=(...args)=>serialWrite(args.map(s=>String(s)).join(" ")+"\r\n");

repl=new Repl(serial,global);

/*httpServerSetRequestFunc(()=>{
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
});*/


/*global.getInfo=()=>{
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
}*/

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

//loadSettings();
