/*
 * complex.h
 *
 *  Created on: Feb 1, 2016
 *      Author: efess
 */

#ifndef COMPLEX_H_
#define COMPLEX_H_

typedef struct {
	float im;
	float re;
} Complex;

Complex complex_add(Complex first, Complex second);
Complex complex_subtract(Complex first, Complex second);
Complex complex_multiply(Complex first, Complex second);
Complex complex_exp(Complex src);

#endif /* COMPLEX_H_ */
