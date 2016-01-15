#include <Arduino.h>

uint8_t red(uint32_t color);
uint8_t green(uint32_t color);
uint8_t blue(uint32_t color);
uint32_t combine(uint8_t r, uint8_t g, uint8_t b);
uint8_t max3(uint8_t a, uint8_t b, uint8_t c) ;
uint8_t brightness(uint32_t color);
uint32_t changeBrightness(uint32_t color, uint8_t newBrightness);
uint32_t blendA(uint32_t color1, uint32_t color2, uint8_t alph);
uint32_t bufferToUInt32(uint8_t *buffer);
uint32_t threeByteBufferToUInt32(uint8_t *buffer);
