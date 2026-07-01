#include "peabrain-ui.h"
#include "Lcd.h"

void ui_setup() {
    Lcd::getInstance()->begin();
}

void ui_start() {
    Lcd::getInstance()->reset();
}

void ui_loop() {
    getUiKnob()->loop();
    getUiButton()->loop();
    Lcd::getInstance()->loop();
}

std::shared_ptr<EncoderKnob> getUiKnob() {
    static std::shared_ptr<EncoderKnob> instance;
    if (!instance) {
        instance=std::shared_ptr<EncoderKnob>(new EncoderKnob(20,21));
        instance->begin();
    }

    return instance;
}

std::shared_ptr<DebouncePin> getUiButton() {
    static std::shared_ptr<DebouncePin> instance;
    if (!instance) {
        instance=std::shared_ptr<DebouncePin>(new DebouncePin(10));
        instance->begin();
    }

    return instance;
}
