#ifndef __DS18B20_H__
#define __DS18B20_H__

#include "ets_sys.h"
#include "osapi.h"
#include "gpio.h"

#define DS1820_WRITE_SCRATCHPAD		0x4E
#define DS1820_READ_SCRATCHPAD		0xBE
#define DS1820_COPY_SCRATCHPAD 		0x48
#define DS1820_READ_EEPROM          0xB8
#define DS1820_READ_PWRSUPPLY 		0xB4
#define DS1820_SEARCHROM 		0xF0
#define DS1820_SKIP_ROM			0xCC
#define DS1820_READROM 			0x33
#define DS1820_MATCHROM 		0x55
#define DS1820_ALARMSEARCH 		0xEC
#define DS1820_CONVERT_T		0x44

typedef struct {
    uint8_t pinNum;
    unsigned char address[8];
    uint8_t _lastDiscrepancy;
    uint8_t _lastFamilyDiscrepancy;
    uint8_t _lastDeviceFlag;
} DS18B20_Instance;

static uint16_t oddparity[16] = {0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0};

void ds_init(DS18B20_Instance*);
int ds_search(DS18B20_Instance* instance, uint8_t *addr);
void select(DS18B20_Instance* instance, const uint8_t rom[8]);
void skip(DS18B20_Instance* instance);
void reset_search(DS18B20_Instance* instance);
uint8_t reset(DS18B20_Instance* instance);
void write(DS18B20_Instance* instance, uint8_t v, int power);
void write_bit(DS18B20_Instance* instance, int v);
uint8_t read(DS18B20_Instance* instance);
int read_bit(DS18B20_Instance* instance);
uint8_t crc8(const uint8_t *addr, uint8_t len);
uint16_t crc16(const uint16_t *data, const uint16_t  len);
void printFloat(float val, char *buff);
float celsiusFarenheit(float celsius);

#endif
