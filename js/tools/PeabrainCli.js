import * as esbuild from "esbuild";
import path from "node:path";
import {esbuildGlobalImportPlugin} from "../utils/esbuild-util.js";
import Device from "./Device.js";
import {stringChunkify} from "../utils/js-util.js";
import {getDirname} from "../utils/node-util.js";

const __dirname=getDirname(import.meta.url);

export default class PreabrainCli {
    init(options) {
        if (!this.device)
            this.device=new Device(options.port);

        return this.device;
    }

    async close() {
        if (this.device) {
            await this.device.close();
            this.device=null;
        }
    }

    async start(options) {
        console.log(`Starting...`);
        this.init(options);
        await this.device.scheduleReload();
        await this.awaitStarted();
    }

    async stop(options) {
        console.log(`Stopping...`);
        this.init(options);
        await this.device.scheduleReload(false);
        await this.awaitStarted();
    }

    async awaitStarted() {
        await new Promise(resolve=>{
            this.device.on("message",message=>{
                if (message.type=="started")
                    resolve();
            });
        });
    }

    async deploy(options) {
        this.init(options);

        console.log(`Deploy: ${options.file}`);

        let jsxRuntimeFn=path.join(__dirname,"../ui/jsx-runtime.js");
        let peabrainExportsFn=path.join(__dirname,"../exports/exports.js");
        const result = await esbuild.build({
            entryPoints: [options.file],
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
        await this.stop(options);

        //let device=this.getDevice(options);
        let contents=stringChunkify(source,64);
        let fid=await this.device.fileOpen("/boot.js", "w");
        for (let content of contents)
            await this.device.fileWrite(fid,content);

        await this.device.fileClose(fid);

        await this.start(options);

        if (options.follow)
            await new Promise(r=>{});

        /*await device.scheduleReload();

        await new Promise(resolve=>{
            device.on("message",message=>{
                if (message.type=="started")
                    resolve();
            });
        });

        await device.close();*/
    }
}