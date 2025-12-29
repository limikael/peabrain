
function blinkOff() {
	//console.log("blink off...");
	digitalWrite(8,0);
	setTimeout(blinkOn,100);
}

function blinkOn() {
	//console.log("blink on...");
	digitalWrite(8,1);
	setTimeout(blinkOff,100);
}

blinkOn();
