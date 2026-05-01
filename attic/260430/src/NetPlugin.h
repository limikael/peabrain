#pragma once
#include "JsEngine.h"
#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>

class NetPlugin: public JsPlugin {
public:
	NetPlugin();
    virtual void loop() override;
    virtual void setJsEngine(JsEngine& jsEngine_) override;
    virtual void init() override;
    virtual void close() override;
    void handleWebRequest(HTTPMethod requestMethod, String requestUri);

private:
	JsEngine* jsEngine;
	JSValue wifiConnect(int argc, JSValueConst *argv);
    JSValue wifiDisconnect(int argc, JSValueConst *argv);
    JSValue wifiGetStatus(int argc, JSValueConst *argv);
    JSValue wifiGetIp(int argc, JSValueConst *argv);
    JSValue wifiSetStatusFunc(int argc, JSValueConst *argv);
    JSValue httpServerSetRequestFunc(int argc, JSValueConst *argv);
    JSValue httpServerSend(int argc, JSValueConst *argv);
    JSValue httpServerGetPostData(int argc, JSValueConst *argv);
    wl_status_t reportedStatus=(wl_status_t)-1;
    JSValue wifiStatusFunc;
    JSValue httpServerRequestFunc;
    bool webServerStarted;
    WebServer webServer;
};

class NetPluginRequestHandler: public RequestHandler {
public:
    NetPluginRequestHandler(NetPlugin& netPlugin_)
            :netPlugin(netPlugin_) {
    }

    bool canHandle(HTTPMethod method, String uri) override {
        return true;
    }

    bool handle(WebServer& server, HTTPMethod requestMethod, String requestUri) override {
        netPlugin.handleWebRequest(requestMethod, requestUri);
        return true; 
    }

private:
    NetPlugin& netPlugin;
};
