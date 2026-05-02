#pragma once
#include <memory>
#include <string>
#include <LiquidCrystal_I2C.h>

class Lcd {
public:
	Lcd();
	static std::shared_ptr<Lcd> getInstance();
	void reset();
	void setBuffer(std::string s);
	void loop();

private:
	int scanX,scanY;
	std::string buffer,written;
	LiquidCrystal_I2C lcd;
};
