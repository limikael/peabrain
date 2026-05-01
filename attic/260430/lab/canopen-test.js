setCanMessageFunc(m=>{
	console.log("got can message: "+m)
});

setInterval(()=>{
	canWrite("t1238DEADBEEFCAFEBABE");
},1000);

let master=getMasterDevice();
global.dev=master.createRemoteDevice(3);
global.dev.insert(0x2000,0);

setInterval(()=>{
	let master=getMasterDevice();
	let device=master.getRemoteDevice(3);
	device.at(0x2000,0).set(!device.at(0x2000,0).get());

	console.log("intervalll...");
	//global.dev.at(0x2000,0).set(!global.dev.at(0x2000,0).get());
},1000);


/*global.master=new MasterDevice(canBus);*/
console.log("master created in the bg...");
