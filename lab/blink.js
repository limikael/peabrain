console.log("hello, blink starting...");

// todo.. fix default pin mode...

function tick() {
	console.log("blink...");
	digitalWrite(8,!digitalRead(8));
	setTimeout(tick,1000);
}

tick();
