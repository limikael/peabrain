#pragma once
#include <LiquidCrystal_I2C.h>

#define LCD_ROWS 4
#define LCD_COLS 20
#define LCD_SIZE (LCD_ROWS*LCD_COLS)

class LcdController {
public:
    LcdController(LiquidCrystal_I2C& lcd)
        : lcd(lcd) {
        memset(current, ' ', LCD_SIZE);
    }

    void update(const char* next);
    void clear() { memset(current, ' ', LCD_SIZE); }

private:
    LiquidCrystal_I2C& lcd;
    char current[LCD_SIZE];
};