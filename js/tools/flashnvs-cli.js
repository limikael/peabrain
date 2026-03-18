#!/usr/bin/env node
import {flashnvs} from "./flashnvs.js";
import {Command, program} from "commander";
import fs, {promises as fsp} from "fs";

program
    .name('flashnvs')
    .description('Flash json to non volatile storage on ESP device')
    .version('0.1.0')
    .option("-f, --file <file>","Get values from json file")
    .option(
        "-D, --define <key=value>", 
        "Define values.",
        (value, previous = []) => {
            previous.push(value);
            return previous;
        }
    )
    .option('-p, --port <port>', 'Port to upload to.')
    .action(async (options)=>{
		let values={}; 
		if (options.file)
			values={...values,...JSON.parse(fs.readFileSync(options.file))};

		if (options.define) {
	        let defines=Object.fromEntries(options.define.map(e=>
	            ([e.slice(0,e.indexOf("=")),parseInt(e.slice(e.indexOf("=")+1))])
	        ));
			values={...values,...defines};
		}

		if (!Object.keys(values).length) {
			program.help();
		}

    	await flashnvs({
    		values,
    		port: options.port
    	});
    });

await program.parseAsync(process.argv);
