console.log("hello, blink starting...");
pinMode(8,"output");

function tick() {
	//console.log("blink...");
	digitalWrite(8,!digitalRead(8));
	setTimeout(tick,1000);
}

tick();

httpServerSetRequestFunc(()=>{
	console.log("serving...");
	console.log(httpServerGetPostData());
	httpServerSend(200,"application/json","hello again from js...");
});
