/*
 * pixelate.h
 *
 *  Created on: Jan 3, 2016
 *      Author: efess
 */

#ifndef TRANSITION_PIXELATE_H_
#define TRANSITION_PIXELATE_H_

#include <stdint.h>
#include "../pixels.h"

typedef struct {
	uint8_t from[LED_BYTE_COUNT];
	uint16_t frameNum;
	uint8_t pixelated[50];

} PixelateState;

void pixelate_setup(void* transition_state, Pixels* pixels);
bool pixelate_frame(void* transition_state, Pixels* pixels);


#endif /* TRANSITION_PIXELATE_H_ */
