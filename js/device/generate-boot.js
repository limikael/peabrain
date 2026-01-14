#!/usr/bin/env node
import * as esbuild from "esbuild";
import fs from "node:fs";

//    "build:boot": "esbuild --bundle --conditions=mcu --outfile=target/boot.js api/boot.js && xxd -i -n boot_js target/boot.js > src/boot_js.c",


const result = await esbuild.build({
	entryPoints: ["./js/device/boot.js"],
    minify: true,
    bundle: true,
    write: false,        // <-- critical
    platform: "neutral",// or "node", "browser"
    format: "esm",       // or "cjs"
    //format: "iife",       // or "cjs"
    conditions: ["mcu", "import", "default"]
});

let source=new TextDecoder("utf-8").decode(result.outputFiles[0].contents);
//console.log(source);

let s=source;

s=s.replaceAll("\n","\\n");
s=s.replaceAll('"','\\"');

let cSource='unsigned char boot_js[] ="'+s+'";\n';
fs.writeFileSync("src/boot_js.c",cSource);
//console.log(cSource);