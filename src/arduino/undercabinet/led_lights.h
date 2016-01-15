#pragma
#include <Adafruit_NeoPixel\Adafruit_NeoPixel.h>
#include "LiquidCrystal_I2C.h"
#include "Arduino.h"

#define PIN_LED_DATAOUT 6
#define LED_COUNT 17

extern Adafruit_NeoPixel ws2812;
extern LiquidCrystal_I2C lcd;

class led_lights
{
public:
	led_lights(uint16_t ledCount);
	void changeColor(uint32_t newColor);
	void setOptions(uint16_t options);
	uint32_t createColor(uint8_t r, uint8_t g, uint8_t b);
private:
	void set_color(uint32_t color);
	void animateChange(uint32_t fromColor, uint32_t toColor);

	uint16_t ledCount;
	uint16_t options;
	uint32_t currentColor;
	uint8_t transitionType;
};

