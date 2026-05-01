#!/usr/bin/env node
import {Command, Option, program} from "commander";
import {peakernelLoad, loadProjectEnv, getProjectCwd} from "peakernel";
import {dirnameFromImportMeta} from "../utils/node-util.js";
import path from "node:path";

let __dirname=dirnameFromImportMeta(import.meta);

loadProjectEnv();
let cwd=getProjectCwd();
let chain=await peakernelLoad({cwd, roots: [path.join(__dirname,"../..")]});

program
    .name('peabrain')
    .description('Frugal Industrial Controller (FIC).')
    .option("--cwd <cwd>","Project dir.",cwd)
    .addOption(new Option("-p, --port <port>","How to reach peabrain.").env("PEAKERNEL_PORT"))

await chain.configCli({chain, program});

try {
    await program.parseAsync(process.argv);
}

catch (e) {
    if (!e.declared)
        throw e;

    console.log(e.message);
    process.exit(1);
}