#include "Lcd.h"

#ifdef ARDUINO
#include <Wire.h>
#endif

#ifndef ARDUINO
#include "driver/i2c_master.h"
#include <esp_rom_sys.h>
inline void delayMicroseconds(uint32_t us) {
    esp_rom_delay_us(us);
}

i2c_master_bus_handle_t bus;
i2c_master_dev_handle_t lcd;
#endif

Lcd::Lcd() {
	reset();
}

void Lcd::begin() {
	#ifdef ARDUINO
		Wire.begin(8,9); // SDA, SLC - Old Bali milled boards
	    //Wire.begin(6,7); // SDA, SLC - JLCPCB boards
	    Wire.setClock(400000);
	#endif

	#ifndef ARDUINO
		i2c_master_bus_config_t bus_config = {};
		bus_config.i2c_port = I2C_NUM_0;
		bus_config.sda_io_num = GPIO_NUM_8;
		bus_config.scl_io_num = GPIO_NUM_9;
		bus_config.clk_source = I2C_CLK_SRC_DEFAULT;
		bus_config.glitch_ignore_cnt = 7;
		bus_config.flags.enable_internal_pullup = true;

		/*i2c_master_bus_config_t bus_config = {
		    .i2c_port = I2C_NUM_0,
		    .sda_io_num = GPIO_NUM_8,
		    .scl_io_num = GPIO_NUM_9,
		    .clk_source = I2C_CLK_SRC_DEFAULT,
		    .glitch_ignore_cnt = 7,
		    .flags.enable_internal_pullup = true,
		};*/

		ESP_ERROR_CHECK(i2c_new_master_bus(&bus_config, &bus));

		i2c_device_config_t dev_cfg = {};
		dev_cfg.dev_addr_length = I2C_ADDR_BIT_LEN_7;
		dev_cfg.device_address = 0x27;
		dev_cfg.scl_speed_hz = 400000;

		/*i2c_device_config_t dev_cfg = {
		    .dev_addr_length = I2C_ADDR_BIT_LEN_7,
		    .device_address = 0x27,
		    .scl_speed_hz = 100000,
		};*/

		ESP_ERROR_CHECK(i2c_master_bus_add_device(bus, &dev_cfg, &lcd));
	#endif
 
	// SEE PAGE 45/46 FOR INITIALIZATION SPECIFICATION!
	// according to datasheet, we need at least 40ms after power rises above 2.7V
	// before sending commands. Arduino can turn on way befer 4.5V so we'll wait 50
	delayMicroseconds(50000); 

	// Now we pull both RS and R/W low to begin commands
	expanderWrite(LCD_BACKLIGHT);//_backlightval);	// reset expanderand turn backlight off (Bit 8 =1)
	delayMicroseconds(1000000);

		//put the LCD into 4 bit mode
	// this is according to the hitachi HD44780 datasheet
	// figure 24, pg 46

	  // we start in 8bit mode, try to set 4 bit mode
	write4bits(0x03 << 4);
	delayMicroseconds(4500); // wait min 4.1ms

	// second try
	write4bits(0x03 << 4);
	delayMicroseconds(4500); // wait min 4.1ms

	// third go!
	write4bits(0x03 << 4); 
	delayMicroseconds(150);

	// finally, set to 4-bit interface
	write4bits(0x02 << 4); 

	// set # lines, font size, etc.
	writeCommand(LCD_FUNCTIONSET | LCD_4BITMODE | LCD_1LINE | LCD_5x8DOTS | LCD_2LINE);  

	// turn the display on with no cursor or blinking default
	writeCommand(LCD_DISPLAYCONTROL | LCD_DISPLAYON | LCD_CURSOROFF | LCD_BLINKOFF);

	// Initialize to default text direction (for roman languages)
	writeCommand(LCD_ENTRYMODESET | LCD_ENTRYLEFT | LCD_ENTRYSHIFTDECREMENT);

	reset();
}

void Lcd::reset() {
	written.assign(80,0xff);
	buffer.assign(80,' ');
	scanX=0;
	scanY=0;
	cursorX=-1;
	cursorY=-1;
}

void Lcd::setBuffer(std::string s) {
	if (s.size()<80)
        s.append(80-s.size(),' ');

    buffer=s;
}

void Lcd::writeData(uint8_t data) {
    write4bits((data & 0xF0) | 0x01); // Set the RS bit
    write4bits((data << 4) | 0x01);
}

void Lcd::writeCommand(uint8_t data) {
    write4bits((data & 0xF0) | 0x00); // Clear the RS bit
    write4bits((data << 4) | 0x00);
}

void Lcd::write4bits(uint8_t value) {
	expanderWrite(value);
	pulseEnable(value);
}

void Lcd::setCursor(uint8_t col, uint8_t row){
	int row_offsets[] = { 0x00, 0x40, 0x14, 0x54 };
	int _numlines=4;
	if ( row > _numlines ) {
		row = _numlines-1;    // we count rows starting w/0
	}
	writeCommand(LCD_SETDDRAMADDR | (col + row_offsets[row]));
}

void Lcd::expanderWrite(uint8_t data) {
	//#define LCD_BACKLIGHT 0x08
	//#define LCD_NOBACKLIGHT 0x00

	data|=LCD_BACKLIGHT;

	#ifdef ARDUINO
		Wire.beginTransmission(0x27); // addr
		Wire.write(data);
		Wire.endTransmission();   
	#else
	    ESP_ERROR_CHECK(
	        i2c_master_transmit(
	            lcd,
	            &data,
	            1,
	            -1
	        )
	    );
	#endif
}

void Lcd::pulseEnable(uint8_t data){
	expanderWrite(data | 0x04);	// En high
	delayMicroseconds(1);		// enable pulse must be >450ns
	
	expanderWrite(data & ~0x04);	// En low
	delayMicroseconds(50);		// commands need > 37us to settle
} 

void Lcd::loop() {
	int index=scanX+scanY*20;
	if (written[index]!=buffer[index]) {
		written[index]=buffer[index];
		if (scanX!=cursorX || scanY!=cursorY) {
			setCursor(scanX,scanY);
			cursorX=scanX;
			cursorY=scanY;
		}

		//lcd.write(written[index]);
		//lcd.send(written[index],0x01);
		writeData(written[index]);

		cursorX++;
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