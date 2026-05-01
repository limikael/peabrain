#pragma once
#include "JsEngine.h"
#include "canopener.h"

class CanPlugin: public JsPlugin {
public:
	CanPlugin(int txPin_, int rxPin_);
    virtual void loop();
    virtual void setJsEngine(JsEngine& jsEngine_);
    virtual void init();
    virtual void close();
    virtual ~CanPlugin() {}

private:
	canopener::EspBus espBus;
	JsEngine* jsEngine;
	JSValue canWrite(int argc, JSValueConst *argv);
	JSValue setCanMessageFunc(int argc, JSValueConst *argv);
	void handleFrame(cof_t *frame);
	JSValue canMessageFunc;
};
