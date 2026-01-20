import fs, {promises as fsp} from "fs";
import JSON5 from "json5";
import path from "path";

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

        if (this.type=="function" || this.type=="class") { // should also do events...
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

            if (!this.events)
                this.events=[];

            this.events=this.events.map(e=>new Declaration(e,{
                class: this,
                binding: this.binding,
                type: "event",
            }));
        }
    }

    genDecl() {
        switch (this.type) {
            case "int":
                return `int32_t ${this.name};\n`;
                break;

            case "string":
                return `std::string ${this.name};\n`;
                break;

            case "function":
                return `std::function<void()> ${this.name};\n`;
                break;

            default:
                let decl=this.binding.getClassDeclarationByName(this.type);
                switch (this.ref) {
                    case "ref":
                        //return `${decl.name}& ${this.name};\n`;
                        break;

                    default:
                        return `${decl.name}* ${this.name};\n`;
                        break;
                }
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

            case "function":
                return `
                    JSValue ${this.name}_=${jsValueExpr};
                    ${this.name}=[ctx,${this.name}_]() {
                        JSValue ret=JS_Call(ctx,${this.name}_,JS_UNDEFINED,0,NULL);
                        /*if (JS_IsException(ret)) {
                            JSValue err=jsEngine->getExceptionMessage();
                            jsEngine->printJsValue(err);
                            JS_FreeValue(ctx,err);
                        }*/

                        if (JS_IsException(ret)) {
                            throw std::runtime_error("Javascript callback threw error.");
                        }

                        JS_FreeValue(ctx,ret);
                    };
                `;
                break;

            default:
                let decl=this.binding.getClassDeclarationByName(this.type);
                switch (this.ref) {
                    case "ref":
                        return `
                            ${this.binding.prefix}opaque_t* opaque=(${this.binding.prefix}opaque_t*)JS_GetOpaque(${jsValueExpr},${this.binding.prefix}${decl.name}_classid);
                            ${decl.name}& ${this.name}=*(${decl.name}*)opaque->instance;
                        `;
                        break;

                    default:
                        return `
                            ${this.binding.prefix}opaque_t* opaque=(${this.binding.prefix}opaque_t*)JS_GetOpaque(${jsValueExpr},${this.binding.prefix}${decl.name}_classid);
                            ${this.name}=(${decl.name}*)opaque->instance;
                        `;
                        break;
                }
        }
    }

    genPack(jsValueVar) {
        switch (this.type) {
            case "int":
                return `${jsValueVar}=JS_NewUint32(ctx,${this.name});\n`;
                break;

            case "string":
                return `${jsValueVar}=JS_NewString(ctx,${this.name}.c_str());\n`;

            case "function":
                throw new Error("pack!!!");
                break;

            default:
                let decl=this.binding.getClassDeclarationByName(this.type);
                switch (this.ref) {
                    case "owned_ptr":
                    case "owned_ref":
                        return `
                            ${jsValueVar}=JS_NewObjectClass(ctx,${this.binding.prefix}${decl.name}_classid);
                            JS_SetOpaque(${jsValueVar},${this.binding.prefix}opaque_create(${this.name},true));
                        `;

                    case "borrowed_ptr":
                    case "borrowed_ref":
                        return `
                            ${jsValueVar}=JS_NewObjectClass(ctx,${this.binding.prefix}${decl.name}_classid);
                            JS_SetOpaque(${jsValueVar},${this.binding.prefix}opaque_create(${this.name},false));
                        `;

                    default:
                        throw new Error("unknown ref type: "+this.ref);
                }
        }
    }

    isVoid() {
        return (this.type=="void");
    }

    genFunctionCall() {
        if (this.type!="function")
            throw new Error("Only functions supported at top level");

        //console.log("**** ref: "+this.return.ref);

        let name=this.name;
        if (this.template)
            name=`${name}<${this.template}>`

        if (this.class) {
            if (["borrowed_ref","owned_ref"].includes(this.return.ref))
                name=`&instance->${name}`;

            else
                name=`instance->${name}`;
        }

        if (this.return.isVoid())
            return `
                ${name}(${this.args.map(a=>a.name).join(",")});
                return JS_UNDEFINED;
            `;

        return `
            ${this.return.genDecl()}
            ret=${name}(${this.args.map(a=>a.name).join(",")});
            JSValue retval=JS_UNDEFINED;
            ${this.return.genPack("retval")}
            return retval;
        `;
    }

    getEventComparision() {
        return `
            if (!strcmp(eventName,"${this.name}")) dispatcher=&instance->${this.dispatcher};
        `;
    }

    getEventsDefinition() {
        if (!this.events.length)
            return "";

        return `
            static JSValue ${this.binding.prefix}${this.name}_on(JSContext *ctx, JSValueConst thisobj, int argc, JSValueConst *argv) {
                if (argc!=2) return JS_ThrowTypeError(ctx, "wrong arg count");

                ${this.binding.prefix}opaque_t* opaque=(${this.binding.prefix}opaque_t*)JS_GetOpaque(thisobj,${this.binding.prefix}${this.name}_classid);
                ${this.name}* instance=(${this.name}*)opaque->instance;

                const char *eventName=JS_ToCString(ctx,argv[0]);
                Dispatcher<> *dispatcher;

                ${this.events.map(e=>e.getEventComparision())}
                JS_FreeCString(ctx,eventName);
                if (!dispatcher) return JS_ThrowTypeError(ctx, "unknown event");

                void* identity=JS_VALUE_GET_PTR(argv[1]);
                if (dispatcher->getIdByIdentity(identity)) return JS_UNDEFINED; // existing

                JSValue fnDup=JS_DupValue(ctx,argv[1]);
                int id=dispatcher->on([ctx, fnDup]() {
                    JSValue ret=JS_Call(ctx, fnDup, JS_UNDEFINED, 0, NULL);
                    JS_FreeValue(ctx,ret);
                });

                ${this.binding.prefix}listener_t *l=new ${this.binding.prefix}listener_t {
                    .dispatcher=dispatcher,
                    .id=id
                };

                dispatcher->setIdentity(id,identity);
                dispatcher->setDestructor(id,[ctx, fnDup]() {
                    JS_FreeValue(ctx,fnDup);
                });

                return JS_UNDEFINED;
            }

            static JSValue ${this.binding.prefix}${this.name}_off(JSContext *ctx, JSValueConst thisobj, int argc, JSValueConst *argv) {
                if (argc>2 || argc<1) return JS_ThrowTypeError(ctx, "wrong arg count");

                ${this.binding.prefix}opaque_t* opaque=(${this.binding.prefix}opaque_t*)JS_GetOpaque(thisobj,${this.binding.prefix}${this.name}_classid);
                ${this.name}* instance=(${this.name}*)opaque->instance;

                const char *eventName=JS_ToCString(ctx,argv[0]);
                Dispatcher<> *dispatcher=nullptr;

                ${this.events.map(e=>e.getEventComparision())}
                JS_FreeCString(ctx,eventName);
                if (!dispatcher) return JS_ThrowTypeError(ctx, "unknown event");

                if (argc==1) {
                    dispatcher->off();
                    return JS_UNDEFINED;
                }

                JSValueConst fn = argv[1];
                void* identity = JS_VALUE_GET_PTR(fn);

                int id=dispatcher->getIdByIdentity(identity);
                if (id) dispatcher->off(id);

                return JS_UNDEFINED;
            }
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

                            ${this.binding.prefix}opaque_t* opaque=(${this.binding.prefix}opaque_t*)JS_GetOpaque(thisobj,${this.binding.prefix}${this.class.name}_classid);
                            //${this.class.name}* instance=(${this.class.name}*)JS_GetOpaque(thisobj,${this.binding.prefix}${this.class.name}_classid);
                            ${this.class.name}* instance=(${this.class.name}*)opaque->instance;

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
                    static JSValue ${this.binding.prefix}${this.name}_ctor(JSContext *ctx, JSValueConst new_target, int argc, JSValueConst *argv) {
                        if (argc!=${this.args.length}) return JS_ThrowTypeError(ctx, "wrong arg count");

                        ${this.args.map((a,i)=>a.genDecl()).join("\n")}
                        ${this.args.map((a,i)=>a.genUnpack(`argv[${i}]`)).join("\n")}

                        ${(this.constructable!==false)?`
                            ${this.name}* instance=new ${this.name}(${this.args.map(a=>a.name).join(",")});
                            JSValue obj=JS_NewObjectClass(ctx,${this.binding.prefix}${this.name}_classid);
                            JS_SetOpaque(obj,${this.binding.prefix}opaque_create(instance,true));
                            return obj;
                        `:`
                            return JS_ThrowTypeError(ctx, "abstract");
                        `}
                    }
                    static void ${this.binding.prefix}${this.name}_finalizer(JSRuntime *rt, JSValue obj) {
                        ${this.binding.prefix}opaque_t* opaque=(${this.binding.prefix}opaque_t*)JS_GetOpaque(obj,${this.binding.prefix}${this.name}_classid);
                        if (opaque->owned) {
                            ${this.name}* instance=(${this.name}*)opaque->instance;
                            delete instance;
                        }

                        free(opaque);
                    }
                    ${this.methods.map(m=>m.getTopLevelDefinition()).join("\n")}

                    ${this.getEventsDefinition()}
                `;
                break;

            default:
                throw new Error("Only functions can classes supported at top level");
        }
    }

    getTopLevelForward() {
        if (this.type!="class")
            return "";

        return `
            static JSClassID ${this.binding.prefix}${this.name}_classid=0;
        `;
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

                if (this.events.length) {
                    s+=`
                        JS_SetPropertyStr(ctx,${this.name}_proto,"on",JS_NewCFunction(ctx, ${this.binding.prefix}${this.name}_on,"on",2));
                        JS_SetPropertyStr(ctx,${this.name}_proto,"off",JS_NewCFunction(ctx, ${this.binding.prefix}${this.name}_off,"off",2));
                    `;                    
                }

                return s;
                break;

            default:
                throw new Error("Only functions and classes supported at top level");
        }
    }

    getAssignerImplementation() {
        return `
            void ${this.binding.prefix}add_${this.name}(JSContext *ctx, const char *name, ${this.name}* val) {
                JSValue global=JS_GetGlobalObject(ctx);
                JSValue v=JS_NewObjectClass(ctx,${this.binding.prefix}${this.name}_classid);
                JS_SetOpaque(v,${this.binding.prefix}opaque_create(val,false));
                JS_SetPropertyStr(ctx,global,name,v);
                JS_FreeValue(ctx,global);
            }
        `;
    }

    getAssignerDeclaration() {
        return `
            void ${this.binding.prefix}add_${this.name}(JSContext *ctx, const char *name, ${this.name}* val);
        `;
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
    constructor({descriptionFn, outputFn, prefix, includeDir, featureCheck}) {
        this.descriptionFn=descriptionFn;
        this.outputFn=outputFn;
        this.prefix=prefix;
        this.includeDir=includeDir;
        this.featureCheck=featureCheck;

        this.basename=path.parse(this.outputFn).name;
        if (!this.includeDir)
            this.includeDir=path.dirname(this.outputFn);

        this.includeFn=path.join(this.includeDir,this.basename+".h");
        //console.log(this.includeFn);

        if (!this.prefix)
            this.prefix="pea_";
    }

    async init() {
        let descriptionContent=await fsp.readFile(this.descriptionFn,"utf8");
        this.description=JSON5.parse(descriptionContent);
        this.exports=this.description.exports.map(exp=>new Declaration(exp,{binding: this}));

        if (!this.description.include)
            this.description.include=[];

        if (!this.description.namespace)
            this.description.namespace=[];

        this.description.namespace=[this.description.namespace].flat();
    }

    getDeclarationByName(name) {
        for (let exp of this.exports) {
            if (exp.name==name)
                return exp;
        }
    }

    getClassDeclarationByName(name) {
        let decl=this.getDeclarationByName(name);

        if (!decl)
            throw new Error("Unknown type: "+name);

        if (decl.type!="class")
            throw new Error("Not a class");

        return decl;        
    }

    getClassExports() {
        return this.exports.filter(x=>x.type=="class");
    }

    getBeginNamespace() {
        if (!this.description.namespace.length)
            return "";

        return `namespace ${this.description.namespace[0]} {\n`;
    }

    getEndNamespace() {
        if (!this.description.namespace.length)
            return "";

        return `}\n`;
    }

    async generate() {
        //console.log("****** feature check: "+this.featureCheck);

        await this.init();

        this.declarationSource="";
        this.definitionSource="";

        let source=autoIndent(`
            ${this.featureCheck?`
                #ifdef ${this.featureCheck}
            `:""}

            extern "C" {
            #include "quickjs.h"
            }

            #include <string>
            #include <cstdlib>
            #include <stdexcept>

            ${this.description.include.map(inc=>`#include "${inc}"`).join("\n")}
            ${this.description.namespace.map(ns=>`using namespace ${ns};`).join("\n")}

            ${this.getBeginNamespace()}

            typedef struct {
                void *instance;
                bool owned;
            } ${this.prefix}opaque_t;

            typedef struct {
                Dispatcher<> *dispatcher;
                int id;
            } ${this.prefix}listener_t;

            std::vector<${this.prefix}listener_t> ${this.prefix}listeners;

            ${this.prefix}opaque_t* ${this.prefix}opaque_create(void *instance, bool owned) {
                ${this.prefix}opaque_t* opaque=(${this.prefix}opaque_t*)malloc(sizeof(${this.prefix}opaque_t));
                opaque->instance=instance;
                opaque->owned=owned;
                return opaque;
            }

            ${this.exports.map(exp=>exp.getTopLevelForward()).join("\n")}

            ${this.exports.map(exp=>exp.getTopLevelDefinition()).join("\n")}

            void ${this.prefix}init(JSContext *ctx) {
                JSValue global=JS_GetGlobalObject(ctx);
                ${this.exports.map(x=>x.getTopLevelRegistration()).join("\n")}
                JS_FreeValue(ctx,global);
            }

            ${this.getClassExports().map(x=>x.getAssignerImplementation()).join("\n")}

            ${this.getEndNamespace()}

            ${this.featureCheck?`
                #endif // ${this.featureCheck}
            `:""}

        `);

        await fsp.writeFile(this.outputFn,source);

        let includeSource=autoIndent(`
            #pragma once
            ${this.featureCheck?`
                #ifdef ${this.featureCheck}
            `:""}
            extern "C" {
            #include "quickjs.h"
            }

            ${this.description.include.map(inc=>`#include "${inc}"`).join("\n")}

            ${this.getBeginNamespace()}

            void ${this.prefix}init(JSContext *ctx);
            ${this.getClassExports().map(x=>x.getAssignerDeclaration()).join("\n")}

            ${this.getEndNamespace()}
            ${this.featureCheck?`
                #endif // ${this.featureCheck}
            `:""}
        `);

        await fsp.writeFile(this.includeFn,includeSource);
    }
}

export async function peabindGen(options) {
    //console.log("Generating api: "+options.outputFn);
    let peabind=new Binding(options);
    await peabind.generate();
}