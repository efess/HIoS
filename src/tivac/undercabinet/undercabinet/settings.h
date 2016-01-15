/*
 * settings.h
 *
 *  Created on: Jan 4, 2016
 *      Author: efess
 */

#ifndef SETTINGS_H_
#define SETTINGS_H_

#include <stdint.h>
#include "math.h"

typedef struct {
	uint8_t brightness;
	uint8_t transition;
	uint8_t animation;
	uint32_t color;
	uint32_t colorPallete[16];
} RoomStateSettings;

typedef struct {
	uint16_t occupiedTimeout; // seconds
	RoomStateSettings occupied;
	RoomStateSettings unoccupied;
} Settings;


uint8_t settings_getBrightness(uint8_t settingsBrightness);

#endif /* SETTINGS_H_ */
