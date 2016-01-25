 /*
 * fire.h
 *
 *  Created on: Jan 17, 2016
 *      Author: efess
 */

#ifndef ANIMATION_FIRE_H_
#define ANIMATION_FIRE_H_

#include <stdint.h>
#include <stdbool.h>
#include "../pixels.h"
#include "../settings.h"

#define FIRE_DIFFUSE 10

typedef struct {
	bool isFlareUp;
	uint8_t fireIdx;
} FirePixel;

typedef struct {
	uint8_t brightness;
	FirePixel fire[LED_COUNT];
	uint32_t frameNum;
} FireState;

void fire_setup(void *g_state, RoomStateSettings* settings);
void fire_frame(void *g_state, Pixels* pixels);

#endif /* ANIMATION_FIRE_H_ */
