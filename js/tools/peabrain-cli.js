#!/usr/bin/env node
import {Command, program} from "commander";
import fs from "node:fs";
import PeabrainCli from "./PeabrainCli.js";
import Device from "./Device.js";

let peabrainCli=new PeabrainCli();

program
    .name('peabrain')
    .description('Upload scripts to your ESP32 device')
    .option('-p, --port <path>', 'serial port path', '/dev/ttyUSB0')
    .version('0.1.0');

program
    .command('info')
    .option('-p, --port <path>', 'serial port path')
    .action(async (options) => {
        options={...program.opts(),...options};
        await peabrainCli.info(options);
    });

program
    .command('deploy')
    .argument('<file>', 'local JS file to deploy')
    .option('-p, --port <path>', 'serial port path')
    .option('-f, --follow', 'keep port open')
    .action(async (file, options) => {
        options={...program.opts(),...options};
        await peabrainCli.deploy({file, ...options});
    });

program
    .command('start')
    .option('-p, --port <path>', 'serial port path')
    .action(async (options) => {
        options={...program.opts(),...options};
        await peabrainCli.start(options);
    });

program
    .command('stop')
    .option('-p, --port <path>', 'serial port path')
    .action(async (options) => {
        options={...program.opts(),...options};
        await peabrainCli.stop(options);
    });

program
    .command('ls')
    .argument('[dir]', 'dir to list', "/")
    .option('-p, --port <path>', 'serial port path')
    .action(async (dir,options) => {
        await peabrainCli.ls({dir, ...program.opts(), ...options});
    });

program
    .command('cat')
    .argument('<file>', 'file to print')
    .option('-p, --port <path>', 'serial port path')
    .action(async (file,options) => {
        await peabrainCli.cat({file, ...program.opts(), ...options});
    });

program
    .command('rm')
    .argument('<file>', 'file to remove')
    .option('-p, --port <path>', 'serial port path')
    .action(async (file,options) => {
        await peabrainCli.rm({file, ...program.opts(), ...options});
    });

program
    .command('set')
    .argument('<name>', 'setting variable to set')
    .argument('<value>', 'value to set')
    .option('-p, --port <path>', 'serial port path')
    .action(async (name,value,options) => {
        await peabrainCli.set({name, value, ...program.opts(), ...options});
    });

await program.parseAsync(process.argv);
await peabrainCli.close();
