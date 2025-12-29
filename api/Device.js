import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import EventEmitter from "node:events";

export default class Device extends EventEmitter {
  constructor(portPath, baudRate = 112500) {
    super();
    this.port = new SerialPort({ path: portPath, baudRate });
    this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\n' }));
    this.nextId = 1;
    this.pending = new Map();

    /*this.port.on("data",data=>{
      process.stdout.write(data);
    });*/

    this.parser.on('data', (line) => {
      line=line.trim().replace(/^>+|>+$/g, '').trim();

      let msg;
      try {
        msg = JSON.parse(line);
      } catch (e) {
        console.log(line);
        return;
      }

      //console.log(msg);

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

    return new Proxy(this, {
      get: (target, prop) => {
        // Allow access to internal properties
        if (prop in target) return target[prop];

        // Otherwise, treat any method call as RPC
        return (...args) => target.call(prop, args);
      }
    });
  }

  async call(method, params = []) {
    const id = this.nextId++;
    const msg = { type: 'call', id, method, params };
    let data=JSON.stringify(msg) + '\n';

    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.port.write(data);
    });
  }

  async close() {
    await this.port.close();
  }
}
