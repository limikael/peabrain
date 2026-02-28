#pragma once
#include "JsEngine.h"
#include <Arduino.h>
#include <WiFi.h>

class JsFile {
public:
    uint32_t id;
    File file;
};

class FsPlugin: public JsPlugin {
public:
	FsPlugin();
    virtual void loop();
    virtual void setJsEngine(JsEngine& jsEngine_);
    virtual void init();
    virtual void close();

private:
	JsEngine* jsEngine;
    JSValue fileOpen(int argc, JSValueConst *argv);
    JSValue fileClose(int argc, JSValueConst *argv);
    JSValue fileRead(int argc, JSValueConst *argv);
    JSValue fileWrite(int argc, JSValueConst *argv);
    JSValue fileExists(int argc, JSValueConst *argv);
    JSValue fileReadDirEnt(int argc, JSValueConst *argv);
    JSValue fileUnlink(int argc, JSValueConst *argv);

    std::vector<JsFile> files;
};
