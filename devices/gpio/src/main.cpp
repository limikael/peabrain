#include <Arduino.h>
#include "SoftTimer.h"
#include "canopener.h"
#include "Blinker.h"
#include <Preferences.h>

using namespace canopener;

const char *hardError;
SoftTimer errorTimer(100);
SoftTimer timer(100);
EspBus espBus(5,4);
Blinker blink; //(8,100);
Device dev(espBus);
Preferences prefs;

int gpioPins[8]={0,1,3,6,7,10,20,21};

void setup() {
    Serial.begin(112500);
    blink.setPin(8);
    if (!prefs.begin("config",true)) {
        hardError="Config section missing";
        return;
    }

    if (!prefs.isKey("statusLedPin") ||
            !prefs.isKey("deviceId")) {
        hardError="Config keys missing";
        return;
    }

    blink.setPin(prefs.getUChar("statusLedPin"));
    dev.setNodeId(prefs.getUChar("deviceId"));

    for (int i=0; i<7; i++) {
        dev.insert(0x6001,i+1); // input
        dev.insert(0x6201,i+1); // output
        dev.insert(0x2001,i+1); // mode
    }
}

void loop() {
    blink.loop();
    if (hardError) {
        blink.setPattern("x x x x x ");
        if (errorTimer.tick())
            Serial.printf("%s\n",hardError);

        return;
    }

    espBus.loop();

    for (int i=0; i<7; i++) {
        int mode=INPUT;
        switch (dev.at(0x2001,i+1).get<int>()) {
            case 1: mode=OUTPUT; break;
            case 2: mode=INPUT_PULLUP; break;
            case 3: mode=INPUT_PULLDOWN; break;
        }

        pinMode(gpioPins[i],mode);
        digitalWrite(gpioPins[i],dev.at(0x6201,i+1).get<int>());
        dev.at(0x6001,i+1).set(digitalRead(gpioPins[i]));
    }

    if (!espBus.isConnected())
        blink.setPattern("xxxxxxxxx ");

    else if (dev.getState()!=Device::OPERATIONAL)
        blink.setPattern("x         ");

    else
        blink.setPattern("x");
}