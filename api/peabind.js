import fs, {promises as fsp} from "fs";
import JSON5 from "json5";

class Declaration {
    constructor(def) {
        Object.assign(this,def);
    }

    getDeclarationForCall() {
        switch (this.type) {
            case "int":
                return `
                    int arg_${this.argnum};
                    JS_ToInt32(ctx,&arg_${this.argnum},argv[${this.argnum}]);

                `;
                break;

            default:
                throw new Error("Can't use this type: "+this.type);
        }
    }

    getCallParam() {
        return `arg_${this.argnum}`;
    }
}

export class Peabind {
    constructor({descriptionFn, outputFn}) {
        this.descriptionFn=descriptionFn;
        this.outputFn=outputFn;
        this.prefix="pea_";
    }

    async init() {
        let descriptionContent=await fsp.readFile(this.descriptionFn,"utf8");
        this.description=JSON5.parse(descriptionContent);
        this.exports=this.description.exports;
    }

    processFunction(exp) {
        if (!exp.args)
            exp.args=[];

        let args=exp.args.map((x,i)=>new Declaration({...x, argnum: i}));

        this.declarationSource+=`
            static JSValue ${this.prefix}${exp.name}(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
        `;

        for (let i=0; i<args.length; i++)
            this.declarationSource+=args[i].getDeclarationForCall();

        let callParams=args.map(a=>a.getCallParam()).join(",");

        if (exp.return=="void" || !exp.return) {
            this.declarationSource+=`
                    ${exp.name}(${callParams});
                    return JS_UNDEFINED;
                }
            `;
        }

        else {
            this.declarationSource+=`
                    int ret=${exp.name}(${callParams});
                    return JS_NewUint32(ctx, ret);
                }
            `;
        }

        this.definitionSource+=`
            JSValue reg_${exp.name}=JS_NewCFunction(ctx,${this.prefix}${exp.name},"${exp.name}",0);
            JS_SetPropertyStr(ctx,global,"${exp.name}",reg_${exp.name});
        `;
    }

    async generate() {
        await this.init();

        this.declarationSource="";
        this.definitionSource="";

        this.declarationSource+=`
            extern "C" {
            #include "quickjs.h"
            }
        `;

        for (let inc of this.description.include)
            this.declarationSource+=`
                #include "${inc}"
            `;

        this.definitionSource+=`
            void ${this.prefix}init(JSContext *ctx) {
                JSValue global=JS_GetGlobalObject(ctx);
        `;

        for (let exp of this.exports) {
            switch (exp.type) {
                case "function":
                    this.processFunction(exp);
                    break;

                default:
                    throw new Error("Unknown export type: "+exp.type);
                    break;
            }
        }

        this.definitionSource+=`
                JS_FreeValue(ctx,global);
            }
        `;

        let source=this.declarationSource+this.definitionSource;
        //console.log(source);

        await fsp.writeFile(this.outputFn,source);
    }
}

export async function peabindGen(options) {
    //console.log("Generating api: "+options.outputFn);
    let peabind=new Peabind(options);
    await peabind.generate();
}