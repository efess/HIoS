#include "light.h"
#include "osapi.h"
#include "debug.h"
#include "driver/uart.h"
#include "user_interface.h"
#include "running_state.h"

uint16_t min(uint16_t val1, uint16_t val2)
{
    return val1 < val2 ? val1 : val2;
}

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


bool light_send_config(uint8_t* config, uint16_t length)
{
    //  protocol:
    //    first packet
    //  [magicNumber 8] [paketnum 8] [totalSize 16] [this packetSize 16] [data]
    //    subsequent packets
    //  [magicNumber 8] [paketnum 8] [this packetSize 16] [data]

    // just in case there's crap left in here
    empty_read_buffer();

    int16_t readByte = 0;
    uint16_t sendByteOffset = 0;
    uint8_t counter = 0;
    uint16_t nextPacketSize = 0;

    uint8_t sendBuf[UART_SEND_BUFFER_SIZE];

    sendBuf[0] = MAGIC_NUMBER;
    sendBuf[1] = counter++;
    sendBuf[2] = UPDATE_TYPE_CONFIG;
    sendBuf[3] = length & 0xFF;
    sendBuf[4] = (length >> 8) & 0xFF;

    nextPacketSize = min(UART_SEND_BUFFER_SIZE - PACKET_HEADER_SIZE_FIRST, length); // 5 for header info
    sendBuf[5] = nextPacketSize & 0xFF;

    os_memcpy(sendBuf + PACKET_HEADER_SIZE_FIRST, config, nextPacketSize);

    uart0_tx_buffer(sendBuf, nextPacketSize + PACKET_HEADER_SIZE_FIRST);

    readByte = read_with_timeout(500);

    if(readByte == -1){
        INFO("sending config ack timeout\r\n");
        return false;
    } else if(readByte != MAGIC_NUMBER) {
        INFO("invalid response received during send, aborting\r\n");
        return false;
    }
    INFO("sent %d bytes for first packet\r\n", (nextPacketSize + PACKET_HEADER_SIZE_FIRST));

    sendByteOffset = sendByteOffset + nextPacketSize;
    while(sendByteOffset < length && readByte == MAGIC_NUMBER)
    {
        nextPacketSize = min(UART_SEND_BUFFER_SIZE - PACKET_HEADER_SIZE_SUBSEQ, length - sendByteOffset);

        sendBuf[0] = MAGIC_NUMBER;
        sendBuf[1] = counter++;
        sendBuf[2] = nextPacketSize;

        os_memcpy(sendBuf + PACKET_HEADER_SIZE_SUBSEQ, config + sendByteOffset, nextPacketSize);

        uart0_tx_buffer(sendBuf, nextPacketSize + PACKET_HEADER_SIZE_SUBSEQ);

        readByte = read_with_timeout(500);
        if(readByte == -1){
            INFO("sending config ack timeout\r\n");
            return false;
        } else if(readByte != MAGIC_NUMBER) {
            INFO("invalid response received during send, aborting\r\n");
            return false;
        }
        INFO("sent %d bytes in packet %d\r\n", (nextPacketSize + PACKET_HEADER_SIZE_SUBSEQ), counter);
        sendByteOffset = sendByteOffset + nextPacketSize;
    }
    if(readByte == MAGIC_NUMBER) {
        INFO("send config complete\r\n");
        return true;
    } else {
        INFO("send config error\r\n");
        return false;
    }
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
