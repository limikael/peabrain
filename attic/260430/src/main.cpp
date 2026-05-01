#include "JsEngine.h"
#include "CanPlugin.h"
#include "UiPlugin.h"
//#include "NetPlugin.h"
#include "FsPlugin.h"
#include <Arduino.h>
#include <Preferences.h>
#include "FS.h"
#include "SPIFFS.h"
#include "SoftTimer.h"

JsEngine js(Serial);
CanPlugin can(5,4);
UiPlugin ui;
//NetPlugin net;
FsPlugin fsPlugin;
Preferences prefs;
const char *hardError;
SoftTimer errorTimer(100);

void myTask(void *arg) {
    for (;;) {
        taskYIELD();
		js.loop();
    }
}

void setup() {
    Serial.begin(112500);

    if (!prefs.begin("config",true)) {
        hardError="Config section missing";
        return;
    }

    if (!prefs.isKey("sdaPin") ||
            !prefs.isKey("slcPin") ||
            !prefs.isKey("encoderPinA") ||
            !prefs.isKey("encoderPinB") ||
            !prefs.isKey("buttonPin")) {
        hardError="Config keys missing";
        return;
    }

    ui.sdaPin=prefs.getUChar("sdaPin");
    ui.slcPin=prefs.getUChar("slcPin");
    ui.encoderPinA=prefs.getUChar("encoderPinA");
    ui.encoderPinB=prefs.getUChar("encoderPinB");
    ui.buttonPin=prefs.getUChar("buttonPin");

    js.setPrefs(&prefs);

    js.addPlugin(&can);
    js.addPlugin(&ui);
    //js.addPlugin(&net);
    js.addPlugin(&fsPlugin);

    if (!SPIFFS.begin(true)) { // true = format if mount fails
        Serial.println("SPIFFS Mount Failed");
    }

    //pinMode(8,OUTPUT);

	xTaskCreatePinnedToCore(
        myTask,
        "myTask",
        16384,     // stack in words (not bytes!)
        nullptr,
        1,
        nullptr,
        ARDUINO_RUNNING_CORE
    );
}

void loop() {
    if (hardError) {
        if (errorTimer.tick()) {
            Serial.printf("%s\n",hardError);
            pinMode(8,OUTPUT);
            digitalWrite(8,!digitalRead(8));
        }
    }
}