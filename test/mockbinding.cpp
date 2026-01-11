extern "C" {
    #include "quickjs.h"
}
#include <string>
#include "mockapi.h"
static JSValue pea_helloint(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
    if (argc!=0) return JS_ThrowTypeError(ctx, "wrong arg count");
    int ret;
    ret=helloint();
    return JS_NewUint32(ctx,ret)
    ;
}
static JSValue pea_hellovoid(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
    if (argc!=0) return JS_ThrowTypeError(ctx, "wrong arg count");
    hellovoid();
    return JS_UNDEFINED;
}
static JSValue pea_helloinc(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
    if (argc!=1) return JS_ThrowTypeError(ctx, "wrong arg count");
    int arg_0;
    JS_ToInt32(ctx,&arg_0,argv[0]);
    int ret;
    ret=helloinc(arg_0);
    return JS_NewUint32(ctx,ret)
    ;
}
static JSValue pea_concat(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
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
static JSClassID TestClass_classid=0;
static JSValue TestClass_ctor(JSContext *ctx, JSValueConst new_target, int argc, JSValueConst *argv) {
    TestClass* instance=new TestClass();
    JSValue obj=JS_NewObjectClass(ctx, TestClass_classid);
    JS_SetOpaque(obj,instance);
    return obj;
}
static void TestClass_finalizer(JSRuntime *rt, JSValue obj) {
    TestClass* instance=(TestClass*)JS_GetOpaque(obj,TestClass_classid);
    delete instance;
}
void pea_init(JSContext *ctx) {
    JSValue global=JS_GetGlobalObject(ctx);
    JSValue helloint_func=JS_NewCFunction(ctx,pea_helloint,"helloint",0);
    JS_SetPropertyStr(ctx,global,"helloint",helloint_func);
    JSValue hellovoid_func=JS_NewCFunction(ctx,pea_hellovoid,"hellovoid",0);
    JS_SetPropertyStr(ctx,global,"hellovoid",hellovoid_func);
    JSValue helloinc_func=JS_NewCFunction(ctx,pea_helloinc,"helloinc",0);
    JS_SetPropertyStr(ctx,global,"helloinc",helloinc_func);
    JSValue concat_func=JS_NewCFunction(ctx,pea_concat,"concat",0);
    JS_SetPropertyStr(ctx,global,"concat",concat_func);
    if (!TestClass_classid) JS_NewClassID(&TestClass_classid);
    JSClassDef TestClass_def={.class_name="TestClass", .finalizer=TestClass_finalizer};
    JS_NewClass(JS_GetRuntime(ctx),TestClass_classid,&TestClass_def);
    JSValue TestClass_proto=JS_GetClassProto(ctx,TestClass_classid);
    JSValue TestClass_ctorval = JS_NewCFunction2(ctx, TestClass_ctor, "TestClass", 0, JS_CFUNC_constructor,0);
    JS_SetConstructor(ctx, TestClass_ctorval, TestClass_proto);
    JS_SetPropertyStr(ctx, global, "TestClass", TestClass_ctorval);
    JS_FreeValue(ctx, TestClass_proto);
    JS_FreeValue(ctx,global);
}