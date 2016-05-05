/*
 * normal.c
 *
 *  Created on: Jan 11, 2016
 *      Author: efess
 */

#include "normal.h"
#include "string.h"
#include "math.h"
#include "../sound.h"
#include "../util/rgbfunc.h"

void normal_setup(void *g_state, RoomStateSettings* settings)
{
	NormalState *state = g_state;

	memset(state, 0, sizeof(NormalState));
	state->brightness = settings_getBrightness(settings->brightness);
	state->color = settings->color;
}

void normal_frame(void *g_state, Pixels* pixels)
{
	float freqs[16];
	sound_getFreq(freqs, 16);

	NormalState *state = g_state;
	uint8_t normalBrightness = 0x66;
	uint8_t range = 0xff - normalBrightness;
	uint8_t newBrightness = 0;

	uint16_t i;
	for(i = 0; i < pixels->pixelCount; i++)
	{
		newBrightness = normalBrightness + (uint8_t)fminf(freqs[i] / 1000 * range, range);
		pixels_setPixelColor(pixels, i, changeBrightness(state->color, newBrightness));//state->brightness));
    }
}
