#!/usr/bin/env node
import {Command, program} from "commander";
import {deviceCommand} from "./Device.js";
import * as commands from "./peabrain-commands.js";

program
    .name('peabrain')
    .description('Upload scripts to your ESP32 device')
    .option('-s, --serial <path>', 'serial port path', '/dev/ttyUSB0')
    .option('-h, --host <host>', 'JSON RPC host')
    .version('0.1.0');

program
    .command('info')
    .description("Show runtime info.")
    .action(deviceCommand(commands.peabrainInfo));

program
    .command('ls')
    .description("List files on device.")
    .argument('[dir]', 'dir to list', "/")
    .action(deviceCommand(commands.peabrainLs));

program
    .command('cat')
    .description("Download and print file on device.")
    .argument('<file>', 'file to print')
    .action(deviceCommand(commands.peabrainCat));

program
    .command('rm')
    .description("Remove file on device.")
    .argument('<file>', 'file to remove')
    .action(deviceCommand(commands.peabrainRm));

program
    .command('set')
    .description("Set a config value.")
    .argument('<name>', 'setting variable to set')
    .argument('<value>', 'value to set')
    .action(deviceCommand(commands.peabrainSet));

program
    .command('start')
    .description("Stop current program.")
    .action(deviceCommand(commands.peabrainStart));

program
    .command('stop')
    .description("Stop current program.")
    .action(deviceCommand(commands.peabrainStop));

program
    .command('deploy')
    .description("Build, deploy and start program from file.")
    .argument('<file>', 'local JS file to deploy')
    .option('-f, --follow', 'keep port open')
    .action(deviceCommand(commands.peabrainDeploy));

await program.parseAsync(process.argv);
