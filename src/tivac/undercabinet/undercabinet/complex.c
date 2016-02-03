/*
 * complex.c
 *
 *  Created on: Feb 1, 2016
 *      Author: efess
 */

#include "complex.h"
#include "math.h"

Complex complex_add(Complex first, Complex second)
{
	Complex cplx;
	cplx.re = first.re + second.re;
	cplx.im = first.im + second.im;
	return cplx;
}

Complex complex_subtract(Complex first, Complex second)
{
	Complex cplx;
	cplx.re = first.re - second.re;
	cplx.im = first.im - second.im;
	return cplx;
}

Complex complex_multiply(Complex first, Complex second)
{
	Complex cplx;
	float r = first.re * second.re - first.im * second.im;
	cplx.im = first.re * second.im + first.im * second.re;
	cplx.re = r;
	return cplx;
}

Complex complex_exp(Complex src)
{
	Complex cplx;
	float er = expf(src.re);
	cplx.re = er * cosf(src.im);
	cplx.im = er * sinf(src.im);
	return cplx;
}
