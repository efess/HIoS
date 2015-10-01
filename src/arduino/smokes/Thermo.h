#include "arduino.h"

#pragma once
class Thermo
{
const unsigned int clockDelayuS = 1;
public:
	Thermo(int clockPin, int dataPin, int chipSelectPin);
	long readTemp();
private:
	 int clock;
	 int dataOut;
	 int chipSelect;
};

