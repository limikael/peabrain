#include "UiPlugin.h"

UiPlugin::UiPlugin():
		lcd(0x27,20,4),
        encoder(20,21),
        button(10) {
    buttonFunc=JS_UNDEFINED;
    encoderFunc=JS_UNDEFINED;
}

void UiPlugin::begin() {
	Wire.begin(8, 9); 
	//Wire.setClock(100000);
    Wire.setClock(400000);
    lcd.init();
    lcd.backlight();
    lcd.clear();
    lcd.setCursor(0,0);
    //lcd.print("Starting...");

    encoder.begin();
    //button.begin();
}

void UiPlugin::setJsEngine(JsEngine& jsEngine_) {
	jsEngine=&jsEngine_;
}

void UiPlugin::init() {
	jsEngine->addGlobal("displayWrite",jsEngine->newMethod(this,&UiPlugin::displayWrite,1));
	jsEngine->addGlobal("displaySetCursor",jsEngine->newMethod(this,&UiPlugin::displaySetCursor,2));
    jsEngine->addGlobal("setEncoderFunc",jsEngine->newMethod(this,&UiPlugin::setEncoderFunc,1));
    jsEngine->addGlobal("setButtonFunc",jsEngine->newMethod(this,&UiPlugin::setButtonFunc,1));
    jsEngine->addGlobal("getEncoderValue",jsEngine->newMethod(this,&UiPlugin::getEncoderValue,0));
}

void UiPlugin::loop() {
    if (button.didChange() && !button.getValue()) {
        JSValue ret=JS_Call(jsEngine->getContext(),buttonFunc,JS_UNDEFINED,0,NULL);
        if (JS_IsException(ret)) {
            JSValue err=jsEngine->getExceptionMessage();
            jsEngine->printJsValue(err);
            JS_FreeValue(jsEngine->getContext(),err);
        }

        JS_FreeValue(jsEngine->getContext(),ret);
    }

    if (encoder.isChanged()) {
        uint32_t val=encoder.readValue();

        JSValue argv[1];
        argv[0]=JS_NewUint32(jsEngine->getContext(),val);

        JSValue ret=JS_Call(jsEngine->getContext(),encoderFunc,JS_UNDEFINED,1,argv);
        if (JS_IsException(ret)) {
            JSValue err=jsEngine->getExceptionMessage();
            jsEngine->printJsValue(err);
            JS_FreeValue(jsEngine->getContext(),err);
        }

        JS_FreeValue(jsEngine->getContext(),ret);
        JS_FreeValue(jsEngine->getContext(),argv[0]); 
    }
}

void UiPlugin::close() {
    JS_FreeValue(jsEngine->getContext(),buttonFunc);
    buttonFunc=JS_UNDEFINED;

    JS_FreeValue(jsEngine->getContext(),encoderFunc);
    encoderFunc=JS_UNDEFINED;
}

JSValue UiPlugin::displayWrite(int argc, JSValueConst *argv) {
    if (argc!=1)
        return JS_ThrowTypeError(jsEngine->getContext(), "wrong number of arguments");

    const char *s=JS_ToCString(jsEngine->getContext(),argv[0]);
    if (!s)
	    return JS_UNDEFINED;

    lcd.print(s);

    JS_FreeCString(jsEngine->getContext(),s);

    return JS_UNDEFINED;
}

JSValue UiPlugin::displaySetCursor(int argc, JSValueConst *argv) {
    if (argc!=2)
        return JS_ThrowTypeError(jsEngine->getContext(), "wrong number of arguments");

    int32_t x,y;
    JS_ToInt32(jsEngine->getContext(),&x,argv[0]);
    JS_ToInt32(jsEngine->getContext(),&y,argv[1]);
	lcd.setCursor(x,y);

    return JS_UNDEFINED;
}

JSValue UiPlugin::setButtonFunc(int argc, JSValueConst *argv) {
    JS_FreeValue(jsEngine->getContext(),buttonFunc);
    buttonFunc=JS_DupValue(jsEngine->getContext(),argv[0]);
    return JS_UNDEFINED;
}

JSValue UiPlugin::setEncoderFunc(int argc, JSValueConst *argv) {
    JS_FreeValue(jsEngine->getContext(),encoderFunc);
    encoderFunc=JS_DupValue(jsEngine->getContext(),argv[0]);
    return JS_UNDEFINED;
}

JSValue UiPlugin::getEncoderValue(int argc, JSValueConst *argv) {
    if (argc!=0)
        return JS_ThrowTypeError(jsEngine->getContext(), "wrong number of arguments");

    return JS_NewInt32(jsEngine->getContext(),encoder.getValue());
}
