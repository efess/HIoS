/*
 * freqs.h
 *
 *  Created on: Feb 3, 2016
 *      Author: efess
 */

#ifndef ANIMATION_FREQS_H_
#define ANIMATION_FREQS_H_

#include <stdint.h>
#include "../pixels.h"
#include "../settings.h"

#define BIN_COUNT 16

typedef struct {
	uint8_t freqs[BIN_COUNT];
	uint8_t brightness;
	uint32_t color;
} FreqsState;

void freqs_setup(void *g_state, RoomStateSettings* settings);
void freqs_frame(void *g_state, Pixels* pixels);

#endif /* ANIMATION_FREQS_H_ */
