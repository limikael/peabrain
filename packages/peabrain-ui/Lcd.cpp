#include "Lcd.h"

Lcd::Lcd()
		:lcd(0x27,20,4) {
	reset();
}

void Lcd::reset() {
	lcd.init();
    lcd.backlight();
    lcd.clear();
    lcd.setCursor(0,0);
}

void Lcd::setBuffer(std::string s) {
	if (s.size()<80)
        s.append(80-s.size(),' ');

    for (int i=0; i<4; i++) {
    	std::string part=s.substr(i*20,20);
		lcd.setCursor(0,i);
		lcd.print(part.c_str());
    }
}

std::shared_ptr<Lcd> Lcd::getInstance() {
	static std::shared_ptr<Lcd> instance;
	if (!instance)
		instance=std::shared_ptr<Lcd>(new Lcd());

	return instance;
}