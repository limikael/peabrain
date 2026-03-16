#pragma once

#include <Arduino.h>

class Encoder {
public:
    Encoder();
    Encoder(int pinA, int pinB);
    void begin();
    uint8_t getValue();
    uint8_t readValue();
    bool isChanged();
    int8_t pinA=-1,pinB=-1;

private:
    static void IRAM_ATTR isr(void* arg);
    void IRAM_ATTR handle();

    volatile uint8_t value=0;
    volatile uint8_t reportedValue=0;
    volatile uint8_t lastState=0;
};
