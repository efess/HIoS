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

#pragma DATA_ALIGN(DMAcontroltable, 1024)
uint8_t DMAcontroltable[1024];

#define CPU_CLOCK 80000000

// 44.1k hz
#define TICKS_44p1HZ CPU_CLOCK / 44100

uint16_t _sndbufA[1024];
uint16_t _sndbufB[1024];

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

		// re-set up a DMA transfer to the buffer
		uDMAChannelTransferSet(
				UDMA_CHANNEL_ADC3 | UDMA_PRI_SELECT,
				UDMA_MODE_PINGPONG,
				(void *)(ADC0_BASE + ADC_O_SSFIFO3),
				_sndbufA,
				1024);
		uDMAChannelEnable(UDMA_CHANNEL_ADC3);
	} else if (altMode == UDMA_MODE_STOP) {

		// re-set up a DMA transfer to the buffer
		uDMAChannelTransferSet(
				UDMA_CHANNEL_ADC3 | UDMA_ALT_SELECT,
				UDMA_MODE_PINGPONG,
				(void *)(ADC0_BASE + ADC_O_SSFIFO3),
				_sndbufB,
				1024);
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
			1024);

	uDMAChannelTransferSet(
			UDMA_CHANNEL_ADC3 | UDMA_ALT_SELECT,
			UDMA_MODE_PINGPONG,
			(void *)(ADC0_BASE + ADC_O_SSFIFO3),
			_sndbufB,
			1024);

	uDMAChannelEnable(UDMA_CHANNEL_ADC3);
}

void _init_adc()
{
	ROM_SysCtlPeripheralEnable(SYSCTL_PERIPH_ADC0);
	ROM_SysCtlDelay(3);

	// configure to use internal 16mhz clock
	//ADCClockConfigSet(ADC0_BASE, DC_CLOCK_SRC_PIOSC | ADC_CLOCK_RATE_HALF, 1);

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


void sound_init()
{
	_init_dma();
	_init_adc();
	_init_sample_timer();
}

void sound_getFreq()
{

}
