#pragma once
#include "JsEngine.h"
#include <Arduino.h>
#include <WiFi.h>
#include <Update.h>

class JsFile {
public:
    enum class Type {
        FS,
        UPDATE
    };

    uint32_t id;

    bool open(const char *path, const char *mode) {
        if (!strcmp(path,"/firmware")) {
            type=Type::UPDATE;
            Serial.printf("starting update!!!!\n");
            bool res=Update.begin(UPDATE_SIZE_UNKNOWN);
            Serial.printf("update started: %d\n",res);
            return res;
        }

        else {
            type=Type::FS;
            file=SPIFFS.open(path,mode);
            if (!file)
                return false;

            return true;
        }
    }

    File openNextFile() {
        return file.openNextFile();
    }

    void close() {
        switch (type) {
            case Type::UPDATE:
                Update.end(true);
                break;

            case Type::FS:
            default:
                file.close();
                break;
        }
    }

    size_t read(uint8_t *buffer, size_t size) {
        switch (type) {
            case Type::FS:
                return file.read(buffer, size);
                break;

            case Type::UPDATE:
            default:
                return 0;
                break;
        }
    }

    size_t write(uint8_t *buffer, size_t size) {
        switch (type) {
            case Type::UPDATE:
                return Update.write(buffer,size);
                break;

            case Type::FS:
            default:
                return file.write(buffer,size);
                break;
        }
    }

private:
    File file;
    Type type;
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
    JSValue fileWriteBase64(int argc, JSValueConst *argv);
    JSValue fileExists(int argc, JSValueConst *argv);
    JSValue fileReadDirEnt(int argc, JSValueConst *argv);
    JSValue fileUnlink(int argc, JSValueConst *argv);

    std::vector<JsFile> files;
};
