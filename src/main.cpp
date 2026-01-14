#include "JsEngine.h"
#include "CanPlugin.h"
#include "UiPlugin.h"
#include <Arduino.h>
#include "FS.h"
#include "SPIFFS.h"

JsEngine js(Serial);
//CanPlugin can(5,4);
UiPlugin ui;

void myTask(void *arg) {
    for (;;) {
        taskYIELD();
		js.loop();
    }
}

void setup() {
    ui.begin();

    //js.addPlugin(&can);
    js.addPlugin(&ui);

	/*pinMode(8,OUTPUT);
	digitalWrite(8,0);*/

    //Serial.setRxBufferSize(1024);  // must be BEFORE begin()
    Serial.begin(112500);
    if (!SPIFFS.begin(true)) { // true = format if mount fails
        Serial.println("SPIFFS Mount Failed");
    }

    //js.begin();

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
	//js.loop();
}