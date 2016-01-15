/*
 * settings.c
 *
 *  Created on: Jan 9, 2016
 *      Author: efess
 */
#include "settings.h"

uint8_t settings_getBrightness(uint8_t settings_brightness)
{
	return fmin(pow(settings_brightness, 2), 255);
}
