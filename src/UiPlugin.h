#pragma once
#include <LiquidCrystal_I2C.h>
#include "JsEngine.h"
#include "Encoder.h"
#include "DebouncePin.h"

class UiPlugin: public JsPlugin {
public:
	UiPlugin();
    virtual void loop();
    virtual void setJsEngine(JsEngine& jsEngine_);
    virtual void init();
    virtual void close();
    virtual ~UiPlugin() {}
    void begin();

private:
    JSValue displayWrite(int argc, JSValueConst *argv);
    JSValue displaySetCursor(int argc, JSValueConst *argv);
    JSValue setButtonFunc(int argc, JSValueConst *argv);
    JSValue setEncoderFunc(int argc, JSValueConst *argv);

    Encoder encoder;
    DebouncePin button;
	JsEngine* jsEngine;
	LiquidCrystal_I2C lcd;
    JSValue buttonFunc;
    JSValue encoderFunc;
};
