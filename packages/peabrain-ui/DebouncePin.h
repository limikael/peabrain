#pragma once
#include <Arduino.h>
#include "peabind.h"

class DebouncePin {
public:
    explicit DebouncePin(int8_t pin=-1, bool pullup=true, unsigned long debounceMs=20);
    bool getValue() const;
    bool didChange();
    void update();
    void begin();
    void loop();
    Dispatcher<int> changeEvent;
    Dispatcher<> downEvent;
    Dispatcher<> upEvent;

private:
    int8_t pin=-1;
    unsigned long _debounceMs;
    bool _value;        // debounced (stable) value
    bool _lastRaw;      // last raw read
    bool _changed;      // change flag (event)
    unsigned long _lastChangeTime;
    bool readRaw() const;
};
