#include <Arduino.h>
#include "SoftTimer.h"
#include "canopener.h"
#include "Blinker.h"

using namespace canopener;

const char *hardError;
SoftTimer errorTimer(100);
SoftTimer timer(100);
EspBus espBus(5,4);
Blinker blink; //(8,100);
Device dev(espBus);

int gpioPins[8]={0,1,3,6,7,10,20,21};

void setup() {
    Serial.begin(112500);
    //hardError="hello";
    blink.setPin(8);
    dev.setNodeId(7);

    for (int i=0; i<7; i++) {
        dev.insert(0x6001,i+1); // input
        dev.insert(0x6201,i+1); // output
        dev.insert(0x2001,i+1); // mode
    }
}

void loop() {
    /*if (timer.tick()) {
        Serial.printf("input: %d, output: %d, input_pullup: %d\n",INPUT,OUTPUT,INPUT_PULLUP);
    }*/

    espBus.loop();
    blink.loop();

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

    if (hardError) {
	    blink.setPattern("x x x x x ");
        if (errorTimer.tick())
            Serial.printf("%s\n",hardError);
    }

    else if (!espBus.isConnected())
        blink.setPattern("xxxxxxxxx ");

    else if (dev.getState()!=Device::OPERATIONAL)
        blink.setPattern("x         ");

    else
        blink.setPattern("x");
}