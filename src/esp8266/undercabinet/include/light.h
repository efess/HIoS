#include "os_type.h"

#define MAGIC_NUMBER 98
#define UART_SEND_BUFFER_SIZE 32
#define SEND_TYPE_OPTIONS 0
#define SEND_TYPE_PALLETE 1

#define UPDATE_TYPE_CONFIG 1

#define PACKET_HEADER_SIZE_FIRST 6
#define PACKET_HEADER_SIZE_SUBSEQ 3

void light_change(uint32_t color, uint32_t options);
uint32_t light_color(uint8_t r, uint8_t g, uint8_t b);
uint32_t light_color_brightness(uint32_t color, uint8_t brightness);
uint8_t light_send_pallete(uint32_t *pallete, uint8_t size);
uint8_t light_send_status(uint32_t options, uint32_t color);
bool light_send_config(uint8_t *config, uint16_t length);
