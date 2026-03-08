#pragma once
#include <Arduino.h>
extern "C" {
#include "quickjs.h"
}

#include "FS.h"
#include "SPIFFS.h"

using JSFunctionWrapper=std::function<JSValue(int, JSValueConst*)>;

class JsEngine;

class JsPlugin {
public:
    virtual void loop() {}
    virtual void setJsEngine(JsEngine& jsEngine) = 0;
    virtual void init() {};
    virtual void close() {};
    virtual void begin() {};
    virtual ~JsPlugin() {}
};

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

class JsEngineTimer {
public:
	uint32_t id;
	uint32_t deadline;
	uint32_t interval;
	JSValue func;
};

class JsEngine {
public:
	JsEngine(Stream &stream);
	void loop();
	void begin();
	void addGlobal(const char *name, JSValue val);
	void addRawFunction(const char *name, void *func, int argc);
	JSValue newFunction(JSFunctionWrapper func, int length=0);
	template<typename T>
	JSValue newMethod(T* obj, JSValue (T::*memFunc)(int, JSValueConst*), int length=0) {
	    auto wrapper = [obj, memFunc](int argc, JSValueConst *argv) -> JSValue {
	        return (obj->*memFunc)(argc, argv);
	    };

	    return newFunction(wrapper,length);
	}

	void addPlugin(JsPlugin *plugin);
	JSContext* getContext() { return ctx; } 
	Stream* getStream() { return &stream; }
	JSValue getExceptionMessage();
	void printJsValue(JSValue val);
	int getNewResourceId();

private:
	JSValue digitalWrite(int argc, JSValueConst *argv);
	JSValue digitalRead(int argc, JSValueConst *argv);
	JSValue pinMode(int argc, JSValueConst *argv);
	JSValue setTimeout(int argc, JSValueConst *argv);
	JSValue setInterval(int argc, JSValueConst *argv);
	JSValue clearTimer(int argc, JSValueConst *argv);
	JSValue consoleLog(int argc, JSValueConst *argv);
	JSValue serialWrite(int argc, JSValueConst *argv);
	JSValue setSerialDataFunc(int argc, JSValueConst *argv);
	JSValue scheduleReload(int argc, JSValueConst *argv);
	JSValue garbageCollect(int argc, JSValueConst *argv);
	JSValue setBootInProgress(int argc, JSValueConst *argv);
	JSValue reboot(int argc, JSValueConst *argv);
	void pumpJobs();
	void reset();
	void close();
	JSRuntime *rt=nullptr;
	JSContext *ctx=nullptr;
	Stream& stream;
	std::vector<JsEngineTimer> timers;
	std::vector<JsPlugin*> plugins;
	JSValue serialDataFunc;
	JSValue bootError;
	bool reloadScheduled,began=false;
	int startCount=0;
	std::vector<JSFunctionWrapper*> funcs;
	uint32_t maintenanceDeadline;
	uint32_t resourceCount;
	bool runEnabled=true;
	bool bootInProgress=false;
};
