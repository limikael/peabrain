import EventEmitter from "../utils/EventEmitter.js";

export default class Repl extends EventEmitter {
    constructor(serial, model) {
        super();
        this.serial=serial;
        this.line='';
        this.serial.on('data', (chunk) => {
            for (let c of chunk)
                this.handleInput(String(c));
        });

        this.serial.write('> ');
        this.escapeMode=false;
        this.model=model;
    }

    handleInput(char) {
        if (this.escapeMode) {
            this.line+=char;
            if (char=="\n") {
                let messageId;
                try {
                    let message=JSON.parse(this.line);
                    messageId=message.id;
                    let res=this.model[message.method](...message.params);
                    this.serial.write("\u001b"+JSON.stringify({
                        id: message.id,
                        result: res
                    })+"\n");
                }

                catch (e) {
                    this.serial.write("\u001b"+JSON.stringify({
                        id: messageId,
                        error: {
                            message: String(e)
                        }
                    })+"\n");
                }

                this.escapeMode=false;
                this.line="";
            }
            return;
        }

        switch (String(char)) {
            case "\u001b":
                this.escapeMode=true;
                this.line="";
                break;

            case "\u0008":
            case "\u007f":
                if (this.line.length > 0) {
                    this.line = this.line.slice(0, -1);
                    // move cursor back, clear char
                    this.serial.write('\b \b');
                }
                break;

            case "\n":
                this.serial.write('\n');
                if (this.line.trim().length) {
                    try {
                        let res=global.eval(this.line);
                        this.serial.write(String(res)+"\n");
                    }

                    catch (e) {
                        this.serial.write(e.name+": "+e.message+"\n");
                    }
                }

                this.serial.write('> ');
                this.line = '';
                break;

            default:
                this.line+=char;
                this.serial.write(char);
                break;
        }
    }
}
