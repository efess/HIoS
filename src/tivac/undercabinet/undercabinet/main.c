// PIN CONFIG
// PB7 - Pixels
//

#include <stdint.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include "inc/hw_types.h"
#include "inc/hw_memmap.h"
#include "inc/hw_gpio.h"
#include "inc/hw_ssi.h"
#include "inc/tm4c123gh6pm.h"
#include "driverlib/sysctl.h"
#include "driverlib/pin_map.h"
#include "driverlib/rom.h"
#include "driverlib/rom_map.h"
#include "driverlib/gpio.h"
#include "driverlib/ssi.h"
#include "driverlib/interrupt.h"
#include "driverlib/uart.h"
#include "driverlib/fpu.h"
#include "utils/uartstdio.h"
#include "driver/ws2812.h"
#include "animation.h"
#include "strings.h"
#include "pixels.h"
#include "settings.h"
#include "motion.h"
#include "update.h"
#include "sound.h"

#ifdef DEBUG
void
__error__(char *pcFilename, uint32_t ui32Line)
{
}
#endif

static const uint32_t testPallete[16] = {
	0x5500AB, 0x84007C, 0xB5004B, 0xE5001B,
	0xE81700, 0xB84700, 0xAB7700, 0xABAB00,
	0xAB5500, 0xDD2200, 0xF2000E, 0xC2003E,
	0x8F0071, 0x5F00A1, 0x2F00D0, 0x0007F9
};

Pixels *_pixels;
Settings *_settings;

bool _isOccupied = false;

void configure_uart0(void)
{
    //
    // Enable the GPIO Peripheral used by the UART.
    //
    ROM_SysCtlPeripheralEnable(SYSCTL_PERIPH_GPIOA);

    //
    // Enable UART0
    //
    ROM_SysCtlPeripheralEnable(SYSCTL_PERIPH_UART0);

    //
    // Configure GPIO Pins for UART mode.
    //
    ROM_GPIOPinConfigure(GPIO_PA0_U0RX);
    ROM_GPIOPinConfigure(GPIO_PA1_U0TX);
    ROM_GPIOPinTypeUART(GPIO_PORTA_BASE, GPIO_PIN_0 | GPIO_PIN_1);

    //
    // Use the internal 16MHz oscillator as the UART clock source.
    //
    UARTClockSourceSet(UART0_BASE, UART_CLOCK_PIOSC);

    //
    // Initialize the UART
    //
    UARTStdioConfig(0, 115200, 16000000);

    // Disabling echoing RX chars to TX
    UARTEchoSet(false);
}

void check_change_state()
{
	bool isChanged = false;
	if(update_check(_settings))
	{
		isChanged = true;
		motion_set_timeout(_settings->occupiedTimeout);
	}

	bool newSensorState = motion_get_state();
	if(_isOccupied != newSensorState)
	{
		_isOccupied = newSensorState;
		isChanged = true;
	}

	if(isChanged)
	{
		animation_changeState(_pixels, _settings, _isOccupied);
	}
}

int main(void)
{
	// clock setup, run @80MHz, use 16MHz xtal
	MAP_SysCtlClockSet(SYSCTL_SYSDIV_2_5 | SYSCTL_USE_PLL | SYSCTL_OSC_MAIN | SYSCTL_XTAL_16MHZ);

	configure_uart0();
	FPUEnable();
	FPUFlushToZeroModeSet(FPU_FLUSH_TO_ZERO_EN);
	FPURoundingModeSet(FPU_ROUND_ZERO);

	motion_init();
	//sound_init(); // not used right now.

	ws2812_init(LED_COUNT);

	MAP_IntMasterEnable();

	animation_init();

	update_init();

	// allocate state/settings memory
	_settings = (Settings*)malloc(sizeof(Settings));

	_settings->occupied.color = 0x0000FF;
	_settings->occupied.animation = 7;
	_settings->occupied.brightness = 5;
	_settings->occupied.transition = 1;
	memcpy(_settings->occupied.colorPallete, testPallete, sizeof(testPallete));

	_settings->unoccupied.color = 0x00FF00;
	_settings->unoccupied.animation = 2;
	_settings->unoccupied.brightness = 2;
	_settings->unoccupied.transition = 1;
	memcpy(_settings->unoccupied.colorPallete, testPallete, sizeof(testPallete));

	_settings->occupiedTimeout = 300; // timeout seconds default (5 Mins)
	_settings->alwaysOn = 0;

	_pixels = (Pixels*)malloc(sizeof(Pixels));
	_pixels->pixelCount = LED_COUNT;
	_pixels->pixelData = malloc(LED_BYTE_COUNT); // Buffer before sending
	memset(_pixels->pixelData, 0, LED_BYTE_COUNT);

	motion_set_timeout(_settings->occupiedTimeout);

	uint32_t delay = (MAP_SysCtlClockGet() / 1000) * 20; // 20 ms (clock sycles)

	animation_changeState(_pixels, _settings, true);


	while (1) {
		MAP_SysCtlDelay(delay);

		check_change_state();

		animation_runFrame(_pixels);

		ws2812_sendData(_pixels);
		//sound_getFreq(bins, 16);

// Testing freq analyzer
//		char out[130];
//		sprintf(out, "%d %d %d %d %d %d %d %d %d %d %d %d %d %d %d %d\r\n",
//				(int32_t)bins[0],(int32_t)bins[1],(int32_t)bins[2],(int32_t)bins[3],(int32_t)bins[4],(int32_t)bins[5],(int32_t)bins[6],(int32_t)bins[7],(int32_t)bins[8],(int32_t)bins[9],(int32_t)bins[10],
//				(int32_t)bins[11],(int32_t)bins[12],(int32_t)bins[13],(int32_t)bins[14],(int32_t)bins[15]);
//
//		UARTprintf(out);
	}
}


