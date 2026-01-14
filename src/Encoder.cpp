#include <Arduino.h>
#include "Encoder.h"

static const int8_t transitionTable[16] = {
     0, -1,  1,  0,
     1,  0,  0, -1,
    -1,  0,  0,  1,
     0,  1, -1,  0
};

Encoder::Encoder(int a, int b)
    : pinA(a), pinB(b) {}

void Encoder::begin() {
    pinMode(pinA, INPUT_PULLUP);
    pinMode(pinB, INPUT_PULLUP);

    lastState = (digitalRead(pinA) << 1) | digitalRead(pinB);

    attachInterruptArg(pinA, isr, this, CHANGE);
    attachInterruptArg(pinB, isr, this, CHANGE);
}

void IRAM_ATTR Encoder::isr(void* arg) {
    static_cast<Encoder*>(arg)->handle();
}

void IRAM_ATTR Encoder::handle() {
    uint8_t state = (digitalRead(pinA) << 1) | digitalRead(pinB);
    uint8_t index = (lastState << 2) | state;
    value += transitionTable[index];
    lastState = state;
}

uint8_t Encoder::getValue() {
    return (((value+2)/4)&63);
}

uint8_t Encoder::readValue() {
    reportedValue=getValue();
    return reportedValue;
}

bool Encoder::isChanged() {
    return (reportedValue!=getValue());
}
