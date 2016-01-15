#include "rainbow.h"
#include "../pixels.h"
#include "../util/rgbfunc.h"
#include "stdint.h"

static const uint8_t rgbTransition[256] = { 0, 6, 12, 18, 24, 30, 36, 42, 48, 54, 60, 66, 72,
		78, 84, 90, 96, 102, 108, 114, 120, 126, 132, 138, 144, 150, 156, 162,
		168, 174, 180, 186, 192, 198, 204, 210, 216, 222, 228, 234, 240, 246,
		252, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
		255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
		255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
		255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
		255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
		255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
		255, 255, 249, 243, 237, 231, 225, 219, 213, 207, 201, 195, 189, 183,
		177, 171, 165, 159, 153, 147, 141, 135, 129, 123, 117, 111, 105, 99, 93,
		87, 81, 75, 69, 63, 57, 51, 45, 39, 33, 27, 21, 15, 9, 3, 0, 0, 0, 0, 0,
		0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
		0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
		0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
		0, 0, 0, 0, 0, 0, 0, 0, 0 };

void rainbow_setup(void *g_state, RoomStateSettings* settings)
{
	RainbowState *state = g_state;
	state->brightness = settings_getBrightness(settings->brightness);
	state->step = 0;
}

void rainbow_frame(void *g_state, Pixels* pixels)
{
	uint16_t led;
	RainbowState *state = g_state;
	state->step++;

	for (led = 0; led < pixels->pixelCount; led++) {
		uint32_t color = combine(
				rgbTransition[(uint8_t) (state->step + led)],
				rgbTransition[(uint8_t) (state->step + led + 84)],
				rgbTransition[(uint8_t) (state->step + led + 168)]);

		pixels_setPixelColor(pixels, led, changeBrightness(color, state->brightness));
	}
}
