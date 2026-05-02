import {dirnameFromImportMeta} from "../../js/utils/node-util.js";
import path from "node:path";

let __dirname=dirnameFromImportMeta(import.meta);

export async function build(ev) {
	ev.addSource(path.join(__dirname,"peabrain-ui.cpp"));
	ev.addSource(path.join(__dirname,"Lcd.cpp"));
	ev.addSource(path.join(__dirname,"EncoderKnob.cpp"));
	ev.addSource(path.join(__dirname,"DebouncePin.cpp"));
	ev.addBinding(path.join(__dirname,"bindings.json"));
	ev.addIncludeDir(__dirname);
	ev.addSetupFunction("ui_setup");
	ev.addStartFunction("ui_start");
	ev.addLoopFunction("ui_loop");
	ev.addLibDep("https://github.com/markub3327/LiquidCrystal_I2C");
}