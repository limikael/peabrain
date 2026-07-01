#include "DebouncePin.h"
#include "esp_timer.h"
#include "driver/gpio.h"

DebouncePin::DebouncePin(
    int8_t pin_,
    bool pullup,
    unsigned long debounceMs
)
    : pin(pin_),
      _debounceMs(debounceMs),
      _changed(false),
      _lastChangeTime(0)
{
    //pinMode(pin, pullup ? INPUT_PULLUP : INPUT);

    _lastRaw = readRaw();
    _value   = _lastRaw;
}

void DebouncePin::begin() {
    #if defined(ARDUINO)
        pinMode(pin, INPUT_PULLUP); //pullup ? INPUT_PULLUP : INPUT);

    #elif defined(ESP_PLATFORM)
        gpio_set_direction((gpio_num_t)pin, GPIO_MODE_INPUT);
        gpio_set_pull_mode((gpio_num_t)pin, GPIO_PULLUP_ONLY);
    #endif
}

bool DebouncePin::readRaw() const {
    // If using INPUT_PULLUP, LOW = pressed
    #ifdef ARDUINO
        return digitalRead(pin) == HIGH;

    #elif defined(ESP_PLATFORM)
        return gpio_get_level((gpio_num_t)pin);
    #endif
}

void DebouncePin::update() {
    bool raw = readRaw();
    unsigned long now;

    #ifdef ARDUINO
    now=millis();
    #elif defined(ESP_PLATFORM)
    now=esp_timer_get_time()/1000;
    #endif

    if (raw != _lastRaw) {
        _lastRaw = raw;

        if (now - _lastChangeTime >= _debounceMs) {
            if (raw != _value) {
                _value = raw;
                _changed = true;
                _lastChangeTime = now;
            }
        }
    }
}

bool DebouncePin::getValue() const {
    return _value;
}

/*bool DebouncePin::didChange() {
    update();

    if (_changed) {
        _changed = false;
        return true;
    }
    return false;
}*/

void DebouncePin::loop() {
    update();
    if (_changed) {
        _changed=false;
        changeEvent.emit(getValue());
        if (getValue())
            upEvent.emit();

        else
            downEvent.emit();
    }
}