import {SerialPort} from 'serialport';
import {ReadlineParser} from '@serialport/parser-readline';
import EventEmitter from "node:events";
import {withUnified} from "../utils/commander-util.js";
import {stringChunkify} from "../utils/js-util.js";

class SerialDeviceConnection extends EventEmitter {
	constructor({path, baudRate}) {
		super();

        if (!baudRate)
            baudRate=112500;

		this.port = new SerialPort({path, baudRate});
		this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\n' }));
		this.nextId = 1;
		this.pending = new Map();

		this.parser.on('data', (line) => {
			line=line.trim().replace(/^>+|>+$/g, '').replace("\u001b","").trim();

			let msg;
			try {
				msg = JSON.parse(line);
			} catch (e) {
				console.log(line);
				return;
			}

			if (!msg) {
				console.log(line);
				return;
			}

			if (!msg.id) {
				this.emit("message",msg);
			}

			if (msg.id != null && this.pending.has(msg.id) && !msg.method) {
				const { resolve, reject } = this.pending.get(msg.id);
				this.pending.delete(msg.id);
				if (msg.error) reject(new Error(msg.error.message || msg.error));
				else resolve(msg.result);
			}
		});
	}

	async call(method, params = []) {
		const id = this.nextId++;
		const msg = { type: 'call', id, method, params };
		let data="\u001b"+JSON.stringify(msg)+"\n";

		return new Promise((resolve, reject) => {
			this.pending.set(id, { resolve, reject });
			this.port.write(data);
		});
	}

	async close() {
		await this.port.close();
	}

	async awaitStarted() {
	    await new Promise(resolve=>{
	        this.on("message",message=>{
	            if (message.type=="started")
	                resolve();
	        });
	    });
	}
}

class JsonRpcDeviceConnection {
	constructor({host, port}) {
		if (!port)
			port=80;

		this.url=`http://${host}:${port}/`;
	}

	async call(method, params=[]) {
		let response=await fetch(this.url,{
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				method: method,
				params: params
			})
		});

		let resultObj=await response.json();
		return resultObj.result;
	}

	async close() {}
	async awaitStarted() {
		console.log("Start/stop...");

		//await timeout(1000,async ()=>{
			await new Promise(r=>setTimeout(r,250));
			await this.call("getInfo");
		//});
	}
}

export default class Device {
	constructor({serial, baudRate, host, port}) {
		if (host)
			this.connection=new JsonRpcDeviceConnection({host, port})

		else if (serial)
			this.connection=new SerialDeviceConnection({path: serial, baudRate});

		else throw new Error("Not connection specified");

		return new Proxy(this, {
			get: (target, prop) => {
				if (prop in target) return target[prop];
				return (...args) => target.connection.call(prop, args);
			}
		});
	}

	async close() {
		await this.connection.close();
	}

    async readFile(fn) {
        let fid=await this.fileOpen(fn, "r");
        let content="";
        let s;

        do {
            s=await this.fileRead(fid,64);
            content+=s;
        } while (s.length);

        await this.fileClose(fid);

        return content;
    }

    async writeFile(fn, content) {
        let chunks=stringChunkify(content,64);
        let fid=await this.fileOpen(fn, "w");
        for (let chunk of chunks)
            await this.fileWrite(fid,chunk);

        await this.fileClose(fid);
    }

    async awaitStarted() {
    	await this.connection.awaitStarted();
    }
}

export function deviceCommand(fn) {
    return withUnified(async options=>{
        options.device=new Device(options);
        await fn(options);
        await options.device.close();
    });
}