console.log("hello, blink starting...");
pinMode(8,"output");

function tick() {
	digitalWrite(8,!digitalRead(8));
	//console.log("blink...");
	setTimeout(tick,1000);
}

tick();