let count=0;

function update() {
	Lcd.getInstance().setBuffer("Val: "+getUiKnob().getValue()+" Count: "+count);
}

getUiKnob().on("change",update);
update();

getUiButton().on("down",v=>{
	count++;
	update();
});