import path from "node:path";
import {esbuildGlobalImportPlugin} from "../utils/esbuild-util.js";
import {getDirname} from "../utils/node-util.js";
import * as esbuild from "esbuild";
import fs from "node:fs";

const __dirname=getDirname(import.meta.url);

export async function peabrainInfo({device}) {
    let info=await device.getInfo();
    console.log(JSON.stringify(info,null,2));
}

export async function peabrainLs({device, dir}) {
    let dirContent=await device.readdir(dir);
    console.log(JSON.stringify(dirContent,null,2));
}

export async function peabrainCat({device, file}) {
    let content=await device.readFile(file);
    console.log(content);
}

export async function peabrainSet({device, name, value}) {
    let config={};
    if (await device.fileExists("/settings.json"))
        config=JSON.parse(await device.readFile("/settings.json"));

    config[name]=value;
    await device.writeFile("/settings.json",JSON.stringify(config,null,2));
    await device.loadSettings();
}

export async function peabrainRm({device, file}) {
    await device.fileUnlink(file);
}

export async function peabrainStart({device}) {
    await device.scheduleReload();
    await device.awaitStarted();
}

export async function peabrainStop({device}) {
    await device.scheduleReload(false);
    await device.awaitStarted();
}

export async function peabrainFlash({device}) {
    let data=fs.readFileSync(".pio/build/esp32-c3/firmware.bin");
    await device.writeFile("/firmware",data);
    console.log("uploaded, rebooting...");
    await device.reboot();
}

export async function peabrainDeploy({device, file, follow}) {
    console.log(`Deploy: ${file}`);

    let jsxRuntimeFn=path.join(__dirname,"../ui/jsx-runtime.js");
    let peabrainExportsFn=path.join(__dirname,"../exports/exports.js");
    const result = await esbuild.build({
        entryPoints: [file],
        jsx: "automatic",
        jsxImportSource: "peabrian-jsx",
        minify: true,
        bundle: true,
        write: false,
        platform: "neutral",
        //format: "esm",
        format: "iife",
        conditions: ["mcu", "import", "default"],
        alias: {
            "peabrian-jsx/jsx-runtime": jsxRuntimeFn,
            "peabrian-jsx/jsx-dev-runtime": jsxRuntimeFn,
            "peabrain": peabrainExportsFn
        }
    });

    let source=new TextDecoder("utf-8").decode(result.outputFiles[0].contents);
    //console.log(source);

    console.log(`Size: ${source.length} bytes`);
    await peabrainStop({device});
    await device.writeFile("/boot.js",source);
    await peabrainStart({device});

    if (follow)
        await new Promise(r=>{});
}
