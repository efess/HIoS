#include "os_type.h"
#include "osapi.h"
#include "driver/tsl2561.h"
#include "driver/i2c.h"
#include "debug.h"

// power up device
int tsl2561_init()
{
    i2c_init();

    uint8 address = TSL2561_ADDRESS << 1;

    i2c_start();

    // send address
    i2c_writeByte(address);
    if (!i2c_check_ack())
    {
        i2c_stop();
        return -1;
    }

    // send command
    i2c_writeByte((TSL2561_REG_CONTROL & 0x0F) | TSL2561_CMD);
    if (!i2c_check_ack())
    {
        i2c_stop();
        return -1;
    }
    i2c_writeByte(0x03);
    if (!i2c_check_ack())
    {
        i2c_stop();
        return 0;
    }
    i2c_stop();
    return 1;
}

int ICACHE_FLASH_ATTR tsl2561_read_value(uint8 reg_location)
{
    uint8 address = TSL2561_ADDRESS << 1;
    uint8 msbData = 0;
    uint8 lsbData = 0;

    i2c_start();

    // send address
    i2c_writeByte(address);
    if (!i2c_check_ack())
    {
        i2c_stop();
        return -1;
    }

    i2c_writeByte((reg_location & 0x0F) | TSL2561_CMD);
    if (!i2c_check_ack())
    {
        i2c_stop();
        return -1;
    }

    i2c_start();
    // send read request
    i2c_writeByte(address | 0x01);
    if (!i2c_check_ack())
    {
        i2c_stop();
        return -1;
    }

    msbData = i2c_readByte();	//read MSB
    i2c_send_ack(1);
    lsbData = i2c_readByte();	//read LSB
    i2c_send_ack(0);        //NACK READY FOR STOP
    i2c_stop();

    return (msbData << 8) | lsbData;
}

// Convert raw data to lux
// gain: 0 (1X) or 1 (16X), see setTiming()
// ms: integration time in ms, from setTiming() or from manual integration
// CH0, CH1: results from getData()
// lux will be set to resulting lux calculation
// returns true (1) if calculation was successful
// RETURNS false (0) AND lux = 0.0 IF EITHER SENSOR WAS SATURATED (0XFFFF)
//double tsl2561_getLux(char gain, int ms, int CH0, int CH1 )
//{
//    double ratio, d0, d1;

//    // Determine if either sensor saturated (0xFFFF)
//    // If so, abandon ship (calculation will not be accurate)
//    if ((CH0 == 0xFFFF) || (CH1 == 0xFFFF))
//    {
//        return 0.0;
//    }

//    // Convert from unsigned integer to floating point
//    d0 = CH0; d1 = CH1;

//    // We will need the ratio for subsequent calculations
//    ratio = d1 / d0;

//    // Normalize for integration time
//    d0 *= (402.0/ms);
//    d1 *= (402.0/ms);

//    // Normalize for gain
//    if (!gain)
//    {
//        d0 *= 16;
//        d1 *= 16;
//    }

//    // Determine lux per datasheet equations:

//    if (ratio < 0.5)
//    {
//            return 0.0304 * d0 - 0.062 * d0 * pow(ratio,1.4);
//    }

//    if (ratio < 0.61)
//    {
//        return  0.0224 * d0 - 0.031 * d1;
//    }

//    if (ratio < 0.80)
//    {
//        return  0.0128 * d0 - 0.0153 * d1;
//    }

//    if (ratio < 1.30)
//    {
//        return 0.00146 * d0 - 0.00112 * d1;
//    }

//    // if (ratio > 1.30)
//    return 0.0;
//}

int ICACHE_FLASH_ATTR tsl2561_read()
{
    double lux = 0;
    int chan0 = tsl2561_read_value(TSL2561_REG_DATA_0);
    int chan1 = tsl2561_read_value(TSL2561_REG_DATA_1);

    if(chan0 > 0 && chan1 > 0) {
        return chan0;
        //lux = tsl2561_getLux(0, 402, chan0, chan1);
        INFO("read tsl2561, chan0: %d\r\n", chan0);
        //return lux;
    } else {
        return -1;
    }
}
