#include "Thermo.h"

Thermo::Thermo(uint8_t clockPin, uint8_t dataPin, uint8_t chipSelectPin)
{
	clock = clockPin;
	dataOut = dataPin;
	chipSelect = chipSelectPin;

	pinMode(clock, OUTPUT);
	pinMode(dataOut, INPUT);
	pinMode(chipSelect, OUTPUT);

	// disable chip immediately
	digitalWrite(chipSelect, HIGH);
}
void Thermo::setIsFarenheit(bool isFarenheit)
{
	_isFarenheit = isFarenheit;
}

float Thermo::convertFarenheit(float celsius)
{
	return (celsius * 1.8) + 32;
}

// read data
int Thermo::readTemp()
{
	int ret;
	// do chip select routine
	digitalWrite(clock, LOW);
	digitalWrite(chipSelect, LOW);
	delayMicroseconds(clockDelayuS);

	long data = 0L;
	for (short i = 31; i >= 0; i--)
	{
		digitalWrite(clock, HIGH);
		data <<= 1;
		data += digitalRead(dataOut);

		delayMicroseconds(clockDelayuS);
		digitalWrite(clock, LOW);
		delayMicroseconds(clockDelayuS);
	}

	digitalWrite(chipSelect, HIGH);
	
    ret = data & 0x0007;
    data >>= 4;

    // process internal bit 4-15
	internalTemp = (data & 0x07FF) * 0.0625;
    if (data & 0x0800)
    {
        internalTemp = -128 + internalTemp;  // fix neg temp
    }
    data >>= 14;

    // process temperature bit 18-31
    externalTemp = (data & 0x1FFF) * 0.25;
    if (data & 0x2000) // negative flag
    {
        externalTemp = -2048 + externalTemp;  // fix neg temp
    }

	if(_isFarenheit)
	{
		internalTemp = convertFarenheit(internalTemp);
		externalTemp = convertFarenheit(externalTemp);
	}

	return ret;
}
