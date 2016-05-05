#include "rgbfunc.h"
#include "math.h"

uint8_t red(uint32_t color) { return color >> 16; }
uint8_t green(uint32_t color) { return (color >> 8) & 0xFF; }
uint8_t blue(uint32_t color) { return color & 0xFF; }
uint32_t combine(uint8_t r, uint8_t g, uint8_t b) { return ((uint32_t)r << 16) | ((uint32_t)g << 8) | (uint32_t)b; }

uint8_t max3(uint8_t a, uint8_t b, uint8_t c)
{
    uint8_t m = a;
    (m < b) && (m = b);
    (m < c) && (m = c);
    return m;
}
uint8_t min3(uint8_t a, uint8_t b, uint8_t c)
{
    uint8_t m = a;
    (m > b) && (m = b);
    (m > c) && (m = c);
    return m;
}

uint8_t brightness(uint32_t color)
{
	return max3(red(color), green(color), blue(color));
}

uint32_t changeBrightness(uint32_t color, uint8_t newBrightness)
{
    uint8_t maxValue = fmax(brightness(color), 1);

	return combine(
		(red(color) * newBrightness) / maxValue,
		(green(color) * newBrightness) / maxValue,
		(blue(color) * newBrightness) / maxValue);
}
uint32_t blendA(uint32_t color1, uint32_t color2, uint8_t alph) {
    uint16_t alpha = alph + 1;
    uint16_t inv_alpha = 256 - alph;

    return combine((uint16_t)(red(color1) * alpha + inv_alpha * (uint16_t)red(color2)) >> 8,
        ((uint16_t)green(color1) * alpha + inv_alpha * (uint16_t)green(color2)) >> 8,
        ((uint16_t)blue(color1) * alpha + inv_alpha * (uint16_t)blue(color2)) >> 8);
}
