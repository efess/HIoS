/*
 * sound.c
 *
 *  Created on: Jan 23, 2016
 *      Author: efess
 */
#include "sound.h"
#include "driverlib/sysctl.h"
#include "driverlib/adc.h"
#include "driverlib/timer.h"
#include "driverlib/rom.h"
#include "driverlib/udma.h"
#include "driverlib/interrupt.h"
#include "inc/hw_ints.h"
#include "inc/hw_adc.h"
#include "inc/hw_memmap.h"
#include "math.h"
#include "util/dsp.h"
#include "stdio.h"
#include "utils/uartstdio.h"

#pragma DATA_ALIGN(DMAcontroltable, 1024)
uint8_t DMAcontroltable[1024];

#define CPU_CLOCK 80000000

#define SAMPLES 1024

#define MIN_FREQ 20
#define MAX_FREQ 22050

// 44.1k hz
#define TICKS_44p1HZ CPU_CLOCK / 44100

int16_t _sndbufA[SAMPLES];
int16_t _sndbufB[SAMPLES];

volatile int16_t* _currentBuf = 0;

// freq array from 0 - 512
// for(int i = 5; i < 20; i++) { console.log(Math.pow(10, i*.135463498));}
const uint16_t _freqArray[] = {3, 6, 9, 12, 16, 22, 30, 42, 57, 78, 107, 147, 200, 274, 374, 512};

void uDMAErrorHandler(void)
{
    uint32_t ui32Status;

    //
    // Check for uDMA error bit
    //
    ui32Status = ROM_uDMAErrorStatusGet();

    //
    // If there is a uDMA error, then clear the error and increment
    // the error counter.
    //
    if(ui32Status)
    {
        ROM_uDMAErrorStatusClear();
        //g_ui32uDMAErrCount++;
    }
}
// I guess this is how it works?
void _adc_sequence_3_handler(void)
{
	uint32_t altMode;
	uint32_t priMode;
    uint32_t ui32Status;

    ui32Status = ADCIntStatus(ADC0_BASE, 3, false);

	ADCIntClearEx(ADC0_BASE, ui32Status);

	altMode = uDMAChannelModeGet(UDMA_CHANNEL_ADC3 | UDMA_ALT_SELECT);
	priMode = uDMAChannelModeGet(UDMA_CHANNEL_ADC3 | UDMA_PRI_SELECT);
	if (priMode== UDMA_MODE_STOP) {
		_currentBuf = _sndbufA;
		// re-set up a DMA transfer to the buffer
		uDMAChannelTransferSet(
				UDMA_CHANNEL_ADC3 | UDMA_PRI_SELECT,
				UDMA_MODE_PINGPONG,
				(void *)(ADC0_BASE + ADC_O_SSFIFO3),
				_sndbufA,
				SAMPLES);
		uDMAChannelEnable(UDMA_CHANNEL_ADC3);
	} else if (altMode == UDMA_MODE_STOP) {
		_currentBuf = _sndbufB;

		// re-set up a DMA transfer to the buffer
		uDMAChannelTransferSet(
				UDMA_CHANNEL_ADC3 | UDMA_ALT_SELECT,
				UDMA_MODE_PINGPONG,
				(void *)(ADC0_BASE + ADC_O_SSFIFO3),
				_sndbufB,
				SAMPLES);
		uDMAChannelEnable(UDMA_CHANNEL_ADC3);
	}
}
void _init_sample_timer()
{
	ROM_SysCtlPeripheralEnable(SYSCTL_PERIPH_TIMER1);

	ROM_SysCtlDelay(5);

	TimerConfigure(TIMER1_BASE, TIMER_CFG_PERIODIC);
	// Timer
	TimerClockSourceSet(TIMER1_BASE, TIMER_CLOCK_SYSTEM);

	TimerControlTrigger(TIMER1_BASE, TIMER_BOTH, true);

	TimerLoadSet(TIMER1_BASE, TIMER_A, TICKS_44p1HZ);

	TimerEnable(TIMER1_BASE, TIMER_BOTH);
}

void _init_dma()
{
	ROM_SysCtlPeripheralDisable(SYSCTL_PERIPH_UDMA);
	ROM_SysCtlPeripheralReset(SYSCTL_PERIPH_UDMA);
	ROM_SysCtlPeripheralEnable(SYSCTL_PERIPH_UDMA);

	ROM_SysCtlDelay(10);

	uDMAEnable();

	uDMAControlBaseSet(DMAcontroltable);

	uDMAChannelAssign(UDMA_CHANNEL_ADC3);

	uDMAChannelAttributeEnable(UDMA_CHANNEL_ADC3, UDMA_ATTR_USEBURST);

	uDMAChannelControlSet(UDMA_CHANNEL_ADC3 | UDMA_PRI_SELECT,
			UDMA_SIZE_16 | UDMA_SRC_INC_NONE | UDMA_DST_INC_16 | UDMA_ARB_1);
	uDMAChannelControlSet(UDMA_CHANNEL_ADC3 | UDMA_ALT_SELECT,
			UDMA_SIZE_16 | UDMA_SRC_INC_NONE | UDMA_DST_INC_16 | UDMA_ARB_1);

	uDMAChannelTransferSet(
			UDMA_CHANNEL_ADC3 | UDMA_PRI_SELECT,
			UDMA_MODE_PINGPONG,
			(void *)(ADC0_BASE + ADC_O_SSFIFO3),
			_sndbufA,
			SAMPLES);

	uDMAChannelTransferSet(
			UDMA_CHANNEL_ADC3 | UDMA_ALT_SELECT,
			UDMA_MODE_PINGPONG,
			(void *)(ADC0_BASE + ADC_O_SSFIFO3),
			_sndbufB,
			SAMPLES);

	uDMAChannelEnable(UDMA_CHANNEL_ADC3);
}

void _init_adc()
{
	ROM_SysCtlPeripheralEnable(SYSCTL_PERIPH_ADC0);
	ROM_SysCtlDelay(3);

	// configure to use sequencer3 (FIFO size of 1)
	// triggered by timer
	//  0 - Highest priority
	ADCSequenceConfigure(ADC0_BASE, 3, ADC_TRIGGER_TIMER, 0);

	ADCSequenceStepConfigure(ADC0_BASE, 3, 0, ADC_CTL_CH0 | ADC_CTL_END | ADC_CTL_IE);

	// ADC -> DMA (channel 17)
	ADCSequenceDMAEnable(ADC0_BASE, 3);

	ADCIntEnableEx(ADC0_BASE, ADC_INT_DMA_SS3);

	IntEnable(INT_ADC0SS3);

	ADCSequenceEnable(ADC0_BASE, 3);
}

void _test_sound()
{
	// uart print mean
	int16_t min = 0;
	int16_t max = 0;
	int32_t avg = 0;
	int16_t i = 0;

	for(i = 0; i < 1024; i++)
	{
		if(_currentBuf[i] < min)
			min = _currentBuf[i];
		if(_currentBuf[i] > max)
			max = _currentBuf[i];
		avg += _currentBuf[i];
	}

	avg = avg >> 10;

	char out[50];
	sprintf(out, "min: %d max: %d avg: %d\r\n", min, max, avg);
	UARTprintf(out);
}

float _signal_magnitude(float re, float im)
{
	return sqrtf(powf(re,2) + powf(im,2));
}
void _make_bins(float bins[], float real[], float im[], uint8_t binCount)
{
	// 5 - 20  or 0 - 15
	//frequency steps -> 10^[6-20] * .21717042969
	//

	uint16_t i = 0, j = 0;
	uint16_t binStart = 1; // 1 seems to have a shit ton of weight
	float min = 0;
	float max = 0;

	for(i = 0; i < binCount - 1; i++)
	{
		min = 0xFFFFF;
		max = 0;

		for(j = binStart; j < _freqArray[i]; j++)
		{
			float mag = _signal_magnitude(real[j], im[j]);
			if(mag < min)
				min = mag;
			if(mag > max)
				max = mag;
		}
		bins[i] = (max - min) / binCount;
		binStart = _freqArray[i];
	}
}

void sound_init()
{
	_init_dma();
	_init_adc();
	_init_sample_timer();
}

void sound_getFreq(float bins[], uint8_t binCount)
{
	_test_sound();
	uint16_t i;
	float avg = 0;

	float real[SAMPLES];
	float im[SAMPLES];
	float twiddle = M_PI * 2 / (SAMPLES - 1);
	if(!_currentBuf){
		return;
	}

	for(i = 0; i < SAMPLES; i++)
	{
		avg += _currentBuf[i];
	}

	avg = avg / SAMPLES;

	for(i = 0; i < SAMPLES; i++)
	{
		real[i] = (float)_currentBuf[i] - avg;// avg because the mean fluctuates due to loudness..

		// hanning window
		real[i] = real[i] * .5 * (1 - cosf(twiddle * i));
		im[i] = 0;
	}

	dsp_fft(10, real, im);

	_make_bins(bins, real, im, binCount);
}
