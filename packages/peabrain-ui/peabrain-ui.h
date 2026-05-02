#pragma once
#include <memory>
#include "EncoderKnob.h"
#include "DebouncePin.h"

extern "C" {
	void ui_setup();
	void ui_start();
	void ui_loop();
}

std::shared_ptr<EncoderKnob> getUiKnob();
std::shared_ptr<DebouncePin> getUiButton();
