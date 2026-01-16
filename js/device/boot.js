import Repl from "./Repl.js";
import EventEmitter from "../utils/EventEmitter.js";

global.EventEmitter=EventEmitter;

global.serial=new EventEmitter();
serial.write=data=>serialWrite(data);
setSerialDataFunc(d=>serial.emit("data",d));

global.console={};
console.log=(...args)=>serialWrite(args.map(s=>String(s)).join(" ")+"\r\n");

repl=new Repl(serial,global);

global.waitFor=async (p)=>{
	if (typeof p=="function")
		p=p();

	global.gc();
	setBootInProgress(true);
	global.gc();

	await p;

	global.gc();
	setBootInProgress(false);
	global.gc();
}

global.getMasterDevice=()=>{
	if (!global.__instance_MasterDevice)
		global.__instance_MasterDevice=new MasterDevice(canBus);

	return global.__instance_MasterDevice;
}