#include "arduino.h"

#pragma once
class Thermo
{
	enum tempScale {
		CELSIUS = 0,
		FARENHEIT = 1
	};
public:

	Thermo(uint8_t clockPin, uint8_t dataPin, uint8_t chipSelectPin);
	int readTemp();
	void setIsFarenheit(bool);
	float externalTemp;
	float internalTemp;
private:
	const unsigned int clockDelayuS = 1;
	uint8_t clock;
	uint8_t dataOut;
	uint8_t chipSelect;

	bool _isFarenheit;

	float convertFarenheit(float celsius);
};

