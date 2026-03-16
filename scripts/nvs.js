#!/usr/bin/env node

import {runCommand} from "../js/utils/node-util.js";
import fs, {promises as fsp} from "fs";
import ini from "ini";

await runCommand("uvx",[
	"--from","esp-idf-nvs-partition-gen","python","-m","esp_idf_nvs_partition_gen",
	"generate","scripts/nvs.csv","target/nvs.bin","0x5000"
]);

const config=ini.parse(await fsp.readFile("platformio.ini", "utf8"));
console.log("Flashing NV to: "+config.conf.port);

await runCommand("python",[
	"/home/micke/.platformio/packages/tool-esptoolpy/esptool.py",
	"--port",config.conf.port,
	"write_flash","0x9000","target/nvs.bin"
]);
