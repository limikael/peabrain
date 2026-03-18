import {runCommand} from "../utils/node-util.js";
import path from "path";
import os from "os";
import fs from "fs";

export async function flashnvs({values, port}) {
	console.log("Writing "+Object.keys(values).length+" values to "+port);

	let csvFn=path.join(os.tmpdir(),"flashnvs.csv");
	let binFn=path.join(os.tmpdir(),"flashnvs.bin");

	let csvContent="";
	csvContent+="key,type,encoding,value\n";
	csvContent+="config,namespace,,\n";
	for (let k in values)
		csvContent+=k+",data,u8,"+values[k]+"\n";

	fs.writeFileSync(csvFn,csvContent);

	await runCommand("uvx",[
		"--from","esp-idf-nvs-partition-gen","python","-m","esp_idf_nvs_partition_gen",
		"generate",csvFn,binFn,"0x5000"
	]);

	await runCommand("uvx",[
		"esptool",
		"--port",port,
		"write-flash","0x9000",binFn
	]);
}