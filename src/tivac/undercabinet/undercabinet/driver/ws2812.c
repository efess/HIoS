#include <stdint.h>
#include <stdbool.h>
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
#include "ws2812.h"
#include "../pixels.h"

static uint8_t * rgbData;
static uint16_t rgbDataCounter;
static uint8_t * rgbDataPointer;
static uint16_t lookupTable[4];

/*
 * SSI Interrupt handler responsible for sending data to WS2812x
 */
void ws2812_SSI2IntHandler(void) {
	MAP_SSIIntClear(SSI2_BASE, SSI_TXFF);
	uint16_t txData_0;
	uint16_t txData_1;
	uint16_t txData_2;

	if (rgbDataCounter == 0) { // done sending bytes, send 0s to lock and disable SSI interrupt
		SSI2_DR_R = 0;
		SSI2_DR_R = 0;
		SSI2_DR_R = 0;
		SSI2_DR_R = 0;
		MAP_IntDisable(INT_SSI2);

	} else { // send WS2812x byte
		rgbDataCounter--;
		uint8_t byte = *rgbDataPointer++;
		txData_0 = lookupTable[byte & 0x03];
		byte >>= 2;
		txData_1 = lookupTable[byte & 0x03];
		byte >>= 2;
		txData_2 = lookupTable[byte & 0x03];
		byte >>= 2;
		SSI2_DR_R = lookupTable[byte];
		SSI2_DR_R = txData_2;
		SSI2_DR_R = txData_1;
		SSI2_DR_R = txData_0;
	}
}

/*
 * Configure SSI
 */
void _SSI2Init() {
	MAP_SysCtlPeripheralEnable(SYSCTL_PERIPH_SSI2);
	MAP_SysCtlPeripheralEnable(SYSCTL_PERIPH_GPIOB);
	MAP_GPIOPinConfigure(GPIO_PB7_SSI2TX);
	MAP_GPIOPinTypeSSI(GPIO_PORTB_BASE, GPIO_PIN_7);
	MAP_SSIConfigSetExpClk(SSI2_BASE, MAP_SysCtlClockGet(),
			SSI_FRF_MOTO_MODE_0, SSI_MODE_MASTER, SPI_SPEED, 16);
	MAP_SSIEnable(SSI2_BASE);
	MAP_SSIIntEnable(SSI2_BASE, SSI_TXFF);
}

/*
 * Prepare data and lookup table
 */
void _DataInit(uint16_t ledCount) {
	rgbData = malloc(ledCount * 3);
	uint16_t b = ledCount;
	uint8_t* ledPointer;
	while (b > 0) {
		b--;
		ledPointer = rgbData + b;
		*ledPointer = 0;
		*(ledPointer + 1) = 0;
		*(ledPointer + 2) = 0;
	}
	lookupTable[0] = (WS2812B_0 << 8) + WS2812B_0;
	lookupTable[1] = (WS2812B_0 << 8) + WS2812B_1;
	lookupTable[2] = (WS2812B_1 << 8) + WS2812B_0;
	lookupTable[3] = (WS2812B_1 << 8) + WS2812B_1;
}

void ws2812_init(uint16_t ledCount)
{
	_DataInit(ledCount);
	_SSI2Init();
}

/*
 * When RGB data is ready, call this function to send it to WS2812x LEDs
 */
void ws2812_sendData(Pixels* pixelData)
{
	// rgb ->  g, r, b
	uint16_t i = pixelData->pixelCount;
	uint8_t* pixRef = pixelData->pixelData;
	uint8_t* dataRef = rgbData;
	while(i > 0)
	{
		i--;
		*(dataRef) = *(pixRef + 1);
		*(dataRef + 1) = *(pixRef);
		*(dataRef + 2) = *(pixRef + 2);

		dataRef += 3;
		pixRef += 3;
	}
	//memcpy(rgbData, pixelData->pixelData, pixelData->pixelCount * 3);



	// You could use conditional to make sure prevoius call was finished
	//while (rgbDataCounter != 0)  {};
	rgbDataCounter = LED_BYTE_COUNT;
	rgbDataPointer = rgbData;
	MAP_SSIBusy(SSI2_BASE);
	MAP_SSIIntClear(SSI2_BASE, SSI_TXFF);
	MAP_IntEnable(INT_SSI2);
	SSI2_DR_R = 0;
}
