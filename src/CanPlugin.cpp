#include "CanPlugin.h"
#include <stdlib.h>

using namespace canopener;

CanPlugin::CanPlugin(int txPin, int rxPin)
		:espBus(txPin, rxPin) {
    canMessageFunc=JS_UNDEFINED;
}

void CanPlugin::setJsEngine(JsEngine& jsEngine_) {
	jsEngine=&jsEngine_;
}

void CanPlugin::init() {
	jsEngine->addGlobal("canWrite",jsEngine->newMethod(this,&CanPlugin::canWrite,1));
    jsEngine->addGlobal("setCanMessageFunc",jsEngine->newMethod(this,&CanPlugin::setCanMessageFunc,1));

    /*jsEngine->addRawFunction("_malloc",(void*)malloc,1);
    jsEngine->addRawFunction("_free",(void*)free,1);
    jsEngine->addRawFunction("_cof_create",(void*)cof_create,0);
    jsEngine->addRawFunction("_cof_dispose",(void*)cof_dispose,1);
    jsEngine->addRawFunction("_cof_get",(void*)cof_get,2);
    jsEngine->addRawFunction("_cof_getp",(void*)cof_getp,2);
    jsEngine->addRawFunction("_cof_set",(void*)cof_set,3);
    jsEngine->addRawFunction("_cof_from_slcan",(void*)cof_from_slcan,2);
    jsEngine->addRawFunction("_cof_to_slcan",(void*)cof_to_slcan,2);
    jsEngine->addRawFunction("_peek",(void*)peek,1);
    jsEngine->addRawFunction("_poke",(void*)poke,2);*/
}

void CanPlugin::loop() {
	espBus.loop();

    while (espBus.available()) {
        cof_t frame;
        espBus.read(&frame);
        char s[256];
        cof_to_slcan(&frame,s);

        auto ctx=jsEngine->getContext();
        JSValue args[1];
        args[0]=JS_NewString(ctx,s);
        JSValue ret=JS_Call(ctx,canMessageFunc,JS_UNDEFINED,1,args);
        JS_FreeValue(ctx,args[0]);
        JS_FreeValue(ctx,ret);
    }
}

void CanPlugin::close() {
    JS_FreeValue(jsEngine->getContext(),canMessageFunc);
    canMessageFunc=JS_UNDEFINED;
}

JSValue CanPlugin::canWrite(int argc, JSValueConst *argv) {
    const char *s=JS_ToCString(jsEngine->getContext(),argv[0]);
    if (!s)
	    return JS_UNDEFINED;

    cof_t frame;
    if (cof_from_slcan(&frame,s)) {
        jsEngine->getStream()->printf("can write: %s\n",s);
        espBus.write(&frame);
    }

    return JS_UNDEFINED;
}

JSValue CanPlugin::setCanMessageFunc(int argc, JSValueConst *argv) {
    JS_FreeValue(jsEngine->getContext(),canMessageFunc);
    canMessageFunc=JS_DupValue(jsEngine->getContext(),argv[0]);
    return JS_UNDEFINED;
}
