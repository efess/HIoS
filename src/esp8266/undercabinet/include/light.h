#include "os_type.h"

#define MAGIC_NUMBER 98
#define SEND_TYPE_OPTIONS 0
#define SEND_TYPE_PALLETE 1

void light_change(uint32_t color, uint32_t options);
uint32_t light_color(uint8_t r, uint8_t g, uint8_t b);
uint32_t light_color_brightness(uint32_t color, uint8_t brightness);
uint8_t light_send_pallete(uint32_t *pallete, uint8_t size);
uint8_t light_send_status(uint32_t options, uint32_t color);
