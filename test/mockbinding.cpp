extern "C" {
    #include "quickjs.h"
}
#include <string>
#include <cstdlib>
#include <stdexcept>
#include <algorithm>
#include "mockapi.h"
typedef struct {
    void *instance;
    bool owned;
} pea_opaque_t;
typedef struct {
    Dispatcher<> *dispatcher;
    int id;
} pea_listener_t;
std::vector<pea_listener_t *> pea_listeners;
pea_opaque_t* pea_opaque_create(void *instance, bool owned) {
    pea_opaque_t* opaque=(pea_opaque_t*)malloc(sizeof(pea_opaque_t));
    opaque->instance=instance;
    opaque->owned=owned;
    return opaque;
}
static JSClassID pea_TestClass_classid=0;
static JSClassID pea_AnotherTest_classid=0;
static JSValue pea_helloint(JSContext *ctx, JSValueConst thisobj, int argc, JSValueConst *argv) {
    if (argc!=0) return JS_ThrowTypeError(ctx, "wrong arg count");
    int32_t ret;
    ret=helloint();
    JSValue retval=JS_UNDEFINED;
    retval=JS_NewInt32(ctx,ret);
    return retval;
}
static JSValue pea_hellovoid(JSContext *ctx, JSValueConst thisobj, int argc, JSValueConst *argv) {
    if (argc!=0) return JS_ThrowTypeError(ctx, "wrong arg count");
    hellovoid();
    return JS_UNDEFINED;
}
static JSValue pea_helloinc(JSContext *ctx, JSValueConst thisobj, int argc, JSValueConst *argv) {
    if (argc!=1) return JS_ThrowTypeError(ctx, "wrong arg count");
    int32_t arg_0;
    JS_ToInt32(ctx,&arg_0,argv[0]);
    int32_t ret;
    ret=helloinc(arg_0);
    JSValue retval=JS_UNDEFINED;
    retval=JS_NewInt32(ctx,ret);
    return retval;
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
    JSValue retval=JS_UNDEFINED;
    retval=JS_NewString(ctx,ret.c_str());
    return retval;
}
static JSValue pea_TestClass_ctor(JSContext *ctx, JSValueConst new_target, int argc, JSValueConst *argv) {
    if (argc!=1) return JS_ThrowTypeError(ctx, "wrong arg count");
    int32_t arg_0;
    JS_ToInt32(ctx,&arg_0,argv[0]);
    TestClass* instance=new TestClass(arg_0);
    JSValue obj=JS_NewObjectClass(ctx,pea_TestClass_classid);
    JS_SetOpaque(obj,pea_opaque_create(instance,true));
    return obj;
}
static void pea_TestClass_finalizer(JSRuntime *rt, JSValue obj) {
    pea_opaque_t* opaque=(pea_opaque_t*)JS_GetOpaque(obj,pea_TestClass_classid);
    if (opaque->owned) {
        TestClass* instance=(TestClass*)opaque->instance;
        delete instance;
    }
    free(opaque);
}
static JSValue pea_TestClass_getVal(JSContext *ctx, JSValueConst thisobj, int argc, JSValueConst *argv) {
    if (argc!=0) return JS_ThrowTypeError(ctx, "wrong arg count");
    pea_opaque_t* opaque=(pea_opaque_t*)JS_GetOpaque(thisobj,pea_TestClass_classid);
    //TestClass* instance=(TestClass*)JS_GetOpaque(thisobj,pea_TestClass_classid);
    TestClass* instance=(TestClass*)opaque->instance;
    int32_t ret;
    ret=instance->getVal();
    JSValue retval=JS_UNDEFINED;
    retval=JS_NewInt32(ctx,ret);
    return retval;
}
static JSValue pea_TestClass_setVal(JSContext *ctx, JSValueConst thisobj, int argc, JSValueConst *argv) {
    if (argc!=1) return JS_ThrowTypeError(ctx, "wrong arg count");
    int32_t arg_0;
    JS_ToInt32(ctx,&arg_0,argv[0]);
    pea_opaque_t* opaque=(pea_opaque_t*)JS_GetOpaque(thisobj,pea_TestClass_classid);
    //TestClass* instance=(TestClass*)JS_GetOpaque(thisobj,pea_TestClass_classid);
    TestClass* instance=(TestClass*)opaque->instance;
    instance->setVal(arg_0);
    return JS_UNDEFINED;
}
static JSValue pea_TestClass_callFunc(JSContext *ctx, JSValueConst thisobj, int argc, JSValueConst *argv) {
    if (argc!=1) return JS_ThrowTypeError(ctx, "wrong arg count");
    std::function<void()> arg_0;
    JSValue arg_0_=argv[0];
    arg_0=[ctx,arg_0_]() {
        JSValue ret=JS_Call(ctx,arg_0_,JS_UNDEFINED,0,NULL);
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
    pea_opaque_t* opaque=(pea_opaque_t*)JS_GetOpaque(thisobj,pea_TestClass_classid);
    //TestClass* instance=(TestClass*)JS_GetOpaque(thisobj,pea_TestClass_classid);
    TestClass* instance=(TestClass*)opaque->instance;
    instance->callFunc(arg_0);
    return JS_UNDEFINED;
}
static JSValue pea_TestClass_emitChangeEvent(JSContext *ctx, JSValueConst thisobj, int argc, JSValueConst *argv) {
    if (argc!=0) return JS_ThrowTypeError(ctx, "wrong arg count");
    pea_opaque_t* opaque=(pea_opaque_t*)JS_GetOpaque(thisobj,pea_TestClass_classid);
    //TestClass* instance=(TestClass*)JS_GetOpaque(thisobj,pea_TestClass_classid);
    TestClass* instance=(TestClass*)opaque->instance;
    instance->emitChangeEvent();
    return JS_UNDEFINED;
}
static JSValue pea_TestClass_on(JSContext *ctx, JSValueConst thisobj, int argc, JSValueConst *argv) {
    if (argc!=2) return JS_ThrowTypeError(ctx, "wrong arg count");
    pea_opaque_t* opaque=(pea_opaque_t*)JS_GetOpaque(thisobj,pea_TestClass_classid);
    TestClass* instance=(TestClass*)opaque->instance;
    const char *eventName=JS_ToCString(ctx,argv[0]);
    Dispatcher<> *dispatcher;
    if (!strcmp(eventName,"change")) dispatcher=&instance->changeDispatcher;
    JS_FreeCString(ctx,eventName);
    if (!dispatcher) return JS_ThrowTypeError(ctx, "unknown event");
    void* identity=JS_VALUE_GET_PTR(argv[1]);
    if (dispatcher->getIdByIdentity(identity)) return JS_UNDEFINED; // existing
    JSValue fnDup=JS_DupValue(ctx,argv[1]);
    int id=dispatcher->on([ctx, fnDup]() {
        JSValue ret=JS_Call(ctx, fnDup, JS_UNDEFINED, 0, NULL);
        JS_FreeValue(ctx,ret);
    });
    pea_listener_t *listener=new pea_listener_t {
        .dispatcher=dispatcher,
        .id=id
    };
    pea_listeners.push_back(listener);
    dispatcher->setIdentity(id,identity);
    dispatcher->setDestructor(id,[ctx, fnDup, listener]() {
        pea_listeners.erase(std::remove(pea_listeners.begin(), pea_listeners.end(), listener), pea_listeners.end());
        delete listener;
        JS_FreeValue(ctx,fnDup);
    });
    return JS_UNDEFINED;
}
static JSValue pea_TestClass_off(JSContext *ctx, JSValueConst thisobj, int argc, JSValueConst *argv) {
    if (argc>2 || argc<1) return JS_ThrowTypeError(ctx, "wrong arg count");
    pea_opaque_t* opaque=(pea_opaque_t*)JS_GetOpaque(thisobj,pea_TestClass_classid);
    TestClass* instance=(TestClass*)opaque->instance;
    const char *eventName=JS_ToCString(ctx,argv[0]);
    Dispatcher<> *dispatcher=nullptr;
    if (!strcmp(eventName,"change")) dispatcher=&instance->changeDispatcher;
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
static JSValue pea_createTestClass(JSContext *ctx, JSValueConst thisobj, int argc, JSValueConst *argv) {
    if (argc!=1) return JS_ThrowTypeError(ctx, "wrong arg count");
    int32_t arg_0;
    JS_ToInt32(ctx,&arg_0,argv[0]);
    TestClass* ret;
    ret=createTestClass(arg_0);
    JSValue retval=JS_UNDEFINED;
    retval=JS_NewObjectClass(ctx,pea_TestClass_classid);
    JS_SetOpaque(retval,pea_opaque_create(ret,true));
    return retval;
}
static JSValue pea_getTestClassValue(JSContext *ctx, JSValueConst thisobj, int argc, JSValueConst *argv) {
    if (argc!=1) return JS_ThrowTypeError(ctx, "wrong arg count");
    TestClass* arg_0;
    pea_opaque_t* opaque=(pea_opaque_t*)JS_GetOpaque(argv[0],pea_TestClass_classid);
    arg_0=(TestClass*)opaque->instance;
    int32_t ret;
    ret=getTestClassValue(arg_0);
    JSValue retval=JS_UNDEFINED;
    retval=JS_NewInt32(ctx,ret);
    return retval;
}
static JSValue pea_getTestClassValueRef(JSContext *ctx, JSValueConst thisobj, int argc, JSValueConst *argv) {
    if (argc!=1) return JS_ThrowTypeError(ctx, "wrong arg count");
    pea_opaque_t* opaque=(pea_opaque_t*)JS_GetOpaque(argv[0],pea_TestClass_classid);
    TestClass& arg_0=*(TestClass*)opaque->instance;
    int32_t ret;
    ret=getTestClassValueRef(arg_0);
    JSValue retval=JS_UNDEFINED;
    retval=JS_NewInt32(ctx,ret);
    return retval;
}
static JSValue pea_AnotherTest_ctor(JSContext *ctx, JSValueConst new_target, int argc, JSValueConst *argv) {
    if (argc!=0) return JS_ThrowTypeError(ctx, "wrong arg count");
    AnotherTest* instance=new AnotherTest();
    JSValue obj=JS_NewObjectClass(ctx,pea_AnotherTest_classid);
    JS_SetOpaque(obj,pea_opaque_create(instance,true));
    return obj;
}
static void pea_AnotherTest_finalizer(JSRuntime *rt, JSValue obj) {
    pea_opaque_t* opaque=(pea_opaque_t*)JS_GetOpaque(obj,pea_AnotherTest_classid);
    if (opaque->owned) {
        AnotherTest* instance=(AnotherTest*)opaque->instance;
        delete instance;
    }
    free(opaque);
}
static JSValue pea_AnotherTest_getTestClass(JSContext *ctx, JSValueConst thisobj, int argc, JSValueConst *argv) {
    if (argc!=0) return JS_ThrowTypeError(ctx, "wrong arg count");
    pea_opaque_t* opaque=(pea_opaque_t*)JS_GetOpaque(thisobj,pea_AnotherTest_classid);
    //AnotherTest* instance=(AnotherTest*)JS_GetOpaque(thisobj,pea_AnotherTest_classid);
    AnotherTest* instance=(AnotherTest*)opaque->instance;
    TestClass* ret;
    ret=instance->getTestClass();
    JSValue retval=JS_UNDEFINED;
    retval=JS_NewObjectClass(ctx,pea_TestClass_classid);
    JS_SetOpaque(retval,pea_opaque_create(ret,false));
    return retval;
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
    JS_SetPropertyStr(ctx,TestClass_proto,"callFunc",JS_NewCFunction(ctx, pea_TestClass_callFunc,"callFunc",0));
    JS_SetPropertyStr(ctx,TestClass_proto,"emitChangeEvent",JS_NewCFunction(ctx, pea_TestClass_emitChangeEvent,"emitChangeEvent",0));
    JS_SetPropertyStr(ctx,TestClass_proto,"on",JS_NewCFunction(ctx, pea_TestClass_on,"on",2));
    JS_SetPropertyStr(ctx,TestClass_proto,"off",JS_NewCFunction(ctx, pea_TestClass_off,"off",2));
    JS_SetPropertyStr(ctx,global,"createTestClass",JS_NewCFunction(ctx,pea_createTestClass,"createTestClass",0));
    JS_SetPropertyStr(ctx,global,"getTestClassValue",JS_NewCFunction(ctx,pea_getTestClassValue,"getTestClassValue",0));
    JS_SetPropertyStr(ctx,global,"getTestClassValueRef",JS_NewCFunction(ctx,pea_getTestClassValueRef,"getTestClassValueRef",0));
    if (!pea_AnotherTest_classid) JS_NewClassID(&pea_AnotherTest_classid);
    JSClassDef AnotherTest_def={.class_name="AnotherTest", .finalizer=pea_AnotherTest_finalizer};
    JS_NewClass(JS_GetRuntime(ctx),pea_AnotherTest_classid,&AnotherTest_def);
    JSValue AnotherTest_proto=JS_NewObject(ctx);
    JS_SetClassProto(ctx, pea_AnotherTest_classid,AnotherTest_proto);
    JSValue AnotherTest_ctorval=JS_NewCFunction2(ctx,pea_AnotherTest_ctor,"AnotherTest",0,JS_CFUNC_constructor,0);
    JS_SetConstructor(ctx,AnotherTest_ctorval,AnotherTest_proto);
    JS_SetPropertyStr(ctx,global,"AnotherTest",AnotherTest_ctorval);
    JS_SetPropertyStr(ctx,AnotherTest_proto,"getTestClass",JS_NewCFunction(ctx, pea_AnotherTest_getTestClass,"getTestClass",0));
    JS_FreeValue(ctx,global);
}
void pea_exit(JSContext *ctx) {
    //printf("exiting, listeners=%d\n",pea_listeners.size());
    while (pea_listeners.size())
    pea_listeners[0]->dispatcher->off(pea_listeners[0]->id);
    //printf("exiting, listeners=%d\n",pea_listeners.size());
}
void pea_add_TestClass(JSContext *ctx, const char *name, TestClass* val) {
    JSValue global=JS_GetGlobalObject(ctx);
    JSValue v=JS_NewObjectClass(ctx,pea_TestClass_classid);
    JS_SetOpaque(v,pea_opaque_create(val,false));
    JS_SetPropertyStr(ctx,global,name,v);
    JS_FreeValue(ctx,global);
}
void pea_add_AnotherTest(JSContext *ctx, const char *name, AnotherTest* val) {
    JSValue global=JS_GetGlobalObject(ctx);
    JSValue v=JS_NewObjectClass(ctx,pea_AnotherTest_classid);
    JS_SetOpaque(v,pea_opaque_create(val,false));
    JS_SetPropertyStr(ctx,global,name,v);
    JS_FreeValue(ctx,global);
}