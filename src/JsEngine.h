#pragma once
#include <Arduino.h>
extern "C" {
#include "quickjs.h"
}

#define MAX_REPL 512

using JSFunctionWrapper=std::function<JSValue(int, JSValueConst*)>;

class JsEngineTimeout {
public:
	uint32_t id;
	uint32_t deadline;
	JSValue func;
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
	JSValue writeFile(int argc, JSValueConst *argv);
	JSValue readFile(int argc, JSValueConst *argv);
	JSValue scheduleReload(int argc, JSValueConst *argv);
	JSValue getExceptionMessage();
	void reset();
	void close();
	JSRuntime *rt=nullptr;
	JSContext *ctx=nullptr;
	Stream& stream;
	std::vector<JsEngineTimeout> timeouts;
	JSValue serialDataFunc;
	JSValue bootError;
	bool reloadScheduled,began=false;
	int startCount=0;
	std::vector<JSFunctionWrapper*> funcs;

	char replBuf[MAX_REPL];
	size_t replLen=0;
};
