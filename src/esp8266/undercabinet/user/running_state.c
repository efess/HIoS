#include "running_state.h"
#include "mem.h"
#include "debug.h"
#include "user_interface.h"
#include "light.h"
#include "config.h"
#include "../modules/include/cdecode.h"
#include "../modules/include/cencode.h"

State* current_state;
ETSTimer outgoing_updates_timer;

//
// finds next value, returns size, stores next start location in param, stores value in provided char pointer
uint8_t find_next_value(uint8_t *searchArray, uint8_t **nextStart, uint8_t *charArray)
{
    uint8_t size = 0;
    if(searchArray)
    {
        uint8_t *delimLocation = strstr(searchArray, ",");
        if(delimLocation)
        {
            size = delimLocation - searchArray;
            *nextStart = searchArray + size + 1;
        }
        else
        {
            size = strlen(searchArray);
            *nextStart = 0;
        }

        if(charArray)
        {
            // App specific size restriction of length of 10
            if(size && size <= 10)
            {
                strncpy(charArray, searchArray, size);
                charArray[size] = '\0';
            }
        }
    }
    return size;
}

void state_handle_outgoing_updates()
{
    // Arduino emits this byte when starting up or setting up UART
    if(!current_state->needsConfigSend && uart0_read() == 0xE0)
    {
        // update after 2 seconds
        current_state->update_after_this_time = system_get_time() + (2 * 1000 * 1000);
        current_state->needsConfigSend = true;
        INFO("Received config update request byte\r\n");
    }

    if(system_get_time() < current_state->update_after_this_time)
    {
        return;
    }

    if(current_state->needsConfigSend)
    {
        INFO("SENDIG CONFIG UPDATE\r\n");
        if( light_send_config(sysCfg.device_config, sysCfg.device_config_length))
        {
            current_state->needsConfigSend = false;
        }
    }
}

void state_init()
{
    current_state = (State*)os_zalloc(sizeof(State));
    current_state->update_after_this_time = system_get_time() + (2 * 1000 * 1000);
    current_state->needsConfigSend = true; // send data to controller

    os_timer_disarm(&outgoing_updates_timer);
    os_timer_setfn(&outgoing_updates_timer, (os_timer_func_t *)state_handle_outgoing_updates);
    os_timer_arm(&outgoing_updates_timer, 1000, 1);
}

void state_update()
{
}

void handle_mqtt_config_update(char* base64Update)
{
    char* thisTry = "KAoAAAIDAwAAAAAAAAD/AP///wAA/wAA////AAAA/wD///8AAP8AAP///wAAAP8A////AAD/AAD///8AAAD/AP///wAA/wAA////AAECBABhEQQA/wAAAP8AAAD/AAAA/wAAAP///wD///8A/wAAAAD/AAAA/wAA/wAAAP8AAAD///8A////AP8AAAAA/wAA/wAAAA==";
    uint8_t* bytes = (uint8_t*)os_malloc(150);
    uint16_t decoded = base64_decode_chars(thisTry, strlen(thisTry), (char*)bytes);
    INFO("Decoded: %d\r\n", decoded);

    uint16_t expectedLength = base64_decode_expected_len(os_strlen(base64Update));
    INFO("Update length %d\r\n", os_strlen(base64Update));

    if(expectedLength > DEVICE_CONFIG_MAX) {
        INFO("Data update is too large\r\n");
        return;
    }
    if(expectedLength == 0) {
        INFO("No data to update\r\n");
        return;
    }

    // compare to make sure we don't waste write cycles.
    char* newUpdate = (char*)os_zalloc(expectedLength);

    uint16_t actualLength = base64_decode_chars(base64Update, os_strlen(base64Update), newUpdate);
    INFO("%d\r\n", actualLength);

    if(sysCfg.device_config_length != actualLength &&
        os_memcmp(newUpdate, sysCfg.device_config, actualLength) == 0)
    {
        INFO("No change in update\r\n");
        os_free(newUpdate);
        return;
    }


    sysCfg.device_config_length = actualLength;
    os_memcpy(sysCfg.device_config, newUpdate, actualLength);
    os_free(newUpdate);

    CFG_Save();

    current_state->needsConfigSend = true;
    INFO("Received new update length %d\r\n", actualLength);
}

void handle_mqtt_request(char **respBuffer)
{
    uint16_t expectedLength = base64_encode_expected_len(sysCfg.device_config_length);
    char* allocBuffer = (char*)os_zalloc(expectedLength + 1); // caller MUST free!!!\

    base64_encode_chars(sysCfg.device_config, sysCfg.device_config_length, allocBuffer);

    allocBuffer[expectedLength] = '\0';

    INFO("3 - length: %d\r\n", os_strlen(allocBuffer));

    *respBuffer = allocBuffer;
}

