#!/usr/bin/env node
import {Command, program} from "commander";
import fs from "node:fs";
import PeabrainCli from "./PeabrainCli.js";
import Device from "./Device.js";

let peabrainCli=new PeabrainCli();

program
    .name('peabrain')
    .description('Upload scripts to your ESP32 device')
    .version('0.1.0');

program
    .command('deploy')
    .argument('<file>', 'local JS file to deploy')
    .option('-p, --port <path>', 'serial port path', '/dev/ttyUSB0')
    .option('-f, --follow', 'keep port open')
    .action(async (file, options) => {
        await peabrainCli.deploy({file, ...options});
    });

program
    .command('start')
    .option('-p, --port <path>', 'serial port path', '/dev/ttyUSB0')
    .action(async (options) => {
        await peabrainCli.start(options);
    });

program
    .command('stop')
    .option('-p, --port <path>', 'serial port path', '/dev/ttyUSB0')
    .action(async (options) => {
        await peabrainCli.stop(options);
    });

await program.parseAsync(process.argv);
await peabrainCli.close();
