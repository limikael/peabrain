waitFor(async ()=>{
	console.log("hello");
	await new Promise(r=>setTimeout(r,1000));
	console.log("hello again");
});
