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

// gamma correction at driver level....
const uint8_t gamma[] = { 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
		0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2,
		2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 5, 5, 5, 5, 6,
		6, 6, 6, 7, 7, 7, 7, 8, 8, 8, 9, 9, 9, 10, 10, 10, 11, 11, 11, 12, 12,
		13, 13, 13, 14, 14, 15, 15, 16, 16, 17, 17, 18, 18, 19, 19, 20, 20, 21,
		21, 22, 22, 23, 24, 24, 25, 25, 26, 27, 27, 28, 29, 29, 30, 31, 32, 32,
		33, 34, 35, 35, 36, 37, 38, 39, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48,
		49, 50, 50, 51, 52, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 66, 67,
		68, 69, 70, 72, 73, 74, 75, 77, 78, 79, 81, 82, 83, 85, 86, 87, 89, 90,
		92, 93, 95, 96, 98, 99, 101, 102, 104, 105, 107, 109, 110, 112, 114,
		115, 117, 119, 120, 122, 124, 126, 127, 129, 131, 133, 135, 137, 138,
		140, 142, 144, 146, 148, 150, 152, 154, 156, 158, 160, 162, 164, 167,
		169, 171, 173, 175, 177, 180, 182, 184, 186, 189, 191, 193, 196, 198,
		200, 203, 205, 208, 210, 213, 215, 218, 220, 223, 225, 228, 231, 233,
		236, 239, 241, 244, 247, 249, 252, 255 };

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

void ws2812_init(uint16_t ledCount) {
	_DataInit(ledCount);
	_SSI2Init();
}

/*
 * When RGB data is ready, call this function to send it to WS2812x LEDs
 */
void ws2812_sendData(Pixels* pixelData) {
	// rgb ->  g, r, b
	uint16_t i = pixelData->pixelCount;
	uint8_t* pixRef = pixelData->pixelData;
	uint8_t* dataRef = rgbData;
	while (i > 0) {
		i--;
		*(dataRef) = gamma[*(pixRef + 1)];
		*(dataRef + 1) = gamma[*(pixRef)];
		*(dataRef + 2) = gamma[*(pixRef + 2)];

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
