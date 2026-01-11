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

        if (this.type=="function" || this.type=="class") {
            if (!this.args)
                this.args=[];

            this.args=this.args.map((x,i)=>new Declaration(x,{
                argnum: i, 
                binding: this.binding,
                name: `arg_${i}`
            }));
        }

        if (this.type=="function") {
            this.return=new Declaration(this.return,{
                binding: this.binding,
                name: "ret"
            });
        }

        if (this.type=="class") {
            if (!this.methods)
                this.methods=[];

            this.methods=this.methods.map(m=>new Declaration(m,{
                class: this,
                binding: this.binding,
                type: "function",
            }));
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

        let name=this.name;
        if (this.class)
            name=`instance->${this.name}`;

        if (this.return.isVoid())
            return `
                ${name}(${this.args.map(a=>a.name).join(",")});
                return JS_UNDEFINED;
            `;

        return `
            ${this.return.genDecl()}
            ret=${name}(${this.args.map(a=>a.name).join(",")});
            return ${this.return.genPack()};
        `;
    }

    getTopLevelDefinition() {
        switch (this.type) {
            case "function":
                if (this.class) {
                    return `
                        static JSValue ${this.binding.prefix}${this.class.name}_${this.name}(JSContext *ctx, JSValueConst thisobj, int argc, JSValueConst *argv) {
                            if (argc!=${this.args.length}) return JS_ThrowTypeError(ctx, "wrong arg count");

                            ${this.args.map((a,i)=>a.genDecl()).join("\n")}
                            ${this.args.map((a,i)=>a.genUnpack(`argv[${i}]`)).join("\n")}

                            ${this.class.name}* instance=(${this.class.name}*)JS_GetOpaque(thisobj,${this.binding.prefix}${this.class.name}_classid);

                            ${this.genFunctionCall()}
                        }
                    `;
                }

                else {
                    return `
                        static JSValue ${this.binding.prefix}${this.name}(JSContext *ctx, JSValueConst thisobj, int argc, JSValueConst *argv) {
                            if (argc!=${this.args.length}) return JS_ThrowTypeError(ctx, "wrong arg count");

                            ${this.args.map((a,i)=>a.genDecl()).join("\n")}
                            ${this.args.map((a,i)=>a.genUnpack(`argv[${i}]`)).join("\n")}

                            ${this.genFunctionCall()}
                        }
                    `;
                }
                break;

            case "class":
                return `
                    static JSClassID ${this.binding.prefix}${this.name}_classid=0;
                    static JSValue ${this.binding.prefix}${this.name}_ctor(JSContext *ctx, JSValueConst new_target, int argc, JSValueConst *argv) {
                        if (argc!=${this.args.length}) return JS_ThrowTypeError(ctx, "wrong arg count");

                        ${this.args.map((a,i)=>a.genDecl()).join("\n")}
                        ${this.args.map((a,i)=>a.genUnpack(`argv[${i}]`)).join("\n")}

                        ${this.name}* instance=new ${this.name}(${this.args.map(a=>a.name).join(",")});
                        //JSValue proto=JS_GetClassProto(ctx,${this.binding.prefix}${this.name}_classid);
                        //JSValue obj=JS_NewObjectProtoClass(ctx,proto,${this.binding.prefix}${this.name}_classid);
                        //JS_FreeValue(ctx, proto);
                        JSValue obj=JS_NewObjectClass(ctx,${this.binding.prefix}${this.name}_classid);
                        JS_SetOpaque(obj,instance);
                        return obj;
                    }
                    static void ${this.binding.prefix}${this.name}_finalizer(JSRuntime *rt, JSValue obj) {
                        ${this.name}* instance=(${this.name}*)JS_GetOpaque(obj,${this.binding.prefix}${this.name}_classid);
                        delete instance;
                    }
                    ${this.methods.map(m=>m.getTopLevelDefinition()).join("\n")}
                `;
                break;

            default:
                throw new Error("Only functions can classes supported at top level");
        }
    }

    getTopLevelRegistration() {
        let s="";

        switch (this.type) {
            case "function":
                return `
                    JS_SetPropertyStr(ctx,global,"${this.name}",JS_NewCFunction(ctx,${this.binding.prefix}${this.name},"${this.name}",0));
                `;

            case "class":
                s+=`
                    if (!${this.binding.prefix}${this.name}_classid) JS_NewClassID(&${this.binding.prefix}${this.name}_classid);

                    JSClassDef ${this.name}_def={.class_name="${this.name}", .finalizer=${this.binding.prefix}${this.name}_finalizer};
                    JS_NewClass(JS_GetRuntime(ctx),${this.binding.prefix}${this.name}_classid,&${this.name}_def);

                    JSValue ${this.name}_proto=JS_NewObject(ctx);
                    JS_SetClassProto(ctx, ${this.binding.prefix}${this.name}_classid,${this.name}_proto);

                    JSValue ${this.name}_ctorval=JS_NewCFunction2(ctx,${this.binding.prefix}${this.name}_ctor,"${this.name}",0,JS_CFUNC_constructor,0);
                    JS_SetConstructor(ctx,${this.name}_ctorval,${this.name}_proto);
                    JS_SetPropertyStr(ctx,global,"${this.name}",${this.name}_ctorval);
                `;

                s+=this.methods.map(m=>`
                    JS_SetPropertyStr(ctx,${this.name}_proto,"${m.name}",JS_NewCFunction(ctx, ${this.binding.prefix}${this.name}_${m.name},"${m.name}",0));
                `).join("\n");

                s+=`
                `;

                return s;
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