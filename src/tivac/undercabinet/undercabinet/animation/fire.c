/*
 * fire.c
 *
 *  Created on: Jan 17, 2016
 *      Author: efess
 */


#include "fire.h"
#include <stdlib.h>
#include "string.h"
#include "math.h"

const uint32_t heat[] = {
    0x000000,
    0x330000, 0x660000, 0x990000, 0xCC0000, 0xFF0000,
    0xFF3300, 0xFF6600, 0xFF9900, 0xFFCC00, 0xFFFF00,
    0xFFFF33, 0xFFFF66, 0xFFFF99, 0xFFFFCC, 0xFFFFFF
};

void fire_setup(void *g_state, RoomStateSettings* settings)
{
	FireState *state = g_state;
	memset(state, 0, sizeof(FireState));
}

void fire_frame(void *g_state, Pixels* pixels)
{
	FireState *state = g_state;

    state->frameNum++;
    uint16_t newFlareUp = 0, i, k;
    // change add new flare up
    if(rand() % 10 == 0){
        // max new per frame 5%
        newFlareUp = 1;
    }

    if(state->frameNum % 3 == 0) {
        // Find new flare ups
        for(i = 0; i < newFlareUp; i++) {
            uint16_t randomPixel = rand() % LED_COUNT;
            if(!state->fire[randomPixel].isFlareUp){
                state->fire[randomPixel].isFlareUp = true;
                state->fire[randomPixel].fireIdx = 15;
            }
        }

        for(i = 0; i < LED_COUNT; i++) {
            if(!state->fire[i].isFlareUp) {
                state->fire[i].fireIdx = rand() % 7 + 2;
            }
        }

        for(i = 0; i < LED_COUNT; i++) {
            if(state->fire[i].isFlareUp) {
                FirePixel *thisFireNode = &state->fire[i];
                if(rand() % 2 == 0) {
                    thisFireNode->fireIdx += 1;

                } else {
                    thisFireNode->fireIdx -= 2;

                };

                if(thisFireNode->fireIdx <= 8) {
                    thisFireNode->isFlareUp = 0;
                } else {
                	int8_t j = -FIRE_DIFFUSE + 1;
                    for(; j < FIRE_DIFFUSE; j++) {
                        k = (i + j + LED_COUNT) % LED_COUNT;
                        state->fire[k].fireIdx = fmaxf(state->fire[k].fireIdx, thisFireNode->fireIdx - fabsf(j));
                    }
                }
            }
        }
    }

    for(i = 0; i < LED_COUNT; i++) {
        uint32_t thisEntry = heat[(uint8_t)fminf(state->fire[i].fireIdx, 15)];
        pixels_setPixelColor(pixels, i, thisEntry);
        //$('#pix-' + i).css('background-color', 'rgb(' + red(thisEntry) + ',' + green(thisEntry) + ',' + blue(thisEntry) + ')');
    }
}

