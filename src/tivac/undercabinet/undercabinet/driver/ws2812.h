#include "../pixels.h"
//
// set the number of LEDs
//

//
// WS2812x timing
//
#define SPI_SPEED 5000000 // 5000000 = 5MHz = 0.2us per bit
#define WS2812B_0 0xC0 // 0xC0 @ 5MHz SPI = 0.4us + 1.2us
#define WS2812B_1 0xF8 // 0xF8  = 1us + 0.6us

//void DataInit();
void ws2812_init(uint16_t ledCount);
void ws2812_sendData(Pixels* pixelData);
void ws2812_setLED(uint8_t ledNumber, uint8_t r, uint8_t g, uint8_t b);
