/*
 * sound.h
 *
 *  Created on: Jan 23, 2016
 *      Author: efess
 */

#ifndef SOUND_H_
#define SOUND_H_
#include <stdbool.h>
#include <stdint.h>
void sound_init();

void sound_getFreq(float bins[], uint8_t binCount);

#endif /* SOUND_H_ */
