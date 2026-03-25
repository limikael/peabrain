#include "Blinker.h"

Blinker::Blinker(int pin_, int period_) {
	period=period_;
	deadline=0;
	index=0;
	setPin(pin_);
}

void Blinker::setPin(int pin_) {
	pin=pin_;
	if (pin>=0)
		pinMode(pin,OUTPUT);
}

void Blinker::setPattern(std::string pattern_) {
	pattern=pattern_;
}

void Blinker::loop() {
	uint32_t now=millis();
	if (now>deadline) {
		deadline=now+period;
		index++;

		if (index>=pattern.length())
			index=0;

		if (pin>=0)
			digitalWrite(pin,pattern[index]==' ');
	}
}
