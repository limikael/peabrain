#include <Arduino.h>
#include "SoftTimer.h"
#include "canopener.h"
#include "Blinker.h"
#include "MotorController.h"
#include <Preferences.h>
#include "pins.h"

using namespace canopener;

const char *hardError=nullptr;
SoftTimer errorTimer(100);
Blinker blink;
auto espBus=std::make_shared<EspBus>(5,4);
auto dev=std::make_shared<Device>(espBus);
MotorController motorController(dev);

#ifdef SETTINGS_FROM_NVS
Preferences prefs;
#endif

void setup() {
    Serial.begin(112500);
    blink.setPin(8);

#ifdef SETTINGS_FROM_NVS
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
    dev->setNodeId(prefs.getUChar("deviceId"));

	pinMode(prefs.getUChar("m0Pin"),OUTPUT);
	digitalWrite(prefs.getUChar("m0Pin"),HIGH);
	pinMode(prefs.getUChar("m1Pin"),OUTPUT);
	digitalWrite(prefs.getUChar("m1Pin"),HIGH);
	pinMode(prefs.getUChar("m2Pin"),OUTPUT);
	digitalWrite(prefs.getUChar("m2Pin"),HIGH);

    motorController.setPulPin(prefs.getUChar("pulPin"));
    motorController.setDirPin(prefs.getUChar("dirPin"));
    motorController.setEnaPin(prefs.getUChar("enaPin"));
#else
    blink.setPin(STATUS_LED_PIN);
    dev->setNodeId(DEVICE_ID);

    pinMode(M0_PIN,OUTPUT);
    digitalWrite(M0_PIN,HIGH);
    pinMode(M1_PIN,OUTPUT);
    digitalWrite(M1_PIN,HIGH);
    pinMode(M2_PIN,OUTPUT);
    digitalWrite(M2_PIN,HIGH);

    motorController.setPulPin(PUL_PIN);
    motorController.setDirPin(DIR_PIN);
    motorController.setEnaPin(ENA_PIN);
#endif

    motorController.setBaseIndex(0x6000);
    motorController.setBaseSubIndex(0x00);
    motorController.begin();
}

void loop() {
#ifdef SETTINGS_FROM_NVS
    digitalWrite(prefs.getUChar("m0Pin"),HIGH);
    digitalWrite(prefs.getUChar("m1Pin"),HIGH);
    digitalWrite(prefs.getUChar("m2Pin"),HIGH);
#else
    digitalWrite(M0_PIN,HIGH);
    digitalWrite(M1_PIN,HIGH);
    digitalWrite(M2_PIN,HIGH);
#endif

	blink.loop();
    if (hardError) {
        blink.setPattern("x x x x x ");
        if (errorTimer.tick())
            Serial.printf("%s\n",hardError);

        return;
    }

    espBus->loop();
    motorController.loop();

    if (!espBus->isConnected())
        blink.setPattern("xxxxxxxxx ");

    else if (dev->getState()!=Device::OPERATIONAL)
        blink.setPattern("x         ");

    else
        blink.setPattern("x");
}
