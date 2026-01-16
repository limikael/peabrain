setCanMessageFunc(m=>{
	console.log("got can message: "+m)
});

setInterval(()=>{
	canWrite("t1238DEADBEEFCAFEBABE");
},1000);
