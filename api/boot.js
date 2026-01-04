import EventEmitter from "./EventEmitter.js";
import Repl from "./Repl.js";
import {slcanStringify, slcanParse} from "canopener";
import * as CO from "canopener";

global.EventEmitter=EventEmitter;

global.serial=new EventEmitter();
serial.write=data=>serialWrite(data);
setSerialDataFunc(d=>serial.emit("data",d));

global.console={};
console.log=(...args)=>serialWrite(args.map(s=>String(s)).join(" ")+"\r\n");

repl=new Repl(serial);
repl.on("message",message=>{
	if (message.type!="call" && !message.method)
		return;

	//console.log(JSON.stringify(handleRpcMessage(global,message)));

	try {
		let res=global[message.method](...message.params);
		serial.write(JSON.stringify({
			id: message.id,
			result: res
		})+"\n");
	}

	catch (e) {
		serial.write(JSON.stringify({
			id: message.id,
			error: {
				message: String(e)
			}
		})+"\n");
	}
});

global.canBus=new EventEmitter();
global.canBus.write=message=>{
	let s=slcanStringify(message);
	//console.log("writing can: "+s);
	canWrite(s);
	//console.log("writing can: "+s);//JSON.stringify(message));
}

global.canBus.send=global.canBus.write;

setCanMessageFunc(message=>{
	global.canBus.emit("message",slcanParse(message));
	//console.log("can message: "+message);
});
