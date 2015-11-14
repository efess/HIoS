#include "sensors.h"
#include "driver/ds18b20.h"
#include "debug.h"
#include "mqtt.h"

DS18B20_Instance temp1;
DS18B20_Instance temp2;

MQTT_Client *mqttClient;

int ICACHE_FLASH_ATTR sensors_poll_all(void* args)
{
    os_timer_disarm(&sensorsTimer);
    //sensors_poll_thermo(&temp1, "garage");
    //sensors_poll_thermo(&temp2, "temp2");
    os_timer_arm(&sensorsTimer, 5000, 1);
}

int ICACHE_FLASH_ATTR sensors_poll_thermo(DS18B20_Instance *instance, const char *area)
{
    int r, i;
    uint8_t addr[8], data[12];

    r = ds_search(instance, addr);
    if(r)
    {
        INFO("%s Found @ %02x %02x %02x %02x %02x %02x %02x %02x\r\n", area, addr[0], addr[1], addr[2], addr[3], addr[4], addr[5], addr[6], addr[7]);
        if(crc8(addr, 7) != addr[7]){
            INFO( "CRC mismatch, crc=%xd, addr[7]=%xd\r\n", crc8(addr, 7), addr[7]);
        }

        switch(addr[0])
        {
            case 0x10:
                INFO("%s is DS18S20 family.\r\n", area);
                break;

            case 0x28:
                INFO("%s is DS18B20 family.\r\n", area);
                break;

            default:
                INFO("%s is unknown family.\r\n", area);
                return 1;
        }
    }
    else {
        INFO("%s not detected, sorry.\r\n", area);
        return 1;
    }

    // perform the conversion
    reset(instance);
    select(instance, addr);

    write(instance, DS1820_CONVERT_T, 1); // perform temperature conversion

    os_delay_us(500000); // sleep 500ms

    reset(instance);
    select(instance, addr);
    write(instance, DS1820_READ_SCRATCHPAD, 0); // read scratchpad

    for(i = 0; i < 9; i++)
    {
        data[i] = read(instance);
    }

    int HighByte, LowByte, TReading, SignBit, Whole, Fract;
    LowByte = data[0];
    HighByte = data[1];
    TReading = (HighByte << 8) + LowByte;
    SignBit = TReading & 0x8000;  // test most sig bit
    if (SignBit) // negative
        TReading = (TReading ^ 0xffff) + 1; // 2's comp

    Whole = TReading >> 4;  // separate off the whole and fractional portions
    Fract = (TReading & 0xf) * 100 / 16;

    INFO("%s temp: %c%d.%d Celsius\r\n", area, SignBit ? '-' : '+', Whole, Fract < 10 ? 0 : Fract);

    float celsius = (float)Whole + ((float)Fract) / 100.0f;

    if(SignBit)
    {
        celsius = -1 * celsius;
    }

    float farenheit = celsius * 1.8f + 32;
    char pubVal[6];
    printFloat(farenheit, pubVal);

    char pubTop[100];

    os_sprintf(pubTop, "/home/sensor/%s/temperature", area);
    MQTT_Publish(mqttClient, pubTop, pubVal, 6, 0, 0);
    MQTT_Publish(mqttClient, "/home/sensor/0", "hello0", 6, 0, 0);
    MQTT_Publish(mqttClient, "/home/sensor/5", pubVal, 6, 0, 0);

    return r;
}

int ICACHE_FLASH_ATTR sensors_init()
{
    temp1.pinNum = 14;
    //temp2.pinNum = 12;
    ds_init(&temp1);
    //ds_init(&temp2);
    os_timer_setfn(&sensorsTimer, (os_timer_func_t *)sensors_poll_all);
}

int ICACHE_FLASH_ATTR sensors_begin(MQTT_Client *client)
{
    mqttClient = &client;
    //os_timer_arm(&sensorsTimer, 5000, 1);
}

int ICACHE_FLASH_ATTR sensors_stop()
{
    os_timer_disarm(&sensorsTimer);
}
