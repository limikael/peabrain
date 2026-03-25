#include <Arduino.h>
#include "SoftTimer.h"
#include "canopener.h"
#include "Blinker.h"
#include "MotorController.h"
#include <Preferences.h>

using namespace canopener;

const char *hardError=nullptr;
SoftTimer errorTimer(100);
Blinker blink;
EspBus espBus(5,4);
Device dev(espBus);
MotorController motorController(dev);
Preferences prefs;

void setup() {
    Serial.begin(112500);
    blink.setPin(8);
    if (!prefs.begin("config",true)) {
        hardError="Config section missing";
        return;
    }

    if (!prefs.isKey("statusLedPin") ||
            !prefs.isKey("deviceId") ||
            !prefs.isKey("enaPin") ||
            !prefs.isKey("dirPin") ||
            !prefs.isKey("pulPin") ||
            !prefs.isKey("m0Pin") ||
            !prefs.isKey("m1Pin") ||
            !prefs.isKey("m2Pin")) {
        hardError="Config keys missing";
        return;
    }

    blink.setPin(prefs.getUChar("statusLedPin"));
    dev.setNodeId(prefs.getUChar("deviceId"));

	pinMode(prefs.getUChar("m0Pin"),OUTPUT);
	digitalWrite(prefs.getUChar("m0Pin"),HIGH);
	pinMode(prefs.getUChar("m1Pin"),OUTPUT);
	digitalWrite(prefs.getUChar("m1Pin"),HIGH);
	pinMode(prefs.getUChar("m2Pin"),OUTPUT);
	digitalWrite(prefs.getUChar("m2Pin"),HIGH);

    motorController.setPulPin(prefs.getUChar("pulPin"));
    motorController.setDirPin(prefs.getUChar("dirPin"));
    motorController.setEnaPin(prefs.getUChar("enaPin"));
    motorController.setBaseIndex(0x6000);
    motorController.setBaseSubIndex(0x00);
    motorController.begin();
}

void loop() {
    digitalWrite(prefs.getUChar("m0Pin"),HIGH);
    digitalWrite(prefs.getUChar("m1Pin"),HIGH);
    digitalWrite(prefs.getUChar("m2Pin"),HIGH);

	blink.loop();
    if (hardError) {
        blink.setPattern("x x x x x ");
        if (errorTimer.tick())
            Serial.printf("%s\n",hardError);

        return;
    }

    espBus.loop();
    motorController.loop();

    if (!espBus.isConnected())
        blink.setPattern("xxxxxxxxx ");

    else if (dev.getState()!=Device::OPERATIONAL)
        blink.setPattern("x         ");

    else
        blink.setPattern("x");
}
