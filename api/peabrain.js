#!/usr/bin/env node
import {Command, program} from "commander";
import fs from "node:fs";
import Device from "./Device.js";
import {stringChunkify} from "./js-util.js";
import * as esbuild from "esbuild";
import path from "node:path";
import {esbuildGlobalImportPlugin} from "./esbuild-util.js";

program
    .name('peabrain')
    .description('Upload scripts to your ESP32 device')
    .version('0.1.0');

program
    .command('deploy')
    .argument('<file>', 'local JS file to deploy')
    .option('-p, --port <path>', 'serial port path', '/dev/ttyUSB0')
    .action(async (file, options) => {
        try {
            console.log(`Deploy: ${file}`);
            const result = await esbuild.build({ // entryPoints instead...
                entryPoints: [file],
                jsx: "automatic",
                jsxImportSource: "canopener",
                minify: true,
                bundle: true,
                write: false,        // <-- critical
                platform: "neutral",// or "node", "browser"
                //format: "esm",       // or "cjs"
                format: "iife",       // or "cjs"
                conditions: ["mcu", "import", "default"],
                plugins: [
                    esbuildGlobalImportPlugin({packageName: "canopener", names: [
                        "RemoteDevice",
                        "MasterDevice",
                        "EventEmitter",
                        "awaitEvent"
                    ]})
                ]
            });

            let source=new TextDecoder("utf-8").decode(result.outputFiles[0].contents);
            //console.log(source);

            console.log(`Size: ${source.length} bytes`);
            let device=new Device(options.port);
            let contents=stringChunkify(source,64);
            let fid=await device.fileOpen("/boot.js", "w");
            for (let content of contents)
                await device.fileWrite(fid,content);

            await device.fileClose(fid);

            await device.scheduleReload();

            /*await new Promise(resolve=>{
                device.on("message",message=>{
                    if (message.type=="started")
                        resolve();
                });
            });

            await device.close();*/
        }

        catch (err) {
            console.error('Error:', err.message);
            process.exit(1);
        }
    });

program
    .command('start')
    .option('-p, --port <path>', 'serial port path', '/dev/ttyUSB0')
    .action(async (options) => {
        try {
            let device=new Device(options.port);
            await device.scheduleReload();
            await new Promise(resolve=>{
                device.on("message",message=>{
                    if (message.type=="started")
                        resolve();
                });
            });

            await device.close();
        }

        catch (err) {
            console.error('Error:', err.message);
            process.exit(1);
        }
    });

program
    .command('stop')
    .option('-p, --port <path>', 'serial port path', '/dev/ttyUSB0')
    .action(async (options) => {
        try {
            let device=new Device(options.port);
            await device.scheduleReload(false);
            await device.close();
        }

        catch (err) {
            console.error('Error:', err.message);
            process.exit(1);
        }
    });

await program.parseAsync(process.argv);