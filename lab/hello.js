setButtonFunc(()=>{
	console.log("the button...");
});

setEncoderFunc(enc=>{
	console.log("enc: "+enc)
	displaySetCursor(0,0);
	displayWrite("Enc: "+enc+" "+getEncoderValue()+"   ");
});

waitFor(async ()=>{
	displaySetCursor(0,0);
	displayWrite("Start...           ");
	console.log("hello");
	await new Promise(r=>setTimeout(r,1000));
	console.log("hello again");
	displaySetCursor(0,0);
	displayWrite("Started...         ");
});

//console.log("hello hello");
