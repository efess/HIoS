
#ifndef _STORAGE_h
#define _STORAGE_h

#if defined(ARDUINO) && ARDUINO >= 100
#include "arduino.h"
#include <eeprom.h>
#else
#include "WProgram.h"
#endif

class storage {
public:
	struct storageDataStruct {
		char wifiSSID[33];
		char wifiPassword[64];
		char id[65];
		char control[2];
	};

	static void storage_getData(struct storageDataStruct);
	static void storage_storeData(struct storageDataStruct);
};
	
#endif