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
SoftTimer timer(100);
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
    pinMode(LIMIT_A_PIN,INPUT);
    pinMode(LIMIT_B_PIN,INPUT);

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

    dev->insert(0x6000,0x01)->setType(Entry::UINT32);
    dev->insert(0x6000,0x02)->setType(Entry::UINT32);
    dev->insert(0x2000,0x00)->setType(Entry::UINT32);

    motorController.setBaseIndex(0x6000);
    motorController.setBaseSubIndex(0x00);
    motorController.begin();
}

void loop() {
    int v;

    v=digitalRead(LIMIT_A_PIN);
    if (v!=dev->at(0x6000,0x01)->getInt())
        dev->at(0x6000,0x01)->setInt(v);

    v=digitalRead(LIMIT_B_PIN);
    if (v!=dev->at(0x6000,0x02)->getInt())
        dev->at(0x6000,0x02)->setInt(v);

    int m0Pin,m1Pin,m2Pin;

#ifdef SETTINGS_FROM_NVS
    m0Pin=prefs.getUChar("m0Pin");
    m1Pin=prefs.getUChar("m1Pin");
    m2Pin=prefs.getUChar("m2Pin");
#else
    m0Pin=M0_PIN;
    m1Pin=M1_PIN;
    m2Pin=M2_PIN;
#endif

    int microstep=dev->at(0x2000,0)->getInt();
    digitalWrite(m0Pin,microstep&0x01);
    digitalWrite(m1Pin,microstep&0x02);
    digitalWrite(m2Pin,microstep&0x04);

	blink.loop();
    if (hardError) {
        blink.setPattern("x x x x x ");
        if (errorTimer.tick())
            Serial.printf("%s\n",hardError);

        return;
    }

    if (timer.tick()) {
        //Serial.printf("limits: %d %d\n",digitalRead(LIMIT_A_PIN),digitalRead(LIMIT_B_PIN));
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
