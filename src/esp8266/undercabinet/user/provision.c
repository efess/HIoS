#include "provision.h"
#include "os_type.h"
#include "osapi.h"
#include "driver/uart.h"
#include "user_interface.h"
#include "config.h"

PROVISION_CONFIG provisionCfg;
ETSTimer provisionTimer;
char readbuf[READ_BUF_SIZE];

void ICACHE_FLASH_ATTR clearReadBuf()
{
    memset(readbuf, '\0', READ_BUF_SIZE);
}

int ICACHE_FLASH_ATTR  provision_listen(void)
{
    os_timer_disarm(&provisionTimer);
    os_timer_setfn(&provisionTimer, (os_timer_func_t *)provision_checkUart);
    os_timer_arm(&provisionTimer, 1000, 1);
}

void ICACHE_FLASH_ATTR provision_checkUart(void *args)
{
    clearReadBuf();
    if(uart0_available()){
        readUntilTerminator(5000); // 5 ms
        provision_check_for_command();
    }
}

void ICACHE_FLASH_ATTR provision_wifi_scan_cb(void *arg, STATUS status)
{
    uint8 ssid[33];
    char temp[128];
    if (status == OK)
    {
        struct bss_info *bss_link = (struct bss_info *)arg;
        bss_link = bss_link->next.stqe_next;//ignore first

        while (bss_link != NULL)
        {
            os_memset(ssid, 0, 33);
            if (os_strlen(bss_link->ssid) <= 32)
            {
                os_memcpy(ssid, bss_link->ssid, os_strlen(bss_link->ssid));
            }
            else
            {
                os_memcpy(ssid, bss_link->ssid, 32);
            }
            os_sprintf(temp,"+CWLAP:(%d,\"%s\",%d,\""MACSTR"\",%d)\r\n",
                       bss_link->authmode, ssid, bss_link->rssi,
                       MAC2STR(bss_link->bssid),bss_link->channel);
            uart0_sendStr(temp);
            bss_link = bss_link->next.stqe_next;
        }
    }

    uart0_sendStr("OK\r\n");
    uart0_sendStr("done\r\n");
    os_timer_arm(&provisionTimer, 1000, 1);

}

void ICACHE_FLASH_ATTR provision_print_wifi_aps()
{
    // this takes some time, disarm until we're done.
    os_timer_disarm(&provisionTimer);
    wifi_station_scan(NULL, provision_wifi_scan_cb);
}

int ICACHE_FLASH_ATTR readUntilTerminator(uint32 timeout)
{
    uint16 index = 0;
    uint32 timeIn = system_get_time();

    while (timeIn + timeout > system_get_time())
    {
        if (uart0_available())
        {
            readbuf[index++] = uart0_read();
            if (index > 1 && readbuf[index - 1] == 10 && readbuf[index - 2] == 13)
            {
                readbuf[index - 1] = '\0';
                readbuf[index - 2] = '\0';
                break;
            }
        } else {
            os_delay_us(10); // 10 us;
        }
    }

    return index;
}
void ICACHE_FLASH_ATTR printProvisionInfo()
{
    uart0_sendStr("provisioninfo\r\n");
    uart0_sendStr(sysCfg.device_id);
    uart0_sendStr("\r\n");
    uart0_sendStr("env1\r\n");
    uart0_sendStr(sysCfg.sta_ssid);
    uart0_sendStr("\r\n");
    uart0_sendStr("aplist\r\n");

    provision_print_wifi_aps();
}


int ICACHE_FLASH_ATTR provision_check_for_command(void)
{
    int readBytes = 0;

    if (strcmp(readbuf, "initprovision") == 0)
    {
        printProvisionInfo();
    }
    else if (strcmp(readbuf, "provision") == 0)
    {
        clearReadBuf();
        readBytes = readUntilTerminator(5000);

        if (readBytes == 164)
        {
            memcpy(&provisionCfg, readbuf, sizeof(provisionCfg));

            if (strlen(provisionCfg.wifiSSID) == 0) {
                uart0_sendStr("missing-req SSID\r\n");
            }
            else if (strlen(provisionCfg.id) == 0) {
                uart0_sendStr("missing-req ID\r\n");
            }
            else if (strlen(provisionCfg.host) == 0) {
                uart0_sendStr("missing-req Host\r\n");
            }
            else if (provisionCfg.port == 0) {
                uart0_sendStr("missing-req Port\r\n");
            }
            else {
                char temp[55];

                memset(sysCfg.sta_ssid, '\0', strlen(sysCfg.sta_ssid));
                memset(sysCfg.sta_pwd, '\0', strlen(sysCfg.sta_pwd));
                memset(sysCfg.mqtt_host, '\0', strlen(sysCfg.mqtt_host));

                memcpy(sysCfg.mqtt_host, provisionCfg.host, strlen(provisionCfg.host));
                memcpy(sysCfg.sta_ssid, provisionCfg.wifiSSID, strlen(provisionCfg.wifiSSID));
                memcpy(sysCfg.sta_pwd, provisionCfg.wifiPassword, strlen(provisionCfg.wifiPassword));
                sysCfg.mqtt_port = provisionCfg.port;

                os_sprintf(temp, "\r\n128: %i 129: %i 130: %i 131: %i", readbuf[128],readbuf[129],readbuf[130],readbuf[131]);
                uart0_sendStr(temp);

                CFG_Save();

                uart0_sendStr("done\r\n");
            }
        }
        else
        {
            uart0_sendStr("Invalid payload size\r\n");
            uart0_sendStr("Read bytes: ");
            char output[10];
            os_sprintf(output, "%i", readBytes);
            uart0_sendStr(output);
            uart0_sendStr("\r\n");
        }
    }
}
