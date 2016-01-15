// This only receives commands from the ESP and pumps the pattern to the ws2812 strip

#include <Adafruit_NeoPixel.h>

#include <Wire.h> 
#include "LiquidCrystal_I2C.h"
#include "common.h"
//#include "led_sysdefs.h"
//#include "lib8tion.h"

//#define LCD_DEBUG

#define PIN_LED_DATAOUT 6
#define PIN_MOTINON_SENSOR 3

#define LED_COUNT 231
#define LED_COUNT_BYTES 29// LED_COUNT / 8

#define ANIMATION_FRAMES 20

#ifdef LCD_DEBUG
//LiquidCrystal_I2C lcd(0x27,20,4);
#endif

Adafruit_NeoPixel ws2812(LED_COUNT, PIN_LED_DATAOUT);

// need two vars to distinguish between detected  state
// and current led state
bool volatile sensorIsOccupied = true;
bool ledsIsOccupied = false;

unsigned long volatile lastMotionDetected;
//uint8_t minsTillUnoccupied = 3;
uint8_t secsTillUnoccupied = 30;
// 10 is 18 seconds
// common vars
uint8_t anim_state[LED_COUNT];
uint16_t count = 0;
uint32_t frameNum = 0;

#define OPTIONS_MASK_ROOM_BRIGHT 0x80000
#define OPTIONS_SHIFT_OCCUPIED 1
#define OPTIONS_SHIFT_UNOCCUPIED 10

#define OPTIONS_MASK_BRIGHT 0x000000F	 // 4 bits				
#define OPTIONS_MASK_BRIGHT_SHIFT 0

#define OPTIONS_MASK_PGM 0x00000070	 // 3 bits
#define OPTIONS_MASK_PGM_SHIFT 4

#define OPTIONS_MASK_TRANS 0x00000180
#define OPTIONS_MASK_TRANS_SHIFT 7

#define ANIMATION_NONE 0
#define ANIMATION_GRADIENTS 1
#define ANIMATION_TWINKLE 2
#define ANIMATION_RAND_PATTERN 3
#define ANIMATION_RUNNER 4
#define ANIMATION_DISCRETE 5

#define TRANSITION_FADE 1
#define TRANSITION_PIXELATE 2

#define MAGIC_NUMBER 98
#define UPDATE_REQUEST 0xE0

typedef void (*AnimationFn)(void);

//static const uint8_t brightnessSettings[] =  {10, 50, 100, 200};
// settings and current state
uint32_t pallete[] = {
    0x5500AB, 0x84007C, 0xB5004B, 0xE5001B,
    0xE81700, 0xB84700, 0xAB7700, 0xABAB00,
    0xAB5500, 0xDD2200, 0xF2000E, 0xC2003E,
    0x8F0071, 0x5F00A1, 0x2F00D0, 0x0007F9
};

uint32_t currentOptions;
uint32_t currentColor;
uint8_t currentBrightness;
uint8_t currentAnimation;

AnimationFn currentAnimationFn;

uint8_t palleteSize = 16;

void setup()
{
	pinMode(PIN_LED_DATAOUT, OUTPUT);
	pinMode(PIN_MOTINON_SENSOR, INPUT);
	currentColor = 0;
	Serial.begin(115200);
	Serial.setTimeout(50);
	ws2812.begin();isr_motion_handler
	
	attachInterrupt(digitalPinToInterrupt(PIN_MOTINON_SENSOR), isr_motion_handler, CHANGE);

//#ifdef LCD_DEBUG
//	lcd.init();
//    lcd.backlight();
//#endif

	delay(2000);
	lastMotionDetected = millis();
	Serial.write(UPDATE_REQUEST);
}

extern unsigned int __bss_end;
extern unsigned int __heap_start;
extern void *__brkval;
int freeMemory()
{
  int free_memory;

  if((int)__brkval == 0)
     free_memory = ((int)&free_memory) - ((int)&__bss_end);
  else
    free_memory = ((int)&free_memory) - ((int)__brkval);

  return free_memory;
}

uint8_t brightnessFromOptions(uint8_t level)
{
	return min(pow(level, 2), 255);
}
void set_color(uint32_t color) {
	for(uint8_t p = 0; p < LED_COUNT; p++)
	{
		ws2812.setPixelColor(p, color);
	}
}

void loop()
{
	if(currentAnimationFn) {
		currentAnimationFn();
		frameNum++;
	}

	//animation delay
	delay(30);

	if(sensorIsOccupied != ledsIsOccupied) {
		if(sensorIsOccupied || millis() > lastMotionDetected + (uint32_t)(secsTillUnoccupied * 1000))
		{
			change_state(currentOptions, currentColor);
		}
	}

	if(!Serial.available()) 
	{
		return;
	}

	uint8_t buf[8];
	//lcd.clear();
	//lcd.print("reading serial");

	// We have data to process
	int8_t result = 0;
	uint8_t val = 0;
	val = Serial.read();

	if(val != MAGIC_NUMBER) 
	{
		//lcd.print("invalid magic value ");
		//lcd.print(val);
		result = -1;
	}
	else 
	{
		val = Serial.read();
		switch(val)
		{
		case 0:
			val = Serial.readBytes(buf, 8);
			if(val != 8) {
				//lcd.print("invalid length ");
				//lcd.print(val);
				result = -1;

			} else {
				Serial.write(MAGIC_NUMBER);
				parse_options(buf);
			}
			break;
		case 1:
			result = read_pallete();
			break;
		default:
			result = -1;
			//lcd.print("invalid type ");
			//lcd.print(val);
			break;
		}
	}
	
	if(result < 0) {
		Serial.write(10);
		// flushhhhhh
		Serial.flush();
		while(Serial.read() > -1) {};
	}
}

uint8_t serial_read_timeout(uint8_t *buffer, uint8_t byteCount)
{
}

int8_t read_pallete()
{
	uint8_t buffer[4];
	uint8_t numPalleteEntries = Serial.read();
	uint8_t numBytes = 0;
	if(numPalleteEntries < 0 || numPalleteEntries > 16)
	{
		return -1;
	}
	for(count = 0; count < numPalleteEntries; count++) 
	{
		numBytes = Serial.readBytes(buffer, 3)	;
		if(numBytes != 3)
		{
			//lcd.setCursor(0,0);
			//lcd.print("bad read count ");
			//lcd.print(numBytes);
			return -1;
		}

		pallete[count] = threeByteBufferToUInt32(buffer);
		palleteSize = count + 1;
	}
	
	// success
	Serial.write(MAGIC_NUMBER);
	delay(5000);
	setup_animation(TRANSITION_FADE);
}

int8_t parse_options(uint8_t *buffer)
{
	uint32_t color = bufferToUInt32(buffer);
	if((color >> 24) & 0xFF > 0)
	{
		// invalid color.
		return -1;
	}

	buffer += 4;
	uint32_t options = bufferToUInt32(buffer);

	change_state(options, color);

	return 0;
}

void isr_motion_handler() 
{
	sensorIsOccupied = digitalRead(PIN_MOTINON_SENSOR);
	lastMotionDetected = millis();
}

void change_state(uint32_t options, uint32_t color)
{
	uint32_t shifted_options;
	if(sensorIsOccupied)
	{
		// occupied
		shifted_options = options >> OPTIONS_SHIFT_OCCUPIED;
	}
	else 
	{
		shifted_options = options >> OPTIONS_SHIFT_UNOCCUPIED;
	}

	currentBrightness = brightnessFromOptions((shifted_options & OPTIONS_MASK_BRIGHT) >> OPTIONS_MASK_BRIGHT_SHIFT);
	currentAnimation = (shifted_options & OPTIONS_MASK_PGM) >> OPTIONS_MASK_PGM_SHIFT;
	currentColor = color;
	currentOptions = options;
	ledsIsOccupied = sensorIsOccupied;
	
//#ifdef LCD_DEBUG
//	lcd.clear();
//	lcd.setCursor(0,0);
//	lcd.print("an ");
//	lcd.print(currentAnimation);
//	lcd.setCursor(0,1);
//	lcd.print("br ");
//	lcd.print(currentBrightness);
//	lcd.setCursor(0,2);
//	lcd.print("co ");
//	lcd.print(currentColor);
//	lcd.setCursor(0,3);
//	lcd.print("oc ");
//	lcd.print(options & 1);
//	lcd.print(" l ");
//	lcd.print((options & OPTIONS_MASK_ROOM_BRIGHT) == OPTIONS_MASK_ROOM_BRIGHT);
//#endif

	uint8_t transition = (shifted_options & OPTIONS_MASK_TRANS) >> OPTIONS_MASK_TRANS_SHIFT;

	setup_animation(transition);
}

void setup_animation(uint8_t transition)
{
	frameNum = 0;

	switch(transition) 
	{
	case TRANSITION_FADE:
		transitionFade();
		break;
	case TRANSITION_PIXELATE:
		transitionPixel();
		break;
	}

	switch(currentAnimation)
	{
	case ANIMATION_NONE:
		currentAnimationFn = 0; // no animation
		setupNormal();
		break;
	case ANIMATION_GRADIENTS:
		setupFloatingGradients();
		currentAnimationFn = floatingGradients;
		break;
	case ANIMATION_TWINKLE:
		setupTwinkle();
		currentAnimationFn = animateTwinkle;
		break;
	case ANIMATION_RAND_PATTERN:
		currentAnimationFn = animationRandomPattern;
		break;
	case ANIMATION_RUNNER:
		setupRunner();
		currentAnimationFn = runner;
		break;
	case ANIMATION_DISCRETE:
		currentAnimationFn = 0; // no animation
		discrete();
		break;
	}
}

void setupNormal()
{
	set_color(changeBrightness(currentColor, currentBrightness));
	ws2812.show();
}

void setupRunner() 
{
	anim_state[0] = 0;
}

void transitionFade()
{
	uint32_t fromColor, toColor = changeBrightness(currentColor, currentBrightness), stepColor;
	uint8_t alpha = 255 / ANIMATION_FRAMES;
	
	uint16_t i = 0;

	for(count = 0; count < ANIMATION_FRAMES - 1; count++)
	{
		alpha += 5; // increase the ammount we're giving
		for(i = 0; i < LED_COUNT; i++)
		{
			fromColor = ws2812.getPixelColor(i);
			stepColor = blendA(fromColor, toColor, alpha);

			
			ws2812.setPixelColor(i, blendA(toColor, fromColor, alpha));
			
		}
		
		ws2812.show();
		//lcd.clear();
		//lcd.print("step: ");
		//lcd.print(stepColor);
		//lcd.setCursor(0,1);
		//lcd.print("from: ");
		//lcd.print(fromColor);
		//lcd.setCursor(0,2);
		//lcd.print("to: ");
		//lcd.print(toColor);
		//lcd.setCursor(0,3);
		//lcd.print("alpha: ");
		//lcd.print(alpha);

		//delay(500);
        delay(20);
	}
}

void transitionPixel()
{
	randomSeed(millis());
	memset(anim_state, 0, LED_COUNT_BYTES);

	uint8_t pixelsPerTransition = LED_COUNT / 20;
	uint8_t pixelsInTransition = 0;
	uint16_t pixel = 0;
	uint32_t toColor = changeBrightness(currentColor, currentBrightness);

	for(count = 0; count < ANIMATION_FRAMES - 1; count++)
	{
		pixelsInTransition = 0;
		while(pixelsInTransition < pixelsPerTransition)
		{
			pixel = random(0, LED_COUNT);
			if(!((anim_state[pixel >> 3] >> (pixel % 8)) & 1))
			{
				anim_state[pixel >> 3] |= (1 << (pixel % 8));
				ws2812.setPixelColor(pixel, toColor);
				pixelsInTransition++;
			}
		}
		ws2812.show();
		delay(20);
	}
}

void runner() 
{
#define RUNNER_DRAG_LENGTH 20
#define STATE_POSITION_IDX 0
 
    int steps = 255 / RUNNER_DRAG_LENGTH;
	uint16_t idx = 0;
 
    for(count = 0; count < LED_COUNT; count++) 
	{
		ws2812.setPixelColor(count, 0x000000);
    }

    for(count = 0; count < RUNNER_DRAG_LENGTH; count++) 
	{
		idx = (anim_state[STATE_POSITION_IDX] - count + LED_COUNT) % LED_COUNT;
		ws2812.setPixelColor(idx, changeBrightness(currentColor, (RUNNER_DRAG_LENGTH - count) * steps));
    }

    anim_state[STATE_POSITION_IDX] = (anim_state[STATE_POSITION_IDX] + 1) % LED_COUNT;
	ws2812.show();
}

 void discrete() 
 {
	for(count = 0; count < LED_COUNT; count++) 
	{
		if((uint32_t)floor(count / 6.0) % 4 == 0) {
			// ON
			ws2812.setPixelColor(count, changeBrightness(currentColor, currentBrightness));
		} else {
			// OFF
			ws2812.setPixelColor(count, 0x000000);
		}
    }
	ws2812.show();
}

//uint32_t pattern[] = {7960832121, 414720, 75366400};
//int lastOffset = -1;
void animationRandomPattern() 
{
	delay(500);
	randomSeed(analogRead(0));
	long randomValue = random(0, palleteSize);
	if(randomValue == anim_state[0]) 
	{
		anim_state[0] = (randomValue + 1) % 3;
	}
	anim_state[0] = randomValue;
	int step = 0;
	for(uint8_t p = 0; p < LED_COUNT; p++)
	{
		ws2812.setPixelColor(p, changeBrightness(pallete[(p + randomValue) % palleteSize], currentBrightness));
	}
	ws2812.show();
}

void setupTwinkle()  
{
	memset(anim_state, 0, LED_COUNT);
}

void animateTwinkle() 
{
	long timestamp = millis();

    if(currentBrightness == 0xFF) {
        // can't do brighter than max....
        return;
    }
    uint8_t twinkleVal = 0xFF >> 2;
    uint8_t difference = min(0xFF, currentBrightness + 0x20) - currentBrightness;

    uint8_t newTwinkles = 0;
    if(0 == random(0, 20)) {
		newTwinkles = random(0, ceil(LED_COUNT * .02 + 1));
    }
            
    for(count = 0; count < newTwinkles; count++) {
		uint8_t nextTwinkle = random(0, LED_COUNT);
        if(anim_state[nextTwinkle] == 0) {
            anim_state[nextTwinkle] = random(2, twinkleVal);
        }
    }
            
    for(count = 0; count < LED_COUNT; count++) {
        if(anim_state[count] > 2) {
            anim_state[count] -= 1;
        } else {
            anim_state[count] = 0;
        }
    }
	
    uint32_t entry, currentColorBrightness = changeBrightness(currentColor, currentBrightness);
	for(count = 0; count < LED_COUNT; count++)
    {
		entry = currentColorBrightness;
        if(anim_state[count] > 0 && !(random(0, 20) == 0)){

            entry = changeBrightness(currentColor, currentBrightness + ceil(((float)anim_state[count] / (float)twinkleVal) * difference));
        }
		ws2812.setPixelColor(count, entry);
    }
	ws2812.show();
}

void setupFloatingGradients()
{
	memset(anim_state, 0, LED_COUNT);

#define RANDOM_NODE_COUNT 3

#define RANDOM_FREQ_OFFSET 3
#define RANDOM_OFFSET_VALUE_OFFSET 6

    // mark values that will have random movement
	if(palleteSize > 4) {
		anim_state[palleteSize] = random(2,5);
	}
	if(palleteSize > 8) {
		anim_state[palleteSize + 1] = random(6,9);
	}
	if(palleteSize > 12) {
		anim_state[palleteSize + 2] = random(10,13);
	}

    for(count = 0; count < RANDOM_NODE_COUNT; count++) {
		if(anim_state[palleteSize + count] > 0) 
		{
			// random offset sin frequency
			anim_state[palleteSize + RANDOM_FREQ_OFFSET + count] = random(100, 200);
		}
    }
	
	float divisor = floor(LED_COUNT / palleteSize);
    for(count = 0; count < palleteSize; count++)
	{
        // set start locations
        anim_state[count] = divisor * (count + 1);
    }
    for(count = 0; count < RANDOM_NODE_COUNT; count++) 
	{
		// random offset values
		if(anim_state[palleteSize + count] > 0)
		{
			anim_state[palleteSize + RANDOM_OFFSET_VALUE_OFFSET + count] = anim_state[anim_state[palleteSize + count]];
		}
    }
}


void floatingGradients() 
{
#define RANDOM_NODE_COUNT 4
#define DIFFUSE_WIDTH 20
	uint32_t index = anim_state[palleteSize];
    for(count = 0; count < RANDOM_NODE_COUNT; count++)
	{
		if(anim_state[palleteSize + count] > 0)
		{
			anim_state[anim_state[palleteSize + count]] = ((uint32_t)anim_state[palleteSize + RANDOM_OFFSET_VALUE_OFFSET + count] +
				(uint32_t)floor(sin((float)frameNum / (float)anim_state[palleteSize + RANDOM_FREQ_OFFSET + count]) * 90)) % LED_COUNT;
		}
    }
    uint8_t stretch = (uint32_t)floor(frameNum / 6) % LED_COUNT;
	uint16_t k, pos;
	uint32_t nextColor;
	int8_t j;
	ws2812.clear();
    for(count = 0; count < palleteSize - 1; count++) 
	{
		pos = (uint16_t)anim_state[count] + (uint16_t)stretch;

        for(j = -DIFFUSE_WIDTH + 1; j < DIFFUSE_WIDTH; j++) {
            k = (j + pos + LED_COUNT) % LED_COUNT;

			nextColor = blendA(ws2812.getPixelColor(k), pallete[count], ((float)abs(j) / (float)DIFFUSE_WIDTH) * 255);

			ws2812.setPixelColor(k, changeBrightness(nextColor, currentBrightness));
			
        }
    }

    ws2812.show();
}
