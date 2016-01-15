/*
 * rainbow.h
 *
 *  Created on: Jan 1, 2016
 *      Author: efess
 */

#ifndef ANIMATION_RAINBOW_H_
#define ANIMATION_RAINBOW_H_

#include <stdint.h>
#include "../pixels.h"
#include "../settings.h"

typedef struct {
	uint8_t brightness;
	uint8_t step;
} RainbowState;

void rainbow_setup(void *g_state, RoomStateSettings* settings);
void rainbow_frame(void *g_state, Pixels* pixels);

#endif /* ANIMATION_RAINBOW_H_ */
