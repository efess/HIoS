#include "running_state.h"
#include "mem.h"
#include "debug.h"
#include "user_interface.h"
#include "light.h"
#include "config.h"

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
    if(uart0_read() == 0xE0)
    {
        // update after 5 seconds.. wait for arduino to load...
        current_state->update_after_this_time = system_get_time() + (5 * 1000 * 1000);
        current_state->needsOptionSend = true;
        current_state->needsPalleteSend = true;
    }

    if(system_get_time() < current_state->update_after_this_time)
    {
        return;
    }

    if(current_state->needsOptionSend)
    {
        INFO("SENDIG OPT UPDATE\r\n");
        if(light_send_options(sysCfg.light_color, sysCfg.light_options))
        {
            current_state->needsOptionSend = false;
        }
    }

    if(current_state->needsPalleteSend)
    {
        INFO("SENDIG PAL UPDATE\r\n");
        if(light_send_pallete(sysCfg.light_pallete, sysCfg.light_pallete_size))
        {
            current_state->needsPalleteSend = false;
        }
    }
}

void state_init()
{
    current_state = (State*)os_zalloc(sizeof(State));
    current_state->update_after_this_time = system_get_time() + (5 * 1000 * 1000);
    current_state->needsOptionSend = true; // send data to controller
    current_state->needsPalleteSend = true;

    os_timer_disarm(&outgoing_updates_timer);
    os_timer_setfn(&outgoing_updates_timer, (os_timer_func_t *)state_handle_outgoing_updates);
    os_timer_arm(&outgoing_updates_timer, 3000, 1);
}

void state_update()
{
}

void handle_mqtt_options_update(char* updateStr)
{
    uint32_t newOptions = 0;
    uint32_t newColor = 0;

    uint8_t tempArr[11];
    uint8_t *currPtr = updateStr;
    uint8_t *nextPtr;
    uint8_t sizeOfVal;

    sizeOfVal = find_next_value(currPtr, &nextPtr, tempArr);
    if(sizeOfVal && sizeOfVal <= 10) {
        // first color
        newColor = atoi(tempArr);
    }

    currPtr = nextPtr;

    sizeOfVal = find_next_value(currPtr, &nextPtr, tempArr);
    if(sizeOfVal && sizeOfVal <= 10) {
        // now Options
        newOptions = atoi(tempArr);
    }

    // tell timer we need to send stuff
    INFO("newOptions %d\r\n", newOptions);
    INFO("newColor %d\r\n", newColor);
    sysCfg.light_options = newOptions;
    sysCfg.light_color = newColor;
    current_state->needsOptionSend = true;
}

void handle_mqtt_pallete_update(char* updateStr)
{
    uint32_t newPallete[16];
    uint8_t palleteSize = 0;

    uint8_t i;
    uint8_t tempArr[11];
    uint8_t *currPtr = updateStr;
    uint8_t *nextPtr;
    uint8_t sizeOfVal;

    while((sizeOfVal = find_next_value(currPtr, &nextPtr, tempArr))
          && palleteSize < 16)
    {
        if(sizeOfVal <= 10) {
            newPallete[palleteSize++] = atoi(tempArr);
        }

        currPtr = nextPtr;
    }


    // tell timer we need to send stuff
    for(i = 0; i < palleteSize; i++)
    {
        INFO("newPallete %d\r\n", newPallete[i]);
    }
    memcpy(sysCfg.light_pallete, newPallete, palleteSize * sizeof(uint32_t));
    sysCfg.light_pallete_size = palleteSize;
    current_state->needsPalleteSend = true;
}

void handle_mqtt_update(uint8_t *updateStr)
{
    uint8_t tempArr[11];
    uint8_t *currPtr = updateStr;
    uint8_t *nextPtr;
    uint8_t sizeOfVal;

    sizeOfVal = find_next_value(currPtr, &nextPtr, tempArr);
    if(sizeOfVal > 0)
    {
        if(strcmp(tempArr, "opt") == 0)
        {
            INFO("Handling Options update\r\n");
            handle_mqtt_options_update(nextPtr);
        }
        else if(strcmp(tempArr, "pal") == 0)
        {
            INFO("Handling Pallete update\r\n");
            handle_mqtt_pallete_update(nextPtr);
        }
        CFG_Save();
    }
    else
    {
        INFO("No data in update\r\n");
    }
}

void handle_mqtt_request(uint8_t *respBuffer)
{
    char temp[12];
    uint8_t *nextPos = respBuffer;
    uint8_t length = 0, i = 0;

    os_memcpy(nextPos, "opt", 3);
    nextPos += 3;

    os_sprintf(temp, ",%d", sysCfg.light_color);
    length = os_strlen(temp);
    os_memcpy(nextPos, temp, length);
    nextPos += length;

    os_sprintf(temp, ",%d", sysCfg.light_options);
    length = os_strlen(temp);
    os_memcpy(nextPos, temp, length);
    nextPos += length;

    os_memcpy(nextPos, ",pal", 4);
    nextPos += 4;

    for(i = 0; i < sysCfg.light_pallete_size; i++)
    {

        os_sprintf(temp, ",%d", sysCfg.light_pallete[i]);
        length = os_strlen(temp);
        os_memcpy(nextPos, temp, length);
        nextPos += length;
    }

    *nextPos = 0;
}

