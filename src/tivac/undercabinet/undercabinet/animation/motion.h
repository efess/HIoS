/*
 * motion.h
 *
 *  Created on: Jan 4, 2016
 *      Author: efess
 */

#ifndef ANIMATION_MOTION_H_
#define ANIMATION_MOTION_H_

#include "../pixels.h"
#include "../settings.h"

#define PALLETE_SIZE 16
#define RANDOM_NODE_SIZE 4
#define NODE_DIFFUSE_WIDTH 20

typedef struct {
	uint8_t brightness;

	uint16_t nodeStart[PALLETE_SIZE];
	uint32_t nodeColor[PALLETE_SIZE];

	uint8_t rndNodeIndex[RANDOM_NODE_SIZE];
	uint8_t rndNodeFrequency[RANDOM_NODE_SIZE];
	uint16_t rndNodeStart[RANDOM_NODE_SIZE];

	uint32_t frameNum;
} MotionState;

void motion_setup(void *g_state, RoomStateSettings* settings);
void motion_frame(void *g_state, Pixels* pixels);

#endif /* ANIMATION_MOTION_H_ */
