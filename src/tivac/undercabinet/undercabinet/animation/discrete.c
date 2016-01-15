/*
 * discrete.c
 *
 *  Created on: Jan 11, 2016
 *      Author: efess
 */
#include "discrete.h"
#include "string.h"
#include "../util/rgbfunc.h"

void discrete_setup(void *g_state, RoomStateSettings* settings)
{
	DiscreteState *state = g_state;

	memset(state, 0, sizeof(DiscreteState));
	state->brightness = settings_getBrightness(settings->brightness);
	state->color = settings->color;
}

void discrete_frame(void *g_state, Pixels* pixels)
{
	DiscreteState *state = g_state;

	uint16_t i;
	for(i = 0; i < pixels->pixelCount; i++)
	{
		if((uint32_t)floor(i / 6.0) % 4 == 0) {
			// ON
			pixels_setPixelColor(pixels, i, changeBrightness(state->color, state->brightness));
		} else {
			// OFF
			pixels_setPixelColor(pixels, i, 0x000000);
		}
    }
}
