/*
 * dsp.c
 *
 *  Created on: Feb 1, 2016
 *      Author: efess
 */
#include "stdint.h"
#include "math.h"
#include "dsp.h"


// Handwrote a fft algorithm that recursively returns sub arrays, but couldn't
// had problems trying to implement an in-place version
// so I found this on the .net..

/*   fft: in-place radix-2 DIT DFT of a complex input	 */
/*																			*/
/*   input:																*/
/* n: length of FFT: must be a power of two				*/
/* m: n = 2**m													   */
/*   input/output													   */
/* x: float array of length n with real part of data	 */
/* y: float array of length n with imag part of data	*/
void dsp_fft(uint8_t m, float re[], float im[])
{
	int i, j, k, n1, n2;
	uint16_t n = 1 << m;

	float c, s, twiddle, a, t1, t2;

	j = 0; /* bit-reverse */
	n2 = n/2;
	for (i=1; i < n - 1; i++)
	{
		n1 = n2;
		while ( j >= n1 )
		{
			j = j - n1;
			n1 = n1/2;
		}
		j = j + n1;

		if (i < j)
		{
			t1 = re[i];
			re[i] = re[j];
			re[j] = t1;
			t1 = im[i];
			im[i] = im[j];
			im[j] = t1;
		}
	}

	n1 = 0; /* FFT */
	n2 = 1;

	for (i=0; i < m; i++)
	{
		n1 = n2;
		n2 = n2 + n2;
		twiddle = -6.283185307179586 / n2;
		a = 0.0;

		for (j=0; j < n1; j++)
		{
			c = cosf(a);
			s = sinf(a);
			a = a + twiddle;

			for (k=j; k < n; k=k+n2)
			{
				t1 = c * re[k+n1] - s * im[k+n1];
				t2 = s * re[k+n1] + c * im[k+n1];
				re[k+n1] = re[k] - t1;
				im[k+n1] = im[k] - t2;
				re[k] = re[k] + t1;
				im[k] = im[k] + t2;
			}
		}
	}
}
