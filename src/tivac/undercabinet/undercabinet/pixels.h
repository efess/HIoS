/*
 * pixels.h
 *
 *  Created on: Jan 1, 2016
 *      Author: efess
 */

#ifndef PIXELS_H_
#define PIXELS_H_
#include <stdint.h>

#define LED_COUNT 231
#define LED_BYTE_COUNT LED_COUNT * 3

typedef struct {
	uint8_t* pixelData;
	uint16_t pixelCount;
} Pixels;

void pixels_setAllColor(Pixels* pixels, uint32_t color);
void pixels_setPixelColor(Pixels* pixels, uint16_t pixNum, uint32_t color);
void pixels_setPixelValues(Pixels* pixels, uint16_t pixNum, uint8_t r, uint8_t g, uint8_t b);
uint32_t pixels_getPixelColor(Pixels* pixels, uint16_t pixNum);

#endif /* PIXELS_H_ */
