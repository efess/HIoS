/*
 * fade.h
 *
 *  Created on: Jan 1, 2016
 *      Author: efess
 */

#ifndef TRANSITION_FADE_H_
#define TRANSITION_FADE_H_

#include <stdbool.h>
#include "../pixels.h"

typedef struct {
	uint8_t from[LED_BYTE_COUNT];
	uint8_t fadeAmount;
} FadeState;

void fade_setup(void* transition_state, Pixels* pixels);

bool fade_frame(void* transition_state, Pixels* pixels);

#endif /* TRANSITION_FADE_H_ */
