#pragma once
#include <Arduino.h>

class SoftTimer {
private:
    unsigned long interval;
    unsigned long last;

public:
    SoftTimer(unsigned long intervalMs)
        : interval(intervalMs), last(0) {}

    bool tick() {
        unsigned long now = millis();

        if (now - last >= interval) {
            last = now;              // schedule next tick from *now*
            return true;
        }

        return false;
    }

    void reset() {
        last = millis();
    }

    void setInterval(unsigned long intervalMs) {
        interval = intervalMs;
    }
};