/*
 * normal.h
 *
 *  Created on: Jan 11, 2016
 *      Author: efess
 */

#ifndef ANIMATION_NORMAL_H_
#define ANIMATION_NORMAL_H_

#include <stdint.h>
#include "../pixels.h"
#include "../settings.h"

typedef struct {
	uint8_t brightness;
	uint32_t color;
	uint8_t rendered;
} NormalState;

void normal_setup(void *g_state, RoomStateSettings* settings);
void normal_frame(void *g_state, Pixels* pixels);

#endif /* ANIMATION_NORMAL_H_ */
