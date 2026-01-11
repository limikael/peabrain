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

    genFunctionCall() {
        if (this.type!="function")
            throw new Error("Only functions supported at top level");

        if (this.return.isVoid())
            return `
                ${this.name}(${this.args.map(a=>a.name).join(",")});
                return JS_UNDEFINED;
            `;

        return `
            ${this.return.genDecl()}
            ret=${this.name}(${this.args.map(a=>a.name).join(",")});
            return ${this.return.genPack()};
        `;
    }

    getTopLevelDefinition() {
        switch (this.type) {
            case "function":
                return `
                    static JSValue ${this.binding.prefix}${this.name}(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
                        if (argc!=${this.args.length}) return JS_ThrowTypeError(ctx, "wrong arg count");

                        ${this.args.map((a,i)=>a.genDecl()).join("\n")}
                        ${this.args.map((a,i)=>a.genUnpack(`argv[${i}]`)).join("\n")}

                        ${this.genFunctionCall()}
                    }
                `
                break;

            case "class":
                return `
                    static JSClassID ${this.name}_classid=0;
                    static JSValue ${this.name}_ctor(JSContext *ctx, JSValueConst new_target, int argc, JSValueConst *argv) {
                        ${this.name}* instance=new ${this.name}();
                        JSValue obj=JS_NewObjectClass(ctx, ${this.name}_classid);
                        JS_SetOpaque(obj,instance);
                        return obj;
                    }
                    static void ${this.name}_finalizer(JSRuntime *rt, JSValue obj) {
                        ${this.name}* instance=(${this.name}*)JS_GetOpaque(obj,${this.name}_classid);
                        delete instance;
                    }
                `;
                break;

            default:
                throw new Error("Only functions can classes supported at top level");
        }
    }

    getTopLevelRegistration() {
        switch (this.type) {
            case "function":
                return `
                    JSValue ${this.name}_func=JS_NewCFunction(ctx,${this.binding.prefix}${this.name},"${this.name}",0);
                    JS_SetPropertyStr(ctx,global,"${this.name}",${this.name}_func);
                `;

            case "class":
                return `
                    if (!${this.name}_classid) JS_NewClassID(&${this.name}_classid);

                    JSClassDef ${this.name}_def={.class_name="${this.name}", .finalizer=${this.name}_finalizer};
                    JS_NewClass(JS_GetRuntime(ctx),${this.name}_classid,&${this.name}_def);

                    JSValue ${this.name}_proto=JS_GetClassProto(ctx,${this.name}_classid);
                    JSValue ${this.name}_ctorval = JS_NewCFunction2(ctx, ${this.name}_ctor, "${this.name}", 0, JS_CFUNC_constructor,0);
                    JS_SetConstructor(ctx, ${this.name}_ctorval, ${this.name}_proto);
                    JS_SetPropertyStr(ctx, global, "${this.name}", ${this.name}_ctorval);
                    JS_FreeValue(ctx, ${this.name}_proto);
                `;
                break;

            default:
                throw new Error("Only functions can classes supported at top level");
        }
    }
}

function autoIndent(text, indentSize=4) {
    const lines = text.split('\n');
    let result = [];
    let indentLevel = 0;

    for (let line of lines) {
        // Strip whitespace from the line
        const trimmedLine = line.trim();
        
        // Skip empty lines
        if (trimmedLine === '') {
            continue;
        }
        
        // Decrease indent level if line starts with '}'
        if (trimmedLine.startsWith('}')) {
            indentLevel = Math.max(0, indentLevel - 1);
        }
        
        // Add indentation
        const indentation = ' '.repeat(indentLevel * indentSize);
        result.push(indentation + trimmedLine);
        
        // Increase indent level if line ends with '{'
        if (trimmedLine.endsWith('{')) {
            indentLevel++;
        }
    }
    
    return result.join('\n');
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

        let source=autoIndent(`
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
        `);

        await fsp.writeFile(this.outputFn,source);
    }
}

export async function peabindGen(options) {
    //console.log("Generating api: "+options.outputFn);
    let peabind=new Binding(options);
    await peabind.generate();
}