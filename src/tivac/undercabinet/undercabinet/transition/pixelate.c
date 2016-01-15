#include <stdbool.h>
#include <stdlib.h>
#include "pixelate.h"

bool isSet(uint8_t* pixelated, uint16_t pixNum)
{
	return (*(pixelated + (pixNum >> 3)) >> (pixNum % 8)) & 1;
}

void set(uint8_t* pixelated, uint16_t pixNum)
{
	*(pixelated + (pixNum >> 3)) |= (1 << (pixNum % 8));
}

void pixelate_setup(void* transition_state, Pixels* pixels)
{
	PixelateState *state = transition_state;
	memcpy(state->from, pixels->pixelData, LED_BYTE_COUNT);
	state->frameNum = 0;
	uint8_t i = 0;
	for(; i < 50; i++)
	{
		state->pixelated[i] = 0;
	}
}

bool pixelate_frame(void* transition_state, Pixels* pixels)
{
	PixelateState *state = transition_state;

	uint8_t pixelsPerTransition = pixels->pixelCount / 8;
	uint8_t pixelsInTransition = 0;
	uint8_t i = 0;

	uint16_t pixNum = 0;
	uint16_t pixelsToTransition = 0;

	// figure out if we're done
	for(i = 0; i < pixels->pixelCount; i++)
	{
		if(!isSet(state->pixelated, i))
		{
			pixelsToTransition++;
			// Not set, not transitioned yet.
			// Reset to data in "from" state
			uint16_t byteIdx = i * 3;
			pixels_setPixelValues(pixels, i,
					state->from[byteIdx],
					state->from[byteIdx + 1],
					state->from[byteIdx + 2]);

		}
	}

	if(state->frameNum++ % 5 != 0) {

		// skip every 5 frames
		return false;// false to continue transition
	}

	if(pixelsToTransition < pixelsPerTransition) {
		return true; // done with transition
	}

	while(pixelsInTransition < pixelsPerTransition)
	{
		pixNum = rand() % pixels->pixelCount;
		if(!isSet(state->pixelated, pixNum))
		{
			set(state->pixelated, pixNum);
			pixelsInTransition++;
		}
	}

	return false; // continue with transition
}
