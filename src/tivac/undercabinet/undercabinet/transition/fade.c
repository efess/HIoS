#include "fade.h"
#include "../util/rgbfunc.h"
#include "../pixels.h"

void fade_setup(void* transition_state, Pixels* pixels)
{
	FadeState *state = transition_state;
	state->fadeAmount = 0;
	memcpy(state->from, pixels->pixelData, LED_BYTE_COUNT);
}

bool fade_frame(void* transition_state, Pixels* pixels)
{
	FadeState *state = transition_state;
	uint8_t alpha = 0;
	uint16_t i = 0;
	uint32_t fromPixel;
	uint32_t toPixel;
	uint8_t* fromPtr;
	uint8_t* toPtr;
	bool transitionDone = false;

	if(state->fadeAmount > 249)
	{
		transitionDone = true;
	}
	else
	{
		alpha = 255 - state->fadeAmount;
		state->fadeAmount += 5;
	}

	for(i = 0; i < pixels->pixelCount; i++)
	{
		fromPtr = state->from + (i * 3);
		fromPixel = combine(*fromPtr, *(fromPtr + 1), *(fromPtr + 2));

		toPtr = pixels->pixelData + (i * 3);
		toPixel = combine(*toPtr, *(toPtr + 1), *(toPtr + 2));

		pixels_setPixelColor(pixels, i, blendA(fromPixel, toPixel, alpha));
//		stepColor = blendA(fromColor, toColor, alpha);
//
//		ws2812.setPixelColor(i, blendA(toColor, fromColor, alpha));
	}

	return transitionDone;
}
