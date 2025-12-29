import EventEmitter from "./EventEmitter.js";
import Repl from "./Repl.js";

global.serial=new EventEmitter();
serial.write=data=>serialWrite(data);
setSerialDataFunc(d=>serial.emit("data",d));

global.console={};
console.log=s=>{
    serialWrite(s);
    serialWrite("\r\n");
}

repl=new Repl(serial);
repl.on("message",message=>{
	if (message.type!="call")
		return;

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
