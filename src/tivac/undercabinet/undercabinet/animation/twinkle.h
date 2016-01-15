/*
 * twinkle.h
 *
 *  Created on: Jan 4, 2016
 *      Author: efess
 */

#ifndef ANIMATION_TWINKLE_H_
#define ANIMATION_TWINKLE_H_

#include <stdint.h>
#include "twinkle.h"
#include "../pixels.h"
#include "../settings.h"


typedef struct {
	uint16_t lifeCounter;
	uint8_t options;
} Twinkle;

typedef struct {
	Twinkle twinkle[LED_COUNT];
	uint16_t frameNum;

} TwinkleState;

void twinkle_setup(void *g_state, RoomStateSettings* settings);

void twinkle_frame(void *g_state, Pixels* pixels);


#endif /* ANIMATION_TWINKLE_H_ */
