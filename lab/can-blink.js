/*import {RemoteDevice, MasterDevice} from "canopener";

let master=new MasterDevice({bus: global.canBus});*/
/*let dev=new RemoteDevice({nodeId: 7});
dev.on("stateChange",()=>{
	console.log("device state: "+dev.getState());
});

master.addDevice(dev);

let blink=dev.entry(0x2000,0).setType("bool");*/

function tick() {
	let t=setTimeout(tick,1000);
	console.log("timeout tick, t="+t);
}

tick();

/*setInterval(()=>{
	console.log("timeout tick...");
},1000);*/