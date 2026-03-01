#include "NetPlugin.h"
#include <stdlib.h>
#include <WiFi.h>
#include <WebServer.h>

NetPlugin::NetPlugin() {
    wifiStatusFunc=JS_UNDEFINED;
    httpServerRequestFunc=JS_UNDEFINED;
    webServerStarted=false;
}

void NetPlugin::setJsEngine(JsEngine& jsEngine_) {
	jsEngine=&jsEngine_;
}

void NetPlugin::init() {
    jsEngine->addGlobal("wifiConnect",jsEngine->newMethod(this,&NetPlugin::wifiConnect,2));
    jsEngine->addGlobal("wifiDisconnect",jsEngine->newMethod(this,&NetPlugin::wifiDisconnect,2));
    jsEngine->addGlobal("wifiGetStatus",jsEngine->newMethod(this,&NetPlugin::wifiGetStatus,0));
    jsEngine->addGlobal("wifiGetIp",jsEngine->newMethod(this,&NetPlugin::wifiGetIp,0));
    jsEngine->addGlobal("wifiSetStatusFunc",jsEngine->newMethod(this,&NetPlugin::wifiSetStatusFunc,1));
    jsEngine->addGlobal("httpServerSetRequestFunc",jsEngine->newMethod(this,&NetPlugin::httpServerSetRequestFunc,1));
    jsEngine->addGlobal("httpServerSend",jsEngine->newMethod(this,&NetPlugin::httpServerSend,3));
    jsEngine->addGlobal("httpServerGetPostData",jsEngine->newMethod(this,&NetPlugin::httpServerGetPostData,0));

    reportedStatus=(wl_status_t)-1;
}

void NetPlugin::handleWebRequest(HTTPMethod requestMethod, String requestUri) {
    if (!JS_IsUndefined(httpServerRequestFunc)) {
        JSValue args[2];
        args[0]=JS_NewString(jsEngine->getContext(),"ANY"); // dummy
        args[1]=JS_NewString(jsEngine->getContext(),requestUri.c_str());
        JSValue ret=JS_Call(jsEngine->getContext(),httpServerRequestFunc,JS_UNDEFINED,2,args);
        if (JS_IsException(ret)) {
            JSValue err=jsEngine->getExceptionMessage();
            jsEngine->printJsValue(err);
            JS_FreeValue(jsEngine->getContext(),err);
        }

        JS_FreeValue(jsEngine->getContext(),args[0]);
        JS_FreeValue(jsEngine->getContext(),args[1]);
    }

    webServer.send(200,"application/json","hello world");
}

JSValue NetPlugin::httpServerSend(int argc, JSValueConst *argv) {
    if (argc!=3)
        return JS_ThrowInternalError(jsEngine->getContext(),"wrong arg count");

    uint32_t code;
    JS_ToUint32(jsEngine->getContext(),&code,argv[0]);
    const char *contentType=JS_ToCString(jsEngine->getContext(),argv[1]);
    const char *content=JS_ToCString(jsEngine->getContext(),argv[2]);

    webServer.send(code,contentType,content);

    JS_FreeCString(jsEngine->getContext(),contentType);
    JS_FreeCString(jsEngine->getContext(),content);

    return JS_UNDEFINED;
}

void NetPlugin::loop() {
    if (webServerStarted)
        webServer.handleClient();

    wl_status_t status=WiFi.status();
    if (status!=reportedStatus) {
        reportedStatus=status;
        if (!JS_IsUndefined(wifiStatusFunc)) {
            JSValue ret=JS_Call(jsEngine->getContext(),wifiStatusFunc,JS_UNDEFINED,0,NULL);
            if (JS_IsException(ret)) {
                JSValue err=jsEngine->getExceptionMessage();
                jsEngine->printJsValue(err);
                JS_FreeValue(jsEngine->getContext(),err);
            }

            JS_FreeValue(jsEngine->getContext(),ret);
        }
    }

    if (status==WL_CONNECTED && !webServerStarted) {
        webServerStarted=true;
        webServer.begin(80);
        webServer.addHandler(new NetPluginRequestHandler(*this));
    }
}

void NetPlugin::close() {
    JS_FreeValue(jsEngine->getContext(),wifiStatusFunc);
    wifiStatusFunc=JS_UNDEFINED;

    JS_FreeValue(jsEngine->getContext(),httpServerRequestFunc);
    httpServerRequestFunc=JS_UNDEFINED;
}

JSValue NetPlugin::wifiGetStatus(int argc, JSValueConst *argv) {
    switch (WiFi.status()) {
        case WL_NO_SHIELD:
            return JS_NewString(jsEngine->getContext(), "noShield");

        case WL_IDLE_STATUS:
            return JS_NewString(jsEngine->getContext(), "idle");

        case WL_NO_SSID_AVAIL:
            return JS_NewString(jsEngine->getContext(), "noSsid");

        case WL_CONNECT_FAILED:
            return JS_NewString(jsEngine->getContext(), "connectFailed");

        case WL_CONNECTION_LOST:
            return JS_NewString(jsEngine->getContext(), "connectionLost");

        case WL_DISCONNECTED:
            return JS_NewString(jsEngine->getContext(), "disconnected");

        case WL_CONNECTED:
            return JS_NewString(jsEngine->getContext(), "connected");
    }

    return JS_UNDEFINED;
}

JSValue NetPlugin::wifiGetIp(int argc, JSValueConst *argv) {
    String ipStr=WiFi.localIP().toString();
    return JS_NewString(jsEngine->getContext(),ipStr.c_str());
}

JSValue NetPlugin::wifiConnect(int argc, JSValueConst *argv) {
    if (argc!=2)
        return JS_ThrowInternalError(jsEngine->getContext(),"wrong arg count");

    const char *ssid=JS_ToCString(jsEngine->getContext(),argv[0]);
    const char *password=JS_ToCString(jsEngine->getContext(),argv[1]);

    WiFi.mode(WIFI_STA);
    WiFi.begin(ssid,password);

    JS_FreeCString(jsEngine->getContext(),ssid);
    JS_FreeCString(jsEngine->getContext(),password);

    return JS_UNDEFINED;
}

JSValue NetPlugin::wifiDisconnect(int argc, JSValueConst *argv) {
    WiFi.disconnect();
    return JS_UNDEFINED;
}

JSValue NetPlugin::wifiSetStatusFunc(int argc, JSValueConst *argv) {
    if (argc!=1)
        return JS_ThrowInternalError(jsEngine->getContext(),"wrong arg count");

    JS_FreeValue(jsEngine->getContext(),wifiStatusFunc);
    wifiStatusFunc=JS_DupValue(jsEngine->getContext(),argv[0]);
    return JS_UNDEFINED;
}

JSValue NetPlugin::httpServerSetRequestFunc(int argc, JSValueConst *argv) {
    if (argc!=1)
        return JS_ThrowInternalError(jsEngine->getContext(),"wrong arg count");

    JS_FreeValue(jsEngine->getContext(),httpServerRequestFunc);
    httpServerRequestFunc=JS_DupValue(jsEngine->getContext(),argv[0]);
    return JS_UNDEFINED;
}

JSValue NetPlugin::httpServerGetPostData(int argc, JSValueConst *argv) {
    String body=webServer.arg("plain");

    return JS_NewString(jsEngine->getContext(),body.c_str());
}