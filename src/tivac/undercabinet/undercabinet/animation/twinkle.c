#include "twinkle.h"
#include <stdlib.h>
#include "string.h"
#include "math.h"

static const uint16_t lifeMax[4] = { 120, 200, 300, 1000 };
static const uint8_t blinkChance[4] = { 0, 1, 1, 5 };


void twinkle_setup(void *g_state, RoomStateSettings* settings)
{
	TwinkleState *state = g_state;
	memset(state, 0, sizeof(TwinkleState));
}

void twinkle_frame(void *g_state, Pixels* pixels)
{
	TwinkleState *state = g_state;

//    if(currentBrightness == 0xFF) {
//        // can't do brighter than max....
//        return;
//    }
	uint8_t normalColor = 0x30;
    uint8_t colorDiff = 0xFF - normalColor;

    uint16_t newIdx = 0, i;

    // Next pixel
    if(0 == rand() % 500) {
        for(i = 0; i < 10; i++) {
        	newIdx = rand() % pixels->pixelCount;
            if(!state->twinkle[newIdx].lifeCounter) {
            	state->twinkle[newIdx].options = rand() % 255;
            	state->twinkle[newIdx].lifeCounter =
            			lifeMax[state->twinkle[newIdx].options & 0x3];
            	break;
            }
        }
    }


    // decay counters
    for(i = 0; i < pixels->pixelCount; i++)
{
		if(state->twinkle[i].lifeCounter > 2)
		{
			state->twinkle[i].lifeCounter -= 1;
		}
		else
		{
			state->twinkle[i].lifeCounter = 0;
		}
    }

    uint8_t nextEntry = normalColor;
    uint16_t maxLife = 0;
    uint16_t halfLife = 0;
    uint16_t difference = 0;
    Twinkle twinkle;

    for(i = 0; i < pixels->pixelCount; i++)
    {
    	nextEntry = normalColor;
    	if(state->twinkle[i].lifeCounter)
		{
    		twinkle = state->twinkle[i];
    		if(rand() % 100 > blinkChance[(twinkle.options >> 2) & 0x3])
    		{
    			maxLife = lifeMax[twinkle.options & 0x3];
    			halfLife = maxLife / 2;
    			difference = twinkle.lifeCounter;
    			if(twinkle.lifeCounter > halfLife)
    			{
    				difference = maxLife - twinkle.lifeCounter;
    			}

    			nextEntry = normalColor + floor(((float)difference / (float)halfLife) * colorDiff);
    		}
		}

		pixels_setPixelValues(pixels, i, nextEntry, nextEntry, nextEntry);
    }
}
