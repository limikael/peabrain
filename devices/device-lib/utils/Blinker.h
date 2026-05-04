#pragma once
#include <Arduino.h>

class Blinker {
public:
    Blinker(int pin_=-1, int period=100);
    void setPattern(std::string pattern_);
    void loop();
    void setPin(int pin_);

private:
    int index;
    uint32_t deadline;
    int pin=-1;
    int period;
    std::string pattern;
};
