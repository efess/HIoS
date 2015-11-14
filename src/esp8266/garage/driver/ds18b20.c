/*
 * Adaptation of Paul Stoffregen's One wire library to the ESP8266 and
 *
 * Fixed Mikhail Grigorev <sleuthhound@gmail.com>
 * 
 * Paul's original library site:
 *   http://www.pjrc.com/teensy/td_libs_OneWire.html
 * 
 * See also http://playground.arduino.cc/Learning/OneWire
 * 
 */

#include "ets_sys.h"
#include "os_type.h"
#include "mem.h"
#include "osapi.h"
#include "user_interface.h"

#include "debug.h"
#include "espconn.h"
#include "gpio.h"
#include "gpio_helper.h"
#include "driver/ds18b20.h"

void ICACHE_FLASH_ATTR ds_init(DS18B20_Instance* instance)
{
    pinMode(instance->pinNum, INPUT, 1);

    reset_search(instance);
}

/* pass array of 8 bytes in */
int ICACHE_FLASH_ATTR ds_search(DS18B20_Instance* instance, uint8_t *newAddr)
{
	uint8_t id_bit_number;
	uint8_t last_zero, rom_byte_number;
	uint8_t id_bit, cmp_id_bit;
	int search_result;
	int i;

	unsigned char rom_byte_mask, search_direction;

    // initialize for search
	id_bit_number = 1;
	last_zero = 0;
	rom_byte_number = 0;
	rom_byte_mask = 1;
	search_result = 0;

    // if the last call was not the last one
    if (!instance->_lastDeviceFlag)
    {
        // 1-Wire reset
        if (!reset(instance))
        {
            // reset the search
            instance->_lastDiscrepancy = 0;
            instance->_lastDeviceFlag = FALSE;
            instance->_lastFamilyDiscrepancy = 0;
            return FALSE;
        }

        // issue the search command
        write(instance, DS1820_SEARCHROM, 0);

        // loop to do the search
        do
        {
            // read a bit and its complement
            id_bit = read_bit(instance);
            cmp_id_bit = read_bit(instance);

            // check for no devices on 1-wire
            if ((id_bit == 1) && (cmp_id_bit == 1))
            {
                break;
            }
            else
            {
                // all devices coupled have 0 or 1
                if (id_bit != cmp_id_bit)
                    search_direction = id_bit;  // bit write value for search
                else
                {
                    // if this discrepancy if before the Last Discrepancy
                    // on a previous next then pick the same as last time
                    if (id_bit_number < instance->_lastDiscrepancy)
                        search_direction = ((instance->address[rom_byte_number] & rom_byte_mask) > 0);
                    else
                        // if equal to last pick 1, if not then pick 0
                        search_direction = (id_bit_number == instance->_lastDiscrepancy);

                    // if 0 was picked then record its position in LastZero
                    if (search_direction == 0)
                    {
                        last_zero = id_bit_number;

                        // check for Last discrepancy in family
                        if (last_zero < 9)
                            instance->_lastFamilyDiscrepancy = last_zero;
                    }
                }

                // set or clear the bit in the ROM byte rom_byte_number
                // with mask rom_byte_mask
                if (search_direction == 1)
                    instance->address[rom_byte_number] |= rom_byte_mask;
                else
                    instance->address[rom_byte_number] &= ~rom_byte_mask;

                // serial number search direction write bit
                write_bit(instance, search_direction);

                // increment the byte counter id_bit_number
                // and shift the mask rom_byte_mask
                id_bit_number++;
                rom_byte_mask <<= 1;

                // if the mask is 0 then go to new SerialNum byte rom_byte_number and reset mask
                if (rom_byte_mask == 0)
                {
                    rom_byte_number++;
                    rom_byte_mask = 1;
                }
            }
        }
        while(rom_byte_number < 8);  // loop until through all ROM bytes 0-7

        // if the search was successful then
        if (!(id_bit_number < 65))
        {
            // search successful so set LastDiscrepancy,LastDeviceFlag,search_result
            instance->_lastDiscrepancy = last_zero;

            // check for last device
            if (instance->_lastDiscrepancy == 0)
                instance->_lastDeviceFlag = TRUE;

            search_result = TRUE;
        }
    }
    else
    {
        search_result = TRUE;
    }

	// if no device found then reset counters so next 'search' will be like a first
    if (!search_result || !instance->address[0])
    {
        instance->_lastDiscrepancy = 0;
        instance->_lastDeviceFlag = FALSE;
        instance->_lastFamilyDiscrepancy = 0;
		search_result = FALSE;
	}
    for (i = 0; i < 8; i++) newAddr[i] = instance->address[i];

	return search_result;
}

//
// Do a ROM select
//
void ICACHE_FLASH_ATTR select(DS18B20_Instance* instance, const uint8_t *rom)
{
	uint8_t i;
    write(instance, DS1820_MATCHROM, 0); // Choose ROM
    for (i = 0; i < 8; i++) write(instance, rom[i], 0);
}

//
// Do a ROM skip
//
void ICACHE_FLASH_ATTR skip(DS18B20_Instance* instance)
{
    write(instance, DS1820_SKIP_ROM, 0); // Skip ROM
}

void ICACHE_FLASH_ATTR reset_search(DS18B20_Instance* instance)
{
	int i;
	// reset the search state
    instance->_lastDiscrepancy = 0;
    instance->_lastDeviceFlag = FALSE;
    instance->_lastFamilyDiscrepancy = 0;
	for(i = 7; ; i--) {
        instance->address[i] = 0;
		if ( i == 0) break;
	}
}

// Perform the onewire reset function.  We will wait up to 250uS for
// the bus to come high, if it doesn't then it is broken or shorted
// and we return a 0;
// Returns 1 if a device asserted a presence pulse, 0 otherwise.
uint8_t ICACHE_FLASH_ATTR reset(DS18B20_Instance* instance)
{
	int r;
	uint8_t retries = 125;
    GPIO_DIS_OUTPUT(instance->pinNum);
	do {
		if (--retries == 0) return 0;
		os_delay_us(2);
    } while ( !GPIO_INPUT_GET(instance->pinNum));
    GPIO_OUTPUT_SET(instance->pinNum, 0);
	os_delay_us(500);
    GPIO_DIS_OUTPUT(instance->pinNum);
	os_delay_us(65);
    r = !GPIO_INPUT_GET(instance->pinNum);
	os_delay_us(490);
	return r;
}

//
// Write a byte. The writing code uses the active drivers to raise the
// pin high, if you need power after the write (e.g. DS18S20 in
// parasite power mode) then set 'power' to 1, otherwise the pin will
// go tri-state at the end of the write to avoid heating in a short or
// other mishap.
//
void ICACHE_FLASH_ATTR write(DS18B20_Instance* instance, uint8_t v, int power)
{
	uint8_t bitMask;
	for (bitMask = 0x01; bitMask; bitMask <<= 1) {
        write_bit(instance, (bitMask & v)?1:0);
	}
	if (!power) {
        GPIO_DIS_OUTPUT(instance->pinNum);
        GPIO_OUTPUT_SET(instance->pinNum, 0);
	}
}

//
// Write a bit. Port and bit is used to cut lookup time and provide
// more certain timing.
//
void ICACHE_FLASH_ATTR write_bit(DS18B20_Instance* instance, int v)
{
    GPIO_OUTPUT_SET(instance->pinNum, 0);
	if(v) {
		os_delay_us(10);
        GPIO_OUTPUT_SET(instance->pinNum, 1);
		os_delay_us(55);
	} else {
		os_delay_us(65);
        GPIO_OUTPUT_SET(instance->pinNum, 1);
		os_delay_us(5);
	}
}

//
// Read a byte
//
uint8_t ICACHE_FLASH_ATTR read(DS18B20_Instance* instance)
{
	uint8_t bitMask;
	uint8_t r = 0;
	for (bitMask = 0x01; bitMask; bitMask <<= 1) {
        if ( read_bit(instance)) r |= bitMask;
	}
	return r;
}

//
// Read a bit. Port and bit is used to cut lookup time and provide
// more certain timing.
//
int ICACHE_FLASH_ATTR read_bit(DS18B20_Instance* instance)
{
	int r;
    GPIO_OUTPUT_SET(instance->pinNum, 0);
	os_delay_us(3);
    GPIO_DIS_OUTPUT(instance->pinNum);
	os_delay_us(10);
    r = GPIO_INPUT_GET(instance->pinNum);
	os_delay_us(53);
	return r;
}

//
// Compute a Dallas Semiconductor 8 bit CRC directly.
// this is much slower, but much smaller, than the lookup table.
//
uint8_t ICACHE_FLASH_ATTR crc8(const uint8_t *addr, uint8_t len)
{
	uint8_t crc = 0;
	uint8_t i;
	while (len--) {
		uint8_t inbyte = *addr++;
		for (i = 8; i; i--) {
			uint8_t mix = (crc ^ inbyte) & 0x01;
			crc >>= 1;
			if (mix) crc ^= 0x8C;
			inbyte >>= 1;
		}
	}
	return crc;
}

//
// Compute a Dallas Semiconductor 16 bit CRC. I have never seen one of
// these, but here it is.
//
uint16_t ICACHE_FLASH_ATTR crc16(const uint16_t *data, const uint16_t  len)
{
	uint16_t  i;
	uint16_t  crc = 0;
    for ( i = 0; i < len; i++) {
    	uint16_t cdata = data[len];
    	cdata = (cdata ^ (crc & 0xff)) & 0xff;
    	crc >>= 8;
    	if (oddparity[cdata & 0xf] ^ oddparity[cdata >> 4])
    		crc ^= 0xc001;
    	cdata <<= 6;
    	crc ^= cdata;
    	cdata <<= 1;
    	crc ^= cdata;
    }
    return crc;
}

float ICACHE_FLASH_ATTR celsiusFarenheit(float celsius)
{
    return (celsius * 1.8) + 32;
}

void ICACHE_FLASH_ATTR printFloat(float val, char *buff) {
   char smallBuff[16];
   int val1 = (int) val;
   unsigned int val2;
   if (val < 0) {
      val2 = (int) (-100.0 * val) % 100;
   } else {
      val2 = (int) (100.0 * val) % 100;
   }
   if (val2 < 10) {
      os_sprintf(smallBuff, "%i.0%u", val1, val2);
   } else {
      os_sprintf(smallBuff, "%i.%u", val1, val2);
   }

   strcat(buff, smallBuff);
}
