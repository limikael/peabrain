#include "NetPlugin.h"
#include <stdlib.h>
#include <WiFi.h>

NetPlugin::NetPlugin() {
    wifiStatusFunc=JS_UNDEFINED;
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
    reportedStatus=(wl_status_t)-1;
}

void NetPlugin::loop() {
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
}

void NetPlugin::close() {
    JS_FreeValue(jsEngine->getContext(),wifiStatusFunc);
    wifiStatusFunc=JS_UNDEFINED;
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
