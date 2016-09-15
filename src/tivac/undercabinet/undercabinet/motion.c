/*
 * motion.c
 *
 *  Created on: Jan 9, 2016
 *      Author: efess
 */
#include "motion.h"
#include <stdio.h>
#include "driverlib/sysctl.h"
#include "driverlib/gpio.h"
#include "driverlib/timer.h"
#include "driverlib/rom.h"
#include "inc/hw_memmap.h"
#include "utils/uartstdio.h"

#define MOTION_PORT GPIO_PORTA_BASE
#define MOTION_PIN GPIO_INT_PIN_5
#define MILLISECOND_TIMER TIMER0_BASE

#define CPU_CLOCK 80000000

#define TICKS_PER_MILLISECOND CPU_CLOCK / 1000

uint16_t _motion_timeout;

bool volatile _motion_sensor_occupied;
uint32_t volatile _msCounter;
uint32_t volatile _lastOccupiedDetected;

void motion_event(void)
{
	GPIOIntClear(MOTION_PORT, MOTION_PIN);
	_motion_sensor_occupied = GPIOPinRead(MOTION_PORT, MOTION_PIN);
	if(_motion_sensor_occupied)
	{
		_lastOccupiedDetected = _msCounter;
	}
}

void timer_update(void)
{
	TimerIntClear(MILLISECOND_TIMER, TIMER_BOTH);
	_msCounter++;
}

void configure_motion_gpio(void)
{
	//
	// Register the port-level interrupt handler. This handler is the first
	// level interrupt handler for all the pin interrupts.
	//
	GPIOIntRegister(MOTION_PORT, motion_event);
	//
	// Initialize the GPIO pin configuration.
	//
	// Set pin 5 as input, SW controlled.
	//
	GPIOPinTypeGPIOInput(MOTION_PORT,  MOTION_PIN);
	// Set weak pull down
	GPIOPadConfigSet(MOTION_PORT,
			MOTION_PIN,
			GPIO_STRENGTH_4MA,
			GPIO_PIN_TYPE_STD_WPD);
	//
	// Make pin 5 both edge triggered interrupts.
	//
	GPIOIntTypeSet(MOTION_PORT, MOTION_PIN, GPIO_BOTH_EDGES);
	//
	// Enable the pin interrupt
	//
	GPIOIntEnable(MOTION_PORT, MOTION_PIN);
}

void configure_millisecond_timer()
{
	ROM_SysCtlPeripheralEnable(SYSCTL_PERIPH_TIMER0);

	ROM_SysCtlDelay(5);

	TimerConfigure(MILLISECOND_TIMER, TIMER_CFG_PERIODIC);
	// Timer
	TimerClockSourceSet(MILLISECOND_TIMER, TIMER_CLOCK_SYSTEM);

	TimerIntRegister(MILLISECOND_TIMER, TIMER_BOTH, timer_update);

	TimerLoadSet(TIMER0_BASE, TIMER_A, TICKS_PER_MILLISECOND);

	TimerEnable(MILLISECOND_TIMER, TIMER_BOTH);

	TimerIntEnable(MILLISECOND_TIMER, TIMER_BOTH);

}

bool motion_get_state()
{
	uint32_t now = _msCounter;

	return _motion_sensor_occupied ||
			now < (_lastOccupiedDetected + _motion_timeout);
}

void motion_set_timeout(uint16_t timeout)
{
	_motion_timeout = timeout;
}

void motion_init(void)
{
	_msCounter = 0;
	_motion_sensor_occupied = true;

	configure_millisecond_timer();
	configure_motion_gpio();
}
