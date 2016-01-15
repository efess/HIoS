#include "ets_sys.h"
#define ws2812_type  ((1 << 6) | (1 << 4) | (0 << 2) | (2))
#define ICACHE_RAM_ATTR __attribute__((section(".iram0.text")))

#define F_CPU 80000000L

#define _BV(b) (1UL << (b))
#ifndef __STRINGIFY
#define __STRINGIFY(a) #a
#endif
// these low level routines provide a replacement for SREG interrupt save that AVR uses
// but are esp8266 specific. A normal use pattern is like
//
//{
//    uint32_t savedPS = xt_rsil(1); // this routine will allow level 1 and above
// level (0-15),
// level 15 will disable ALL interrupts,
// level 0 will enable ALL interrupts
//    // do work here
//    xt_wsr_ps(savedPS); // restore the state
//}
#define xt_rsil(level) (__extension__({uint32_t state; __asm__ __volatile__("rsil %0," __STRINGIFY(level) : "=a" (state)); state;}))
#define xt_wsr_ps(state)  __asm__ __volatile__("wsr %0,ps; isync" :: "a" (state) : "memory")

#define CYCLES_800_T0H  (F_CPU / 2500000) // 0.4us
//#define CYCLES_800_T0H  (F_CPU / 2857142) // 0.35 us
#define CYCLES_800_T1H  (F_CPU / 1250000) // 0.8us
#define CYCLES_800      (F_CPU /  800000) // 1.25us per bit
//#define CYCLES_800      (F_CPU /  400000) // 2.5us per bit

typedef struct {
    uint8_t pin;
    uint16_t numLEDs;

    // "private"
    uint8_t *_pixBuf;
    uint16_t _numBytes;
    uint32_t _endTime;
    uint8_t _rOffset;
    uint8_t _gOffset;
    uint8_t _bOffset;
    uint8_t _wOffset;
} Ws2812_Pixels;

void ws2812_init(Ws2812_Pixels *pixels);
void ws2812_setPixelColor(Ws2812_Pixels *pixels, uint16_t n, uint32_t c);
uint32_t ws2812_color(uint8_t r, uint8_t g, uint8_t b);
void ws2812_show(Ws2812_Pixels *pixels);
