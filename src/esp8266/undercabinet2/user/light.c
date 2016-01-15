#include "light.h"
#include "osapi.h"
#include "debug.h"
#include "driver/uart.h"
#include "user_interface.h"
#include "running_state.h"

void empty_read_buffer()
{
    while(uart0_available())
    {
        uart0_read();
    }
}

int16_t read_with_timeout(uint16_t ms)
{
    uint32_t start = system_get_time();
    uint32_t usTimeout = start + (ms * 1000);
    while (usTimeout > system_get_time())
    {
        if(uart0_available())
        {
            return uart0_read();
        }
    }
    return -1;
}

// returns 1 if success (received ack), 0 if no response
bool light_send_options(uint32_t color, uint32_t options)
{
    // just in case there's crap left in here
    empty_read_buffer();

    int16_t readByte = 0;
    uint8_t data[11],i;
    data[0] = MAGIC_NUMBER;
    data[1] = SEND_TYPE_OPTIONS;
    data[2] = color & 0xFF;
    data[3] = (color >> 8) & 0xFF;
    data[4] = (color >> 16) & 0xFF;
    data[5] = (color >> 24) & 0xFF;

    data[6] = options & 0xFF;
    data[7] = (options >> 8) & 0xFF;
    data[8] = (options >> 16) & 0xFF;
    data[9] = (options >> 24) & 0xFF;

    uart0_tx_buffer(data, 10);

    readByte = read_with_timeout(500);

    if(readByte == -1) {
        INFO("Opt ack timeout\r\n");
    }
    else
    {
        INFO("Opt read: %d\r\n", readByte);
    }

    return readByte == MAGIC_NUMBER ? 1 : 0;
}

bool light_send_pallete(uint32_t *pallete, uint8_t size)
{
    // just in case there's crap left in here
    empty_read_buffer();

    int16_t readByte = 0;
    uint8_t data[51], i;
    uint32_t *palleteInc = pallete;

    data[0] = MAGIC_NUMBER;
    data[1] = SEND_TYPE_PALLETE;
    data[2] = size;
    for(i = 0; i < size; i++)
    {
        uint8_t offset = i * 3 + 3;

        data[offset] = *palleteInc & 0xFF;
        data[offset + 1] = (*palleteInc >> 8) & 0xFF;
        data[offset + 2] = (*palleteInc >> 16) & 0xFF;


        INFO("Pallete #%d: %d", i, *palleteInc);

        palleteInc++;
    }

    uart0_tx_buffer(data, 3 + (size * 3));

    readByte = read_with_timeout(500);

    if(readByte == -1) {
        INFO("Pal ack timeout\r\n");
    }
    else
    {
        INFO("Pal read: %d\r\n", readByte);
    }

    return readByte == MAGIC_NUMBER ? 1 : 0;
}
