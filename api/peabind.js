import fs, {promises as fsp} from "fs";
import JSON5 from "json5";

class Declaration {
    constructor(def, extra={}) {
        if (!def)
            def={};

        if (typeof def=="string")
            def={type: def};

        def={...def,...extra};
        if (!def.binding)
            throw new Error("Missing binding!!!");

        Object.assign(this,def);
        if (!this.type)
            this.type="void";

        if (this.type=="function") {
            if (!this.args)
                this.args=[];

            this.args=this.args.map((x,i)=>new Declaration(x,{
                argnum: i, 
                binding: this.binding,
                name: `arg_${i}`
            }));

            this.return=new Declaration(this.return,{
                binding: this.binding,
                name: "ret"
            });
        }
    }

    genDecl() {
        switch (this.type) {
            case "int":
                return `int ${this.name};\n`;
                break;

            case "string":
                return `std::string ${this.name};\n`;
                break;

            default:
                throw new Error("Can't decl this type: "+this.type);
        }
    }

    genUnpack(jsValueExpr) {
        switch (this.type) {
            case "int":
                return `
                    JS_ToInt32(ctx,&${this.name},${jsValueExpr});
                `;
                break;

            case "string":
                return `
                    const char *${this.name}_=JS_ToCString(ctx,${jsValueExpr});
                    ${this.name}=std::string(${this.name}_);
                    JS_FreeCString(ctx,${this.name}_);
                `;

            default:
                throw new Error("Can't unpack this type: "+this.type);
        }
    }

    genPack() {
        switch (this.type) {
            case "int":
                return `JS_NewUint32(ctx,${this.name})\n`;
                break;

            case "string":
                return `JS_NewString(ctx,${this.name}.c_str())`;

            default:
                throw new Error("Can't pack this type: "+this.type);
        }
    }

    isVoid() {
        return (this.type=="void");
    }

    getTopLevelDefinition() {
        if (this.type!="function")
            throw new Error("Only functions supported at top level");

        let s="";

        s+=`
            static JSValue ${this.binding.prefix}${this.name}(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
                if (argc!=${this.args.length})
                    return JS_ThrowTypeError(ctx, "wrong arg count");
        `;

        s+=`
                ${this.args.map((a,i)=>a.genDecl()).join("\n")}
                ${this.args.map((a,i)=>a.genUnpack(`argv[${i}]`)).join("\n")}
        `;

        if (this.return.isVoid()) {
            s+=`
                    ${this.name}(${this.args.map(a=>a.name).join(",")});
                    return JS_UNDEFINED;
                }
            `;
        }

        else {
            s+=`
                    ${this.return.genDecl()}
                    ret=${this.name}(${this.args.map(a=>a.name).join(",")});
                    return ${this.return.genPack()};
                }
            `;
        }

        return s;
    }

    getTopLevelRegistration() {
        return `
            JSValue reg_${this.name}=JS_NewCFunction(ctx,${this.binding.prefix}${this.name},"${this.name}",0);
            JS_SetPropertyStr(ctx,global,"${this.name}",reg_${this.name});
        `;
    }
}

export class Binding {
    constructor({descriptionFn, outputFn}) {
        this.descriptionFn=descriptionFn;
        this.outputFn=outputFn;
        this.prefix="pea_";
    }

    async init() {
        let descriptionContent=await fsp.readFile(this.descriptionFn,"utf8");
        this.description=JSON5.parse(descriptionContent);
        this.exports=this.description.exports.map(exp=>new Declaration(exp,{binding: this}));
    }

    async generate() {
        await this.init();

        this.declarationSource="";
        this.definitionSource="";

        let source=`
            extern "C" {
            #include "quickjs.h"
            }

            #include <string>

            ${this.description.include.map(inc=>`#include "${inc}"`).join("\n")}
            ${this.exports.map(exp=>exp.getTopLevelDefinition()).join("\n")}

            void ${this.prefix}init(JSContext *ctx) {
                JSValue global=JS_GetGlobalObject(ctx);
                ${this.exports.map(x=>x.getTopLevelRegistration()).join("\n")}
                JS_FreeValue(ctx,global);
            }
        `;

        await fsp.writeFile(this.outputFn,source);
    }
}

export async function peabindGen(options) {
    //console.log("Generating api: "+options.outputFn);
    let peabind=new Binding(options);
    await peabind.generate();
}