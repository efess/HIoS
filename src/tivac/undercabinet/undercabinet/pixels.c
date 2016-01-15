#include "pixels.h"

void pixels_setAllColor(Pixels* pixels, uint32_t color)
{
	uint16_t i = pixels->pixelCount;
	uint8_t* pixRef = pixels->pixelData;
	while(i > 0)
	{
		i--;

		*(pixRef) = (color >> 16) & 0xFF;
		*(pixRef + 1) = (color >> 8) & 0xFF;
		*(pixRef + 2) = color & 0xFF;

		pixRef += 3;
	}
}

void pixels_setPixelColor(Pixels* pixels, uint16_t pixNum, uint32_t color)
{
	uint8_t *pixRef = pixels->pixelData + (3 * pixNum);

	*pixRef = (color >> 16) & 0xFF;
	*(pixRef + 1) = (color >> 8) & 0xFF;
	*(pixRef + 2) =  color & 0xFF;
}

void pixels_setPixelValues(Pixels* pixels, uint16_t pixNum, uint8_t r, uint8_t g, uint8_t b)
{
	uint8_t *pixRef = pixels->pixelData + (3 * pixNum);

	*pixRef = r;
	*(pixRef + 1) = g;
	*(pixRef + 2) = b;
}

uint32_t pixels_getPixelColor(Pixels* pixels, uint16_t pixNum)
{
	uint8_t *pixRef = pixels->pixelData + (3 * pixNum);

	return ((uint32_t)(*pixRef) << 16) | ((uint32_t)(*(pixRef + 1)) << 8) | (uint32_t)(*(pixRef + 2));
}
