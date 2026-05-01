import {dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from "child_process";

export function getDirname(metaUrl) {
	return dirname(fileURLToPath(metaUrl));
}

export function runCommand(cmd, args = [], options = {}) {
	return new Promise((resolve, reject) => {
		const child = spawn(cmd, args, {
            stdio: "inherit",
			//stdio: ["ignore", "pipe", "pipe"],
			...options,
		});

		let stdout = "";
		let stderr = "";

		if (child.stdout) {
			child.stdout.on("data", d => stdout += d);
		}

		if (child.stderr) {
			child.stderr.on("data", d => stderr += d);
		}

		child.on("error", reject);

		child.on("close", code => {
			if (code === 0) {
				resolve({ code, stdout, stderr });
			} else {
				const err = new Error(`Command failed: ${cmd} ${args.join(" ")}`);
				err.code = code;
				err.stdout = stdout;
				err.stderr = stderr;
				reject(err);
			}
		});
	});
}