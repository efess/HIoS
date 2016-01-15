#include "os_type.h"
#define PIN_TSL2561_SENSOR_SDA 4
#define PIN_TSL2561_SENSOR_SCL 5

#define TSL2561_ADDRESS 0x39

// TSL2561 registers

#define TSL2561_CMD           0x80
#define TSL2561_CMD_CLEAR     0xC0
#define	TSL2561_REG_CONTROL   0x00
#define	TSL2561_REG_TIMING    0x01
#define	TSL2561_REG_THRESH_L  0x02
#define	TSL2561_REG_THRESH_H  0x04
#define	TSL2561_REG_INTCTL    0x06
#define	TSL2561_REG_ID        0x0A
#define	TSL2561_REG_DATA_0    0x0C
#define	TSL2561_REG_DATA_1    0x0E

int tsl2561_init();
int ICACHE_FLASH_ATTR tsl2561_read();
