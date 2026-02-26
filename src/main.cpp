#include "JsEngine.h"
#include "CanPlugin.h"
#include "UiPlugin.h"
#include "NetPlugin.h"
#include <Arduino.h>
#include "FS.h"
#include "SPIFFS.h"

JsEngine js(Serial);
CanPlugin can(5,4);
UiPlugin ui;
NetPlugin net;

void myTask(void *arg) {
    for (;;) {
        taskYIELD();
		js.loop();
    }
}

void setup() {
    // shouldn't be needed: //ui.begin();

    //js.addPlugin(&can);
    //js.addPlugin(&ui);
    js.addPlugin(&net);

    Serial.begin(112500);
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
}