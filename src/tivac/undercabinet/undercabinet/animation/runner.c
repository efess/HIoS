#include "runner.h"
#include "../pixels.h"
#include "../util/rgbfunc.h"

#define RUNNER_DRAG_LENGTH 10

void runner_setup(void *g_state, RoomStateSettings* settings)
{
	RunnerState *state = g_state;
	state->position = 0;
	state->color = settings->color;
	state->brightness = settings_getBrightness(settings->brightness);
}

void runner_frame(void *g_state, Pixels* pixels)
{
	RunnerState *state = g_state;
    int steps = 255 / RUNNER_DRAG_LENGTH;
	uint16_t idx = 0;
	uint8_t count = 0;

    for(count = 0; count < pixels->pixelCount; count++)
	{
    	pixels_setPixelColor(pixels, count, 0x000000);
    }

    for(count = 0; count < RUNNER_DRAG_LENGTH; count++)
	{
		idx = (state->position - count + pixels->pixelCount) % pixels->pixelCount;
		pixels_setPixelColor(pixels, idx,
				changeBrightness(
						changeBrightness(state->color, (RUNNER_DRAG_LENGTH - count) * steps),
						state->brightness));
    }

    state->position = (state->position + 1) % pixels->pixelCount;
}
