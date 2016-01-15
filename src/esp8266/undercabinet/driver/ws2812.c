// Taken from Adafruit's NeoPixel library (https://github.com/adafruit/Adafruit_NeoPixel)
// - Removed 400khz support
// This is a mash-up of the Due show() code + insights from Michael Miller's
// ESP8266 work for the NeoPixelBus library: github.com/Makuna/NeoPixelBus
// Needs to be a separate .c file to enforce ICACHE_RAM_ATTR execution.

#include "osapi.h"
#include "ets_sys.h"
#include <eagle_soc.h>
#include "driver/ws2812.h"
#include "gpio_helper.h"
#include "user_interface.h"
#include "mem.h"
#include "debug.h"

void ws2812_init(Ws2812_Pixels *pixels) {
    if(pixels->pin >= 0) {
        pinMode(pixels->pin, OUTPUT, 0);
        digitalWrite(pixels->pin, LOW);
    }
    INFO("Type set... \r\n");
    // set type
    pixels->_wOffset = (ws2812_type >> 6) & 0b11; // See notes in header file
    pixels->_rOffset = (ws2812_type >> 4) & 0b11; // regarding R/G/B/W offsets
    pixels->_gOffset = (ws2812_type >> 2) & 0b11;
    pixels->_bOffset =  ws2812_type       & 0b11;

    // set bytes & buffer
    pixels->_numBytes = pixels->numLEDs * ((pixels->_wOffset == pixels->_rOffset) ? 3 : 4);
}

uint32_t ws2812_color(uint8_t r, uint8_t g, uint8_t b) {
    return ((uint32_t)r << 16) | ((uint32_t)g <<  8) | b;
}

void ws2812_setPixelColor(Ws2812_Pixels *pixels, uint16_t n, uint32_t c) {
  if(n < pixels->numLEDs) {
    uint8_t *p = &pixels->_pixBuf[n * 3];

    p[pixels->_rOffset] = (uint8_t)(c >> 16);
    p[pixels->_gOffset] = (uint8_t)(c >>  8);
    p[pixels->_bOffset] = (uint8_t)c;
  }
}


static uint32_t _getCycleCount(void) __attribute__((always_inline));
static inline uint32_t _getCycleCount(void) {
  uint32_t ccount;
  __asm__ __volatile__("rsr %0,ccount":"=a" (ccount));
  return ccount;
}

void ws2812_show(Ws2812_Pixels *pixels) {
    //noInterrupts(); // Need 100% focus on instruction timing
    uint32_t savedPS = xt_rsil(15);

    uint8_t *p, *end, pix, mask;
    uint32_t t, time0, time1, period, c, startTime, pinMask;

    pinMask   = _BV(pixels->pin);
    p         =  pixels->_pixBuf;
    end       =  p + pixels->_numBytes;
    pix       = *p++;
    mask      = 0x80;
    startTime = 0;

    time0  = CYCLES_800_T0H;
    time1  = CYCLES_800_T1H;
    period = CYCLES_800;

    for(t = time0;; t = time0) {
        if(pix & mask) t = time1;                             // Bit high duration
        while(((c = _getCycleCount()) - startTime) < period); // Wait for bit start
        GPIO_REG_WRITE(GPIO_OUT_W1TS_ADDRESS, pinMask);       // Set high
        startTime = c;                                        // Save start time
        while(((c = _getCycleCount()) - startTime) < t);      // Wait high duration
        GPIO_REG_WRITE(GPIO_OUT_W1TC_ADDRESS, pinMask);       // Set low
        if(!(mask >>= 1)) {                                   // Next bit/byte
            if(p >= end) break;
            pix  = *p++;
            mask = 0x80;
        }
    }

    xt_wsr_ps(savedPS);
}
