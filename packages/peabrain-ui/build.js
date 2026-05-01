import {dirnameFromImportMeta} from "../../js/utils/node-util.js";
import path from "node:path";

let __dirname=dirnameFromImportMeta(import.meta);

export async function build(ev) {
	ev.addSource(path.join(__dirname,"peabrain-ui.cpp"));
	ev.addIncludeDir(__dirname);
	ev.addSetupFunction("ui_setup");
	ev.addLibDep("https://github.com/markub3327/LiquidCrystal_I2C");
}