#include <Arduino.h>
#include "EncoderKnob.h"

static const int8_t transitionTable[16] = {
     0, -1,  1,  0,
     1,  0,  0, -1,
    -1,  0,  0,  1,
     0,  1, -1,  0
};

EncoderKnob::EncoderKnob(int a, int b)
    : pinA(a), pinB(b) {}

void EncoderKnob::begin() {
    pinMode(pinA, INPUT_PULLUP);
    pinMode(pinB, INPUT_PULLUP);

    lastState = (digitalRead(pinA) << 1) | digitalRead(pinB);

    attachInterruptArg(pinA, isr, this, CHANGE);
    attachInterruptArg(pinB, isr, this, CHANGE);
}

void IRAM_ATTR EncoderKnob::isr(void* arg) {
    static_cast<EncoderKnob*>(arg)->handle();
}

void IRAM_ATTR EncoderKnob::handle() {
    uint8_t state = (digitalRead(pinA) << 1) | digitalRead(pinB);
    uint8_t index = (lastState << 2) | state;
    value += transitionTable[index];
    lastState = state;
}

uint8_t EncoderKnob::getValue() {
    return (((value+2)/4)&63);
}

void EncoderKnob::loop() {
    if (getValue()!=reportedValue) {
        reportedValue=getValue();
        //Serial.printf("change: %d\n",reportedValue);
        changeEvent.emit(reportedValue);
    }
}
