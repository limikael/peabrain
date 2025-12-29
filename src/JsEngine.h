#pragma once
#include <Arduino.h>
extern "C" {
#include "quickjs.h"
}

#include "FS.h"
#include "SPIFFS.h"

using JSFunctionWrapper=std::function<JSValue(int, JSValueConst*)>;

struct JsCString {
    JSContext *ctx;
    const char *str;

    JsCString(JSContext *ctx, JSValue val)
        : ctx(ctx), str(JS_ToCString(ctx, val)) {}

    ~JsCString() {
        if (str) JS_FreeCString(ctx, str);
    }

    const char *c_str() { return str; }
};

class JsEngineTimeout {
public:
	uint32_t id;
	uint32_t deadline;
	JSValue func;
};

class JsFile {
public:
	uint32_t id;
	File file;
};

class JsEngine {
public:
	JsEngine(Stream &stream);
	void loop();
	void begin();
	void addGlobal(const char *name, JSValue val);
	JSValue newFunction(JSFunctionWrapper func, int length=0);
	template<typename T>
	JSValue newMethod(T* obj, JSValue (T::*memFunc)(int, JSValueConst*), int length=0) {
	    auto wrapper = [obj, memFunc](int argc, JSValueConst *argv) -> JSValue {
	        return (obj->*memFunc)(argc, argv);
	    };

	    return newFunction(wrapper,length);
	}

	//void run(const char *s);

private:
	JSValue digitalWrite(int argc, JSValueConst *argv);
	JSValue setTimeout(int argc, JSValueConst *argv);
	JSValue consoleLog(int argc, JSValueConst *argv);
	JSValue serialWrite(int argc, JSValueConst *argv);
	JSValue setSerialDataFunc(int argc, JSValueConst *argv);
	JSValue fileOpen(int argc, JSValueConst *argv);
	JSValue fileClose(int argc, JSValueConst *argv);
	JSValue fileRead(int argc, JSValueConst *argv);
	JSValue fileWrite(int argc, JSValueConst *argv);
	JSValue scheduleReload(int argc, JSValueConst *argv);
	JSValue getExceptionMessage();
	void reset();
	void close();
	JSRuntime *rt=nullptr;
	JSContext *ctx=nullptr;
	Stream& stream;
	std::vector<JsEngineTimeout> timeouts;
	std::vector<JsFile> files;
	JSValue serialDataFunc;
	JSValue bootError;
	bool reloadScheduled,began=false;
	int startCount=0;
	std::vector<JSFunctionWrapper*> funcs;
};
