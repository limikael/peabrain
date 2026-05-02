function update() {
	Lcd.getInstance().setBuffer("Val: "+getUiKnob().getValue());
}

getUiKnob().on("change",update);
update();

getUiButton().on("down",v=>console.log("press..."));
