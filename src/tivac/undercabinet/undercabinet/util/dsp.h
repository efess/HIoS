/*
 * dsp.h
 *
 *  Created on: Feb 1, 2016
 *      Author: efess
 */

#ifndef UTIL_DSP_H_
#define UTIL_DSP_H_

#include "stdint.h"
#include "../complex.h"

#define M_PI           3.14159265358979323846  /* pi */

void dsp_fft(uint8_t m, float re[], float im[]);

#endif /* UTIL_DSP_H_ */
