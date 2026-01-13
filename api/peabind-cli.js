#!/usr/bin/env node
import {Command, program} from "commander";
import {peabindGen} from "./peabind.js";

program
    .name('peabind')
    .description('JavaScript binding generator')
    .version('0.1.0')
    .argument('<file>', 'Binding descriptor .json file')
    .requiredOption('-o, --output <path>', 'Output file')
    .option('-p, --prefix <path>', 'Prefix for generated symbols')
    .option('-I, --include <path>', 'Include dir where to save include file')
    .action(async (file, options)=>{
    	await peabindGen({
    		descriptionFn: file,
    		outputFn: options.output,
    		prefix: options.prefix
            includeDir: options.include
    	});
    });

await program.parseAsync(process.argv);
