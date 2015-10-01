#include "Thermo.h"

Thermo::Thermo(int clockPin, int dataPin, int chipSelectPin)
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

// read data
long Thermo::readTemp()
{
	// do chip select routine
	digitalWrite(clock, LOW);
	digitalWrite(chipSelect, LOW);
	delayMicroseconds(clockDelayuS);

	long data = 0L;
	int thisRead;
	Serial.println(" start -----------------");
	for (short i = 0; i < 32; i++)
	{
		digitalWrite(clock, HIGH);
		data <<= 1;
		thisRead = digitalRead(data);
		data += thisRead;
		delayMicroseconds(clockDelayuS);
		digitalWrite(clock, LOW);
		delayMicroseconds(clockDelayuS);

		Serial.print(i);
		Serial.print(": ");
		Serial.println(thisRead);
	}
	Serial.println(" end -----------------");


	digitalWrite(chipSelect, HIGH);

	//if (data & 0x80000000) {
	//	// Negative value, drop the lower 18 bits and explicitly extend sign bits.
	//	data = 0xFFFFC000 | ((data >> 18) & 0x00003FFFF);
	//}
	//else {
	//	// Positive value, just drop the lower 18 bits.
	//	data >>= 18;
	//}
	////Serial.println(v, HEX);
 // 
	//double centigrade = data;

	//// LSB = 0.25 degrees C
	//centigrade *= 0.25;
	//return centigrade;

	return data;
}
