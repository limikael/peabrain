#include "LcdController.h"

inline int idx(int row, int col) {
    return row * LCD_COLS + col;
}

void LcdController::update(const char* next) {
    for (int row = 0; row < LCD_ROWS; row++) {
        int col = 0;

        while (col < LCD_COLS) {
            int i = idx(row, col);

            // Skip unchanged characters
            if (current[i] == next[i]) {
                col++;
                continue;
            }

            // Start of a changed run
            int startCol = col;

            // Temporary buffer for print()
            char buf[LCD_COLS + 1];
            int len = 0;

            while (col < LCD_COLS) {
                int j = idx(row, col);
                if (current[j] == next[j])
                    break;

                buf[len++] = next[j];
                current[j] = next[j];
                col++;
            }

            buf[len] = '\0';

            lcd.setCursor(startCol, row);
            lcd.print(buf);
        }
    }
}