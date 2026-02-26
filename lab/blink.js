console.log("hello, blink starting...");
pinMode(8,"output");

function tick() {
	//console.log("blink...");
	digitalWrite(8,!digitalRead(8));
	setTimeout(tick,1000);
}

tick();
