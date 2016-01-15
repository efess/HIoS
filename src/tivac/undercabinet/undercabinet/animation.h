/*
 * animation.h
 *
 *  Created on: Jan 1, 2016
 *      Author: efess
 */

#ifndef ANIMATION_H_
#define ANIMATION_H_

#include <stdint.h>
#include <stdbool.h>
#include "pixels.h"
#include "settings.h"

#define ANIMATION_TYPE_COUNT 4
#define TRANSITION_TYPE_COUNT 2

void animation_init();

void animation_changeState(Pixels *pixels, Settings *settings, bool isOccupied);
void animation_runFrame(Pixels *pixels);

#endif /* ANIMATION_H_ */
