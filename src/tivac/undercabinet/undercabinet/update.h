/*
 * update.h
 *
 *  Created on: Jan 10, 2016
 *      Author: efess
 */

#ifndef UPDATE_H_
#define UPDATE_H_

#include "settings.h"
#include <stdint.h>

uint8_t update_check(Settings* settings);
uint8_t update_init(void);

#endif /* UPDATE_H_ */
