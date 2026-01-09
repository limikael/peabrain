import * as esbuild from "esbuild";
import path from "node:path";
import {esbuildGlobalImportPlugin} from "./esbuild-util.js";
import Device from "./Device.js";
import {stringChunkify} from "./js-util.js";

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
        await this.stop(options);

        console.log(`Deploy: ${options.file}`);
        const result = await esbuild.build({ // entryPoints instead...
            entryPoints: [options.file],
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
        //let device=this.getDevice(options);
        let contents=stringChunkify(source,64);
        let fid=await this.device.fileOpen("/boot.js", "w");
        for (let content of contents)
            await this.device.fileWrite(fid,content);

        await this.device.fileClose(fid);

        await this.start(options);

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