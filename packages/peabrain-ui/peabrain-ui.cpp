#include "peabrain-ui.h"
#include <Arduino.h>
#include <LiquidCrystal_I2C.h>

LiquidCrystal_I2C lcd(0x27,20,4);

/*	
	"sdaPin": 8,
	"slcPin": 9,
*/

void ui_setup() {
    Wire.begin(8,9); // SDA, SLC ... sdaPin, slcPin); 
    Wire.setClock(400000);
    lcd.init();
    lcd.backlight();
    lcd.clear();
    lcd.setCursor(0,0);
    lcd.print("Starting...");
}