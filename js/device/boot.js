import Repl from "./Repl.js";
import EventEmitter from "../utils/EventEmitter.js";

global._refRegistry = new Set();
global.ref=obj=>{ global._refRegistry.add(obj); };
global.unref=obj=>{ global._refRegistry.delete(obj); };

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

	//global.gc();
	setBootInProgress(true);
	//global.gc();

	await p;

	console.log("boot promise returned...");

	//global.gc();
	setBootInProgress(false);
	//global.gc();
}

global.getMasterDevice=()=>{
	if (!global.__instance_MasterDevice)
		global.__instance_MasterDevice=new MasterDevice(canBus);

	return global.__instance_MasterDevice;
}

RemoteDevice.prototype.flush=async function() {
	//console.log("flushing, id="+this.getNodeId()+" gen="+this.getGeneration()+" cgen="+this.getCommitGeneration());
	let generation=this.getGeneration();
	if (this.getCommitGeneration()==generation)
		return;

	return new Promise(resolve=>{
		let obj={};
		obj.check=()=>{
			//console.log("***** check!!!");
			if (this.getCommitGeneration()==generation) {
				this.offCommitGenerationChange(obj.handle);
				unref(obj);
				resolve();
			}
		}

		obj.handle=this.onCommitGenerationChange(obj.check);
		ref(obj);
	});
};
