#pragma once
#include "JsEngine.h"
#include <Arduino.h>
#include <WiFi.h>

class NetPlugin: public JsPlugin {
public:
	NetPlugin();
    virtual void loop();
    virtual void setJsEngine(JsEngine& jsEngine_);
    virtual void init();
    virtual void close();

private:
	JsEngine* jsEngine;
	JSValue wifiConnect(int argc, JSValueConst *argv);
    JSValue wifiDisconnect(int argc, JSValueConst *argv);
    JSValue wifiGetStatus(int argc, JSValueConst *argv);
    JSValue wifiGetIp(int argc, JSValueConst *argv);
    JSValue wifiSetStatusFunc(int argc, JSValueConst *argv);
    wl_status_t reportedStatus=(wl_status_t)-1;
    JSValue wifiStatusFunc;
};
