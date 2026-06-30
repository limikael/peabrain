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
	//ev.addLibDep("https://github.com/markub3327/LiquidCrystal_I2C");
	//ev.addLibDep("Wire");
}

export async function bundleConf(ev) {
	//console.log(ev);
	//console.log("conf bundle in: "+ev.cwd);

	ev.esbuildConfig.jsx="automatic";
    ev.esbuildConfig.jsxImportSource="peabrain-ui-jsx";
    ev.esbuildConfig.alias["peabrain-ui-jsx/jsx-runtime"]=path.join(__dirname,"js/jsx-runtime.js");
    ev.esbuildConfig.alias["peabrain-ui-jsx/jsx-dev-runtime"]=path.join(__dirname,"js/jsx-runtime.js");
    ev.esbuildConfig.alias["peabrain-ui"]=path.join(__dirname,"js/exports-mcu.js");
}