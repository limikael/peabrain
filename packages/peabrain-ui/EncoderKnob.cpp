#ifdef ARDUINO
#include <Arduino.h>
#endif

#include "EncoderKnob.h"
#include "driver/gpio.h"

static const int8_t transitionTable[16] = {
     0, -1,  1,  0,
     1,  0,  0, -1,
    -1,  0,  0,  1,
     0,  1, -1,  0
};

EncoderKnob::EncoderKnob(int a, int b)
    : pinA(a), pinB(b) {}

void EncoderKnob::begin() {
    #if defined(ARDUINO)
        pinMode(pinA, INPUT_PULLUP);
        pinMode(pinB, INPUT_PULLUP);
        lastState = (digitalRead(pinA) << 1) | digitalRead(pinB);
        attachInterruptArg(pinA, isr, this, CHANGE);
        attachInterruptArg(pinB, isr, this, CHANGE);

    #elif defined(ESP_PLATFORM)
        ESP_ERROR_CHECK(gpio_install_isr_service(0));

        gpio_set_direction((gpio_num_t)pinA, GPIO_MODE_INPUT);
        gpio_set_pull_mode((gpio_num_t)pinA, GPIO_PULLUP_ONLY);
        gpio_set_direction((gpio_num_t)pinB, GPIO_MODE_INPUT);
        gpio_set_pull_mode((gpio_num_t)pinB, GPIO_PULLUP_ONLY);
        lastState=(gpio_get_level((gpio_num_t)pinA)<<1) | gpio_get_level((gpio_num_t)pinB);
        gpio_set_intr_type((gpio_num_t)pinA, GPIO_INTR_ANYEDGE);
        gpio_isr_handler_add((gpio_num_t)pinA, isr, this);
        gpio_set_intr_type((gpio_num_t)pinB, GPIO_INTR_ANYEDGE);
        gpio_isr_handler_add((gpio_num_t)pinB, isr, this);
    #endif
}

void IRAM_ATTR EncoderKnob::isr(void* arg) {
    static_cast<EncoderKnob*>(arg)->handle();
}

void IRAM_ATTR EncoderKnob::handle() {
    uint8_t state;

    #if defined(ARDUINO)
        state=(digitalRead(pinA) << 1) | digitalRead(pinB);

    #elif defined(ESP_PLATFORM)
        state=(gpio_get_level((gpio_num_t)pinA)<<1) | gpio_get_level((gpio_num_t)pinB);
    #endif

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
