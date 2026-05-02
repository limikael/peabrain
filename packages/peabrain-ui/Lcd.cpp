#include "Lcd.h"

Lcd::Lcd()
		:lcd(0x27,20,4) {
	written.assign(80,' ');
	reset();
}

void Lcd::reset() {
	lcd.init();
    lcd.backlight();
    lcd.clear();
    lcd.setCursor(0,0);
	written.assign(80,' ');
	buffer.assign(80,' ');
	scanX=0;
	scanY=0;
}

void Lcd::setBuffer(std::string s) {
	if (s.size()<80)
        s.append(80-s.size(),' ');

    buffer=s;
}

void Lcd::loop() {
	int index=scanX+scanY*20;
	if (written[index]!=buffer[index]) {
		written[index]=buffer[index];
		lcd.setCursor(scanX,scanY);
		lcd.print(written[index]);
	}

	scanX++;
	if (scanX>=20) {
		scanX=0;
		scanY++;
		if (scanY>=4) {
			scanY=0;
		}
	}
}

std::shared_ptr<Lcd> Lcd::getInstance() {
	static std::shared_ptr<Lcd> instance;
	if (!instance)
		instance=std::shared_ptr<Lcd>(new Lcd());

	return instance;
}