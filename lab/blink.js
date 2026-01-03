console.log("hello, blink starting...");

// todo.. fix default pin mode...

function blinkOff() {
	console.log("blink off...");
	digitalWrite(8,0);
	setTimeout(blinkOn,1000);
}

function blinkOn() {
	console.log("blink on...");
	digitalWrite(8,1);
	setTimeout(blinkOff,1000);
}

blinkOn();
