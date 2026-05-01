import Repl from "../api/Repl.js";

function createStdSerial() {
	process.stdin.setRawMode(true);
	return {
		write(data) {
			process.stdout.write(data);
		},
		on(event, cb) {
			if (event === 'data') process.stdin.on('data', cb);
		}
	};
}

let repl=new Repl(createStdSerial());
