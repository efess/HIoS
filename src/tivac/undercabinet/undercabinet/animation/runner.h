/*
 * runner.h
 *
 *  Created on: Jan 3, 2016
 *      Author: efess
 */

#ifndef ANIMATION_RUNNER_H_
#define ANIMATION_RUNNER_H_

#include <stdint.h>
#include "../pixels.h"
#include "../settings.h"

typedef struct {
	uint32_t color;
	uint8_t brightness;
	uint16_t position;
} RunnerState;

void runner_setup(void *g_state, RoomStateSettings* settings);
void runner_frame(void *g_state, Pixels* pixels);

#endif /* ANIMATION_RUNNER_H_ */
