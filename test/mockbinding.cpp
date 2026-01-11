extern "C" {
    #include "quickjs.h"
}
#include <string>
#include "mockapi.h"
static JSValue pea_helloint(JSContext *ctx, JSValueConst thisobj, int argc, JSValueConst *argv) {
    if (argc!=0) return JS_ThrowTypeError(ctx, "wrong arg count");
    int ret;
    ret=helloint();
    return JS_NewUint32(ctx,ret)
    ;
}
static JSValue pea_hellovoid(JSContext *ctx, JSValueConst thisobj, int argc, JSValueConst *argv) {
    if (argc!=0) return JS_ThrowTypeError(ctx, "wrong arg count");
    hellovoid();
    return JS_UNDEFINED;
}
static JSValue pea_helloinc(JSContext *ctx, JSValueConst thisobj, int argc, JSValueConst *argv) {
    if (argc!=1) return JS_ThrowTypeError(ctx, "wrong arg count");
    int arg_0;
    JS_ToInt32(ctx,&arg_0,argv[0]);
    int ret;
    ret=helloinc(arg_0);
    return JS_NewUint32(ctx,ret)
    ;
}
static JSValue pea_concat(JSContext *ctx, JSValueConst thisobj, int argc, JSValueConst *argv) {
    if (argc!=2) return JS_ThrowTypeError(ctx, "wrong arg count");
    std::string arg_0;
    std::string arg_1;
    const char *arg_0_=JS_ToCString(ctx,argv[0]);
    arg_0=std::string(arg_0_);
    JS_FreeCString(ctx,arg_0_);
    const char *arg_1_=JS_ToCString(ctx,argv[1]);
    arg_1=std::string(arg_1_);
    JS_FreeCString(ctx,arg_1_);
    std::string ret;
    ret=concat(arg_0,arg_1);
    return JS_NewString(ctx,ret.c_str());
}
static JSClassID pea_TestClass_classid=0;
static JSValue pea_TestClass_ctor(JSContext *ctx, JSValueConst new_target, int argc, JSValueConst *argv) {
    if (argc!=1) return JS_ThrowTypeError(ctx, "wrong arg count");
    int arg_0;
    JS_ToInt32(ctx,&arg_0,argv[0]);
    TestClass* instance=new TestClass(arg_0);
    //JSValue proto=JS_GetClassProto(ctx,pea_TestClass_classid);
    //JSValue obj=JS_NewObjectProtoClass(ctx,proto,pea_TestClass_classid);
    //JS_FreeValue(ctx, proto);
    JSValue obj=JS_NewObjectClass(ctx,pea_TestClass_classid);
    JS_SetOpaque(obj,instance);
    return obj;
}
static void pea_TestClass_finalizer(JSRuntime *rt, JSValue obj) {
    TestClass* instance=(TestClass*)JS_GetOpaque(obj,pea_TestClass_classid);
    delete instance;
}
static JSValue pea_TestClass_getVal(JSContext *ctx, JSValueConst thisobj, int argc, JSValueConst *argv) {
    if (argc!=0) return JS_ThrowTypeError(ctx, "wrong arg count");
    TestClass* instance=(TestClass*)JS_GetOpaque(thisobj,pea_TestClass_classid);
    int ret;
    ret=instance->getVal();
    return JS_NewUint32(ctx,ret)
    ;
}
static JSValue pea_TestClass_setVal(JSContext *ctx, JSValueConst thisobj, int argc, JSValueConst *argv) {
    if (argc!=1) return JS_ThrowTypeError(ctx, "wrong arg count");
    int arg_0;
    JS_ToInt32(ctx,&arg_0,argv[0]);
    TestClass* instance=(TestClass*)JS_GetOpaque(thisobj,pea_TestClass_classid);
    instance->setVal(arg_0);
    return JS_UNDEFINED;
}
void pea_init(JSContext *ctx) {
    JSValue global=JS_GetGlobalObject(ctx);
    JS_SetPropertyStr(ctx,global,"helloint",JS_NewCFunction(ctx,pea_helloint,"helloint",0));
    JS_SetPropertyStr(ctx,global,"hellovoid",JS_NewCFunction(ctx,pea_hellovoid,"hellovoid",0));
    JS_SetPropertyStr(ctx,global,"helloinc",JS_NewCFunction(ctx,pea_helloinc,"helloinc",0));
    JS_SetPropertyStr(ctx,global,"concat",JS_NewCFunction(ctx,pea_concat,"concat",0));
    if (!pea_TestClass_classid) JS_NewClassID(&pea_TestClass_classid);
    JSClassDef TestClass_def={.class_name="TestClass", .finalizer=pea_TestClass_finalizer};
    JS_NewClass(JS_GetRuntime(ctx),pea_TestClass_classid,&TestClass_def);
    JSValue TestClass_proto=JS_NewObject(ctx);
    JS_SetClassProto(ctx, pea_TestClass_classid,TestClass_proto);
    JSValue TestClass_ctorval=JS_NewCFunction2(ctx,pea_TestClass_ctor,"TestClass",0,JS_CFUNC_constructor,0);
    JS_SetConstructor(ctx,TestClass_ctorval,TestClass_proto);
    JS_SetPropertyStr(ctx,global,"TestClass",TestClass_ctorval);
    JS_SetPropertyStr(ctx,TestClass_proto,"getVal",JS_NewCFunction(ctx, pea_TestClass_getVal,"getVal",0));
    JS_SetPropertyStr(ctx,TestClass_proto,"setVal",JS_NewCFunction(ctx, pea_TestClass_setVal,"setVal",0));
    JS_FreeValue(ctx,global);
}