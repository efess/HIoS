#include <stdlib.h>
#include "animation.h"
#include "transition/fade.h"
#include "transition/pixelate.h"
#include "animation/normal.h"
#include "animation/twinkle.h"
#include "animation/rainbow.h"
#include "animation/runner.h"
#include "animation/motion.h"
#include "animation/discrete.h"


#define ANIMATION_NONE 0
#define ANIMATION_MOTION 1
#define ANIMATION_TWINKLE 2
#define ANIMATION_RAINBOW 3
#define ANIMATION_RUNNER 4
#define ANIMATION_DISCRETE 5

#define TRANSITION_FADE 1
#define TRANSITION_PIXELATE 2

typedef void (*AnimationSetup)(void *state, RoomStateSettings* settings);
typedef void (*TransitionSetup)(void *state, Pixels* pixels);
typedef void (*AnimationFrame)(void *state, Pixels* pixels);
typedef bool (*TransitionFrame)(void *state, Pixels* pixels);

void *_animation_state;
AnimationFrame _animationFrame;

void *_transition_state;
TransitionFrame _transitionFrame;

uint16_t testCounter;

static const AnimationFrame animFrameFns[ANIMATION_TYPE_COUNT] = { rainbow_frame, runner_frame, motion_frame, twinkle_frame };
static const AnimationSetup animSetupFns[ANIMATION_TYPE_COUNT] = { rainbow_setup, runner_setup, motion_setup, twinkle_setup };

static const TransitionFrame transFrameFns[TRANSITION_TYPE_COUNT] = { fade_frame, pixelate_frame };
static const TransitionSetup transSetupFns[TRANSITION_TYPE_COUNT] = { fade_setup, pixelate_setup };

void changeAnimation(
		Pixels *pixels,
		RoomStateSettings *settings,
		TransitionSetup transitionSetup,
		TransitionFrame transitionFrame,
		AnimationSetup animationSetup,
		AnimationFrame animationFrame)
{
	if(transitionSetup)
	{
		transitionSetup(_transition_state, pixels);
	}

	if(animationSetup)
	{
		animationSetup(_animation_state, settings);
	}

	_animationFrame = animationFrame;
	_transitionFrame = transitionFrame;
}

void test(Pixels *pixels)
{
	Settings settings;
	settings.occupied.animation = 1;
	settings.occupied.transition = 1;
	settings.occupied.brightness = 8;

	settings.unoccupied.animation = 2;
	settings.unoccupied.transition = 1;
	settings.unoccupied.brightness = 3;

	if(testCounter % 500 == 0)
	{
		uint8_t rndTrans = rand() % TRANSITION_TYPE_COUNT;
		uint8_t rndAnim = rand() % ANIMATION_TYPE_COUNT;

		changeAnimation(pixels,
				&settings.occupied,
				transSetupFns[rndTrans],
				transFrameFns[rndTrans],
				animSetupFns[rndAnim],
				animFrameFns[rndAnim]);
	}

	testCounter++;
}

void animation_init()
{
	_animationFrame = 0;
	_transitionFrame = 0;

	_animation_state = malloc(1024); // 1k allocated for animation state
	_transition_state = malloc(1024); // 1k allocated for animation state
}


void animation_changeState(Pixels *pixels, Settings *settings, bool isOccupied)
{
	RoomStateSettings* roomSettings = isOccupied ?
			&settings->occupied :
			&settings->unoccupied;

	AnimationFrame aFrame;
	AnimationSetup aSetup;

	TransitionFrame tFrame;
	TransitionSetup tSetup;


	switch(roomSettings->transition)
	{
	case TRANSITION_FADE:
		tFrame = fade_frame;
		tSetup = fade_setup;
		break;
	case TRANSITION_PIXELATE:
		tFrame = pixelate_frame;
		tSetup = pixelate_setup;
		break;
	default:
		tFrame = 0;
		tSetup = 0;
	}

	switch(roomSettings->animation)
	{
	case ANIMATION_NONE:
		aFrame = normal_frame;
		aSetup = normal_setup;
		break;
	case ANIMATION_MOTION:
		aFrame = motion_frame;
		aSetup = motion_setup;
		break;
	case ANIMATION_TWINKLE:
		aFrame = twinkle_frame;
		aSetup = twinkle_setup;
		break;
	case ANIMATION_RUNNER:
		aFrame = runner_frame;
		aSetup = runner_setup;
		break;
	case ANIMATION_RAINBOW:
		aFrame = rainbow_frame;
		aSetup = rainbow_setup;
		break;
	case ANIMATION_DISCRETE:
		aFrame = discrete_frame;
		aSetup = discrete_setup;
		break;
	default:
		aFrame = 0;
		aSetup = 0;
	}

	changeAnimation(pixels, roomSettings, tSetup, tFrame, aSetup, aFrame);
}

void animation_runFrame(Pixels *pixels)
{
	//test(pixels);

	if(_animationFrame)
	{
		_animationFrame(_animation_state, pixels);
	}
	if(_transitionFrame)
	{
		if(_transitionFrame(_transition_state, pixels))
		{
			_transitionFrame = 0;
		}
	}
}
