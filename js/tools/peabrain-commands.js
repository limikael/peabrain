import fs from "node:fs";
import path from "node:path";
import {dirnameFromImportMeta} from "../utils/node-util.js";

let __dirname=dirnameFromImportMeta(import.meta);

build.priority=5;
export async function build(ev) {
    console.log("**** peabrain build ****");
	ev.setBoard("esp32-c3-devkitm-1");
    if (ev.env.PEAKERNEL_CAN_PINS)
        throw new Error("Don't set CAN pins, they are fixed...");

    ev.env.PEAKERNEL_CAN_PINS="5,4";
}

init.priority=5;
export async function init() {
	console.log("Init peabrain project...");

    let cwd=process.cwd();

    let packageJsonPath=path.join(cwd,"package.json");
    if (fs.existsSync(packageJsonPath))
        throw new DeclaredError("package.json already exists...");

    let toolPkg=JSON.parse(fs.readFileSync(path.join(__dirname,"../../package.json")));
    let pkg={
        "name": path.basename(cwd),
        "type": "module",
        "scripts": {
            "flash": "peabrain flash"
        },
        "dependencies": {
            "peabrain": `^${toolPkg.version}`
        }
    }

    fs.writeFileSync(path.join(cwd,"package.json"),JSON.stringify(pkg,null,2));

    let dotEnv=`
        # Port 
        # PEAKERNEL_PORT=/dev/ttyACM0
    `.split("\n").map(s=>s.trim()).join("\n");

    fs.writeFileSync(path.join(cwd,".env"),dotEnv);

    //console.log("ret true...");
	return true;
}
