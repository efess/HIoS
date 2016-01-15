/*
 * update.c
 *
 *  Created on: Jan 10, 2016
 *      Author: efess
 */

#include "update.h"
#include "utils/uartstdio.h"

#define OPTIONS_SHIFT_OCCUPIED 1
#define OPTIONS_SHIFT_UNOCCUPIED 10

#define OPTIONS_MASK_BRIGHT 0x000000F	 // 4 bits
#define OPTIONS_MASK_BRIGHT_SHIFT 0

#define OPTIONS_MASK_PGM 0x00000070	 // 3 bits
#define OPTIONS_MASK_PGM_SHIFT 4

#define OPTIONS_MASK_TRANS 0x00000180
#define OPTIONS_MASK_TRANS_SHIFT 7

#define MAGIC_NUMBER 98
#define UPDATE_REQUEST 0xE0
#define UPDATE_FAIL 10

#define READ_TRIES 10000

uint32_t bufferToUInt32(uint8_t *buffer)
{
	return ((uint32_t)buffer[3] << 24) | ((uint32_t)buffer[2] << 16) | ((uint32_t)buffer[1] << 8) | (uint32_t)buffer[0];
}

uint32_t threeByteBufferToUInt32(uint8_t *buffer)
{
	return ((uint32_t)buffer[2] << 16) | ((uint32_t)buffer[1] << 8) | (uint32_t)buffer[0];
}

int8_t readUart(uint8_t* buffer, uint8_t len)
{
	int8_t success = -1;
	uint16_t tries = 0;
	uint8_t read = 0;
	while(read < len && tries < READ_TRIES)
	{
		if(UARTRxBytesAvail() > 0)
		{
			buffer[read] = UARTgetc();
			read++;
		}

		tries++;
	}

	if(read == len)
	{
		success = 0;
	}

	return success;
}

int8_t read_options(Settings* settings)
{
	uint8_t bufArray[8];
	uint8_t *buffer = bufArray;
	if(readUart(buffer, 8) < 0)
	{
		return -1;
	}

	uint32_t color = bufferToUInt32(buffer);
	if((color >> 24) & 0xFF > 0)
	{
		// invalid color.
		return -1;
	}

	settings->unoccupied.color = color;
	settings->occupied.color = color;

	buffer += 4;
	uint32_t options = bufferToUInt32(buffer);

	uint32_t shifted_options = options >> OPTIONS_SHIFT_OCCUPIED;

	settings->occupied.brightness = (shifted_options & OPTIONS_MASK_BRIGHT) >> OPTIONS_MASK_BRIGHT_SHIFT;
	settings->occupied.animation = (shifted_options & OPTIONS_MASK_PGM) >> OPTIONS_MASK_PGM_SHIFT;
	settings->occupied.transition = (shifted_options & OPTIONS_MASK_TRANS) >> OPTIONS_MASK_TRANS_SHIFT;

	shifted_options = options >> OPTIONS_SHIFT_UNOCCUPIED;

	settings->unoccupied.brightness = (shifted_options & OPTIONS_MASK_BRIGHT) >> OPTIONS_MASK_BRIGHT_SHIFT;
	settings->unoccupied.animation = (shifted_options & OPTIONS_MASK_PGM) >> OPTIONS_MASK_PGM_SHIFT;
	settings->unoccupied.transition = (shifted_options & OPTIONS_MASK_TRANS) >> OPTIONS_MASK_TRANS_SHIFT;

	return 0;
}

int8_t read_pallete(Settings* settings)
{
	uint32_t color;
	uint8_t buffer[4];
	uint8_t i, numPalleteEntries = 0;

	if(readUart(&numPalleteEntries, 1) < 0 || numPalleteEntries == 0 || numPalleteEntries > 16)
	{
		return -1;
	}

	for(i = 0; i < numPalleteEntries; i++)
	{
		if(readUart(buffer, 4) < 0)
		{
			return -1;
		}

		// f it, should be 16 every time.
		color = threeByteBufferToUInt32(buffer);
		settings->occupied.colorPallete[i] = color;
		settings->unoccupied.colorPallete[i] = color;
	}

	return 0;
}


uint8_t update_check(Settings* settings)
{
	if(UARTRxBytesAvail() == 0)
	{
		return 0;
	}

	char response[1];
	int8_t success = -1;
	uint8_t testByte;

	testByte = UARTgetc();
	if(testByte == MAGIC_NUMBER)
	{
		testByte = UARTgetc();
		switch(testByte)
		{
			case 0:
				success = read_options(settings);
				break;
			case 1:
				success = read_pallete(settings);
				break;
		}
	}

	// Update failed, empty uart buffer
	if(success < 0)
	{
		while(UARTRxBytesAvail())
		{
			UARTgetc();
		}
		response[0] = UPDATE_FAIL;
	}
	else
	{
		response[0] = MAGIC_NUMBER;
	}

	UARTwrite(response, 1);
	return success < 0 ? 0 : 1;
}
