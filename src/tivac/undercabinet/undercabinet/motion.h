/*
 * motion.h
 *
 *  Created on: Jan 9, 2016
 *      Author: efess
 */

#ifndef MOTION_H_
#define MOTION_H_

#include <stdint.h>
#include <stdbool.h>

bool motion_get_state();
void motion_set_timeout(uint16_t timeout);
void motion_init(void);

#endif /* MOTION_H_ */
