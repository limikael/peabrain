console.log("hello, blink starting...");
//pinMode(8,"output");
pinMode(0,"output");

let count=0;

function tick() {
	//console.log("blink...");
	//digitalWrite(8,!digitalRead(8));
	digitalWrite(0,!digitalRead(0));
	setTimeout(tick,1000);
	displaySetCursor(0,0);
	displayWrite("Count: "+count);
	count++;
}

tick();

function updateEncoder() {
	displaySetCursor(0,1);
	displayWrite("Enc: "+getEncoderValue()+"    ");
}

updateEncoder();
setEncoderFunc(updateEncoder);
