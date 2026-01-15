#!/usr/bin/env node
import * as esbuild from "esbuild";
import fs from "node:fs";

const result = await esbuild.build({
	entryPoints: ["./js/device/boot.js"],
    minify: true,
    bundle: true,
    write: false,        // <-- critical
    platform: "neutral",// or "node", "browser"
    format: "iife",
    //format: "esm", // should probably to esm, but not exactly shure why...
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