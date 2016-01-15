#include "led_lights.h"

//led_lights::~led_lights()
//{
//}

led_lights::led_lights(uint16_t _ledCount)
{
	ledCount = _ledCount;
}

void led_lights::changeColor(uint32_t color)
{
	animateChange(currentColor, color);
	currentColor = color;
}

void led_lights::setOptions(uint16_t _options)
{
	options = _options;
}

void led_lights::animateChange(uint32_t fromColor, uint32_t toColor)
{
    uint8_t step = 1;
    uint8_t to = toColor & 0xFF;
    uint8_t current = fromColor & 0xFF;
    
    if(current > to)
    {
        while(current > (to + step)) {
            current -= step;
            set_color(Adafruit_NeoPixel::Color(current, current, current));
			
			ws2812.show();
    
            // wait 20 milliseconds
            delay(20);
        }
    } else {
        while(current < (to - step)) {
            current += step;
			set_color(Adafruit_NeoPixel::Color(current, current, current));
    
			ws2812.show();
    
            // wait 20 milliseconds
            delay(20);
        }
    }

    set_color(toColor);

	lcd.print("hello ");
	lcd.print(toColor);
	ws2812.show();
	lcd.print("done");
}

uint32_t led_lights::createColor(uint8_t r, uint8_t g, uint8_t b)
{
	return Adafruit_NeoPixel::Color(r,g,b);
}

void led_lights::set_color(uint32_t color) 
{
	for(uint8_t p = 0; p < ledCount; p++)
	{
		ws2812.setPixelColor(p, color);
	}
}
