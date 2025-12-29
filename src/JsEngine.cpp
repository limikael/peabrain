#include "JsEngine.h"

extern const char boot_js[];
extern const unsigned int boot_js_len;

static JSValue JsEngine_functionTrampoline(JSContext *ctx, JSValueConst this_val,
		int argc, JSValueConst *argv,
		int magic, JSValueConst *datas) {
	auto *wrapper = reinterpret_cast<JSFunctionWrapper*>(JS_VALUE_GET_PTR(datas[0]));
    if (!wrapper) return JS_EXCEPTION;

    try {
        return (*wrapper)(argc, argv);
    } catch (...) {
        return JS_ThrowInternalError(ctx, "C++ exception in std::function");
    }
}

JsEngine::JsEngine(Stream& stream)
		:stream(stream) {
    serialDataFunc=JS_UNDEFINED;
    bootError=JS_UNDEFINED;
	//reset();
}

void JsEngine::begin() {
	reset();
}

void JsEngine::close() {
    for (auto *f : funcs) delete f;
    funcs.clear();

    for (auto t: timeouts)
        JS_FreeValue(ctx,t.func);

    timeouts.clear();

    JS_FreeValue(ctx, serialDataFunc);
    JS_FreeValue(ctx, bootError);

    serialDataFunc=JS_UNDEFINED;
    bootError=JS_UNDEFINED;

    if (ctx) JS_FreeContext(ctx);
    ctx=nullptr;

    if (rt) {
        JS_RunGC(rt);
        JS_FreeRuntime(rt);
    }
	rt=nullptr;
}

JSValue JsEngine::newFunction(JSFunctionWrapper func, int length) {
    auto *heapFunc=new JSFunctionWrapper(std::move(func));
    funcs.push_back(heapFunc);

	JSValue data=JS_NewBigInt64(ctx, reinterpret_cast<int64_t>(heapFunc));
    JSValue jsFunc=JS_NewCFunctionData(ctx, JsEngine_functionTrampoline, length, 
    	0, 1, &data);

	JS_FreeValue(ctx, data);

    return jsFunc;
}

void JsEngine::addGlobal(const char *name, JSValue val) {
    JSValue global=JS_GetGlobalObject(ctx);
    JS_SetPropertyStr(ctx,global,name,val);
    JS_FreeValue(ctx,global);
}

JSValue JsEngine::getExceptionMessage() {
    JSValue ex=JS_GetException(ctx);
    const char *msg = JS_ToCString(ctx, ex);
    JSValue res=JS_NewString(ctx, msg);
    JS_FreeCString(ctx, msg);
    JS_FreeValue(ctx, ex);

    return res;
}

void JsEngine::reset() {
	close();
    if (!rt)
        rt=JS_NewRuntime();

    serialDataFunc=JS_UNDEFINED;

    ctx=JS_NewContext(rt);
    JS_SetContextOpaque(ctx,this);

    addGlobal("digitalWrite",newMethod(this,&JsEngine::digitalWrite,2));
    addGlobal("serialWrite",newMethod(this,&JsEngine::serialWrite,1));
    addGlobal("setTimeout",newMethod(this,&JsEngine::setTimeout,2));
    addGlobal("setSerialDataFunc",newMethod(this,&JsEngine::setSerialDataFunc,1));
    addGlobal("fileOpen",newMethod(this,&JsEngine::fileOpen,2));
    addGlobal("fileClose",newMethod(this,&JsEngine::fileClose,1));
    addGlobal("fileRead",newMethod(this,&JsEngine::fileRead,1));
    addGlobal("fileWrite",newMethod(this,&JsEngine::fileWrite,1));
    addGlobal("scheduleReload",newMethod(this,&JsEngine::scheduleReload,1));

    JSValue global=JS_GetGlobalObject(ctx);
    addGlobal("global",global);

    bootError=JS_UNDEFINED;
    JSValue val=JS_Eval(ctx, boot_js, boot_js_len, "<builtin>", JS_EVAL_TYPE_GLOBAL);
    if (JS_IsException(val))
        bootError=getExceptionMessage();

    JS_FreeValue(ctx, val);

    if (JS_IsUndefined(bootError)) {
        File f = SPIFFS.open("/boot.js", FILE_READ);
        if (f) {
            String content = f.readString();
            f.close();

            int len=strlen(content.c_str());
            stream.printf("running program...\n");
            JSValue bootval=JS_Eval(ctx, content.c_str(), len, "<builtin>", JS_EVAL_TYPE_GLOBAL);
            if (JS_IsException(bootval))
                bootError=getExceptionMessage();

            JS_FreeValue(ctx,bootval);
        }
    }

    startCount++;
    stream.printf("Started, count=%d\n",startCount);
    stream.printf("{\"type\": \"started\"}\n",startCount);
}

void JsEngine::loop() {
    if (!began) {
        began=true;
        begin();
    }

    if (reloadScheduled) {
        reloadScheduled=false;
        reset();
    }

    if (!JS_IsUndefined(bootError)) {
        stream.println("boot error");
        const char *out=JS_ToCString(ctx,bootError);
        if (out) {
            stream.println(out);
            JS_FreeCString(ctx, out);
        }

        delay(1000);
    }

    std::vector<JsEngineTimeout> expired;
    uint32_t now=millis();

    for (auto it=timeouts.begin(); it!=timeouts.end();) {
        if (now>=it->deadline) {
            expired.push_back(*it);
            it=timeouts.erase(it);
        }

        else {
            ++it;
        }
    }

    for (auto &t: expired) {
        JSValue ret=JS_Call(ctx,t.func,JS_UNDEFINED,0,nullptr);
        JS_FreeValue(ctx,ret);
        JS_FreeValue(ctx,t.func);
    }

    int len=stream.available();
    if (len) {
        char s[len+1];
        for (int i=0; i<len; i++) {
            int c=stream.read();
            //stream.write(c);
            s[i]=c;
        }

        s[len]='\0';

        //stream.printf("reading: %d %s\n",len,s);

        ///*if (s[0]=='#') {
        //    stream.printf("restart...\n");
        //    reloadScheduled=true;
        //}

        JSValue args[1];
        args[0]=JS_NewString(ctx,s);

        JSValue ret=JS_Call(ctx,serialDataFunc,JS_UNDEFINED,1,args);
        JS_FreeValue(ctx,args[0]);
        JS_FreeValue(ctx,ret);
    }
}

JSValue JsEngine::serialWrite(int argc, JSValueConst *argv) {
    const char *s = JS_ToCString(ctx, argv[0]);
    if (s) {
        for (int i=0; i<strlen(s); i++)
            stream.write(s[i]);

        //stream.print(s);
        JS_FreeCString(ctx, s);
    }

    return JS_UNDEFINED;
}

JSValue JsEngine::setSerialDataFunc(int argc, JSValueConst *argv) {
    JS_FreeValue(ctx, serialDataFunc);

    serialDataFunc=JS_DupValue(ctx, argv[0]);

    return JS_UNDEFINED;
}

JSValue JsEngine::digitalWrite(int argc, JSValueConst *argv) {
    int32_t pin=0, val=0;

    JS_ToInt32(ctx,&pin,argv[0]);
    JS_ToInt32(ctx,&val,argv[1]);

    ::digitalWrite(pin,val);

    return JS_UNDEFINED;
}

JSValue JsEngine::setTimeout(int argc, JSValueConst *argv) {
    uint32_t until;
    JS_ToUint32(ctx,&until,argv[1]);

    JsEngineTimeout t;
    t.id=1;
    t.deadline=millis()+until;
    t.func=JS_DupValue(ctx, argv[0]);
    timeouts.push_back(t);

    return JS_NewUint32(ctx,t.id);
}

JSValue JsEngine::fileOpen(int argc, JSValueConst *argv) {
    JsCString path(ctx, argv[0]);
    JsCString mode(ctx, argv[1]);

    File f=SPIFFS.open(path.c_str(), mode.c_str());
    if (!f)
        return JS_ThrowInternalError(ctx, "failed to open file");

    JsFile jsf;
    jsf.id=1;
    jsf.file=f;
    files.push_back(jsf);

    return JS_NewUint32(ctx,jsf.id);
}

JSValue JsEngine::fileRead(int argc, JSValueConst *argv) {
    uint32_t fid;
    JS_ToUint32(ctx,&fid,argv[0]);

    auto it=std::find_if(files.begin(), files.end(),
        [&](const JsFile& f) { return f.id == fid; });

    if (it==files.end())
        return JS_ThrowInternalError(ctx, "invalid file id");

    const size_t N=128;
    char buffer[N];
    size_t bytesRead=it->file.readBytes(buffer, N);

    return JS_NewStringLen(ctx, buffer, bytesRead);
}

JSValue JsEngine::fileWrite(int argc, JSValueConst *argv) {
    uint32_t fid;
    JS_ToUint32(ctx,&fid,argv[0]);
    JsCString data(ctx, argv[1]);

    auto it=std::find_if(files.begin(), files.end(),
        [&](const JsFile& f) { return f.id == fid; });

    if (it==files.end())
        return JS_ThrowInternalError(ctx, "invalid file id");

    //it->file.print("helloooo");
    //it->file.write((uint8_t *)data.c_str(),strlen(data.c_str()));
    it->file.print(data.c_str());
    return JS_UNDEFINED;
}

JSValue JsEngine::fileClose(int argc, JSValueConst *argv) {
    uint32_t fid;
    JS_ToUint32(ctx,&fid,argv[0]);

    auto it=std::find_if(files.begin(), files.end(),
        [&](const JsFile& f) { return f.id == fid; });

    if (it==files.end())
        return JS_ThrowInternalError(ctx, "invalid file id");

    it->file.close();
    files.erase(it);
    return JS_UNDEFINED;
}

JSValue JsEngine::scheduleReload(int argc, JSValueConst *argv) {
    stream.printf("Schedule reload...\n");
    reloadScheduled=true;
    return JS_UNDEFINED;
}
