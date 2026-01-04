import EventEmitter from "./EventEmitter.js";
import {safeJsonParse} from "./js-util.js";

export default class Repl extends EventEmitter {
    constructor(serial) {
        super();
        this.serial = serial;
        this.line = '';
        this.serial.on('data', (chunk) => {
            //this.serial.write(chunk);
            //this.serial.write("chunk: "+chunk+"\n");

            for (let c of chunk)
                this.handleInput(c);
                //this.serial.write(c);

        });
        this.on("line",line=>this.handleLine(line));

        this.prompt();
    }

    prompt() {
        this.serial.write('> ');
        this.line = '';
    }

    handleLine(line) {
        try {
            let res=global.eval(line);
            this.serial.write(String(res));
            this.serial.write("\n");
        }

        catch (e) {
            this.serial.write("\n");
            this.serial.write("\n");
            this.serial.write("\n");
            this.serial.write("Line: "+line);
            this.serial.write("\n");
            this.serial.write("The Error: "+e.message);
            this.serial.write("\n");
        }
    }

    handleInput(char) {
        char=String(char);

        // Handle Ctrl+C to exit
        if (char === '\u0003') {
            this.serial.write("^C\n");
            this.prompt();
            return;
        }

        // Handle Enter
        if (char === '\n' /* || char === '\r'*/) {
            //this.serial.write("****** enter *********\n");
            this.serial.write('\n');
            let message=safeJsonParse(this.line);
            if (message && this.line.trim().startsWith("{"))
                this.emit("message",message);

            else if (this.line.trim().length)
                this.emit("line",this.line);

            this.line = '';
            this.prompt();
            return;
        }

        // Handle Backspace
        if (char === '\u0008' || char === '\u007f') {
            if (this.line.length > 0) {
                this.line = this.line.slice(0, -1);
                // move cursor back, clear char
                this.serial.write('\b \b');
            }
            return;
        }

        // Normal character
        this.line += char;
        this.serial.write(char);
    }
}
