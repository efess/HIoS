/*
 * freqs.c
 *
 *  Created on: Feb 3, 2016
 *      Author: efess
 */

#include "freqs.h"
#include "string.h"
#include "math.h"
#include "../sound.h"
#include "../util/rgbfunc.h"

void freqs_setup(void *g_state, RoomStateSettings* settings)
{
	FreqsState *state = g_state;

	memset(state, 0, sizeof(FreqsState));
	state->brightness = settings_getBrightness(settings->brightness);
	state->color = settings->color;
}

void freqs_frame(void *g_state, Pixels* pixels)
{
	FreqsState *state = g_state;
	float freqs[16];
	sound_getFreq(freqs, BIN_COUNT);
	uint16_t i;
	uint16_t j;

	uint8_t normalBrightness = 0x66;
	uint8_t range = 0xff - normalBrightness;
	uint8_t newBrightness = 0;

	for(i = 0; i < 16; i++)
	{
		newBrightness = (uint8_t)fminf(freqs[i] / 1000 * range, range);
		if(newBrightness > state->freqs[i])
		{
			state->freqs[i] = newBrightness;
		}
		else if(state->freqs[i] > 10)
		{
			state->freqs[i] = state->freqs[i] - 10;
		}
	}

	for(i = 0; i < pixels->pixelCount; i++)
	{
		// spread bins evenly over array
		j = ((float)i / LED_COUNT) * BIN_COUNT;

		newBrightness = normalBrightness + state->freqs[j];
		pixels_setPixelColor(pixels, i, changeBrightness(state->color, newBrightness));//state->brightness));
    }
}

