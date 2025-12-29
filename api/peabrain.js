#!/usr/bin/env node
import {Command, program} from "commander";
import fs from "node:fs";
import Device from "./Device.js";

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
            const content = fs.readFileSync(file, 'utf8');
            const device = new Device(options.port);
            console.log(`Deploy: ${file}`);
            await device.writeFile('/boot.js', content);
            /*await device.scheduleReload();
            await new Promise(resolve=>{
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

await program.parseAsync(process.argv);