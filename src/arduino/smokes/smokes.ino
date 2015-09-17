#include "storage.h"
#include <eeprom.h>
#include <SoftwareSerial.h> 
#include <SparkFunESP8266WiFi.h>

storage::storageDataStruct store;
const int READ_BUF_SIZE = 164;
char readbuf[READ_BUF_SIZE];

void setup() 
{
	Serial.begin(9600);
	loadStore();
	initWifi();

	if (strlen(store.id) == 0 || strlen(store.wifiSSID) == 0)
	{
		provisionMode();
	}

	connectWifi();
}

void printProvisionInfo() 
{
	Serial.println(F("provisioninfo"));	
	Serial.println(store.id);
	Serial.println(F("smokes"));
	Serial.println(store.wifiSSID);
	Serial.println(F("aplist"));

	printAPList();

	Serial.println(F("done"));

}
void loop(){
	// read sensors
	// upload values

	// check for serial
	
	if (Serial.available() > 0)
	{
		readUntilTerminator(5000);
		if (strcmp(readbuf, "initprovision") == 0)
		{
			printProvisionInfo();
			provisionMode();
		}
	}
}

void loadStore() 
{
	EEPROM.get(0, store);
	if (store.control[0] != 'O' || store.control[1] != 'K') {
		Serial.println(F("initializing store"));
		memset(&store, '\0', sizeof(store));
	}
}

int readUntilTerminator(unsigned int timeout) {
	int index = 0;
	unsigned long timeIn = millis();

	while (timeIn + timeout > millis())
	{
		if (Serial.available() > 0) 
		{
			readbuf[index++] = Serial.read();
			if (index > 1 && readbuf[index - 1] == 10 && readbuf[index - 2] == 13)
			{
				break;
			}
		}
	}

	return index;
}

void setupID() 
{

}

void provisionMode()
{
	int readBytes = 0;
	while (true) 
	{
		clearReadBuf();

		while (!Serial.available())
			;
		readBytes = readUntilTerminator(5000);

		if (strcmp(readbuf, "initprovision") == 0)
		{
			printProvisionInfo();
		}
		else if (strcmp(readbuf, "exitprovision") == 0)
		{
			if (strlen(store.id) == 0 || strlen(store.wifiSSID) == 0)
			{
				Serial.println(F("Can't exit provision - missing setup requierd"));
			}
			else
			{
				return;
			}
		}
		else if (strcmp(readbuf, "provision") == 0)
		{
			clearReadBuf();
			readBytes = readUntilTerminator(5000);

			if (readBytes == 164)
			{
				/* skip control (2 bytes) */
				memcpy(&store, readbuf, sizeof(store) - 2);

				if (strlen(store.wifiSSID) == 0) {
					Serial.println(F("missing-req SSID"));
				}
				else if (strlen(store.id) == 0) {
					Serial.println(F("missing-req ID"));
				}
				else {
					store.control[0] = 'O';
					store.control[1] = 'K';

					EEPROM.put(0, store);
					Serial.println(F("done"));
				}
			}
			else 
			{
				Serial.println(F("Invalid payload size"));
				Serial.print(F("Read bytes: "));
				Serial.println(readBytes);
			}

		}
	}
}

void clearReadBuf()
{
	memset(readbuf, '\0', READ_BUF_SIZE);
}


void printAPList() 
{
	unsigned long startTime = millis();
	char command[] = "AT+CWLAP\r\n";
	char c;

	for (int i = 0; i < 10; i++)
	{
		esp8266.write(command[i]);
	}

	while (startTime + 5000 > millis())
	{
		if (esp8266.available())
		{
			c = esp8266.read();
			Serial.print(c);
		}
	}
}

void initWifi() 
{
	while(!esp8266.begin(9600))
	{
		Serial.println(F("Error talking to ESP8266. Trying again in 5 seconds."));
		delay(5000);
	}
	Serial.println(F("ESP8266 init"));
}

int connectWifi() 
{
	int retVal = esp8266.getMode();
	if (retVal != ESP8266_MODE_STA)
	{ 
		retVal = esp8266.setMode(ESP8266_MODE_STA);
		if (retVal < 0)
		{
			Serial.println(F("Error setting mode."));
			return retVal;
		}
	}
	Serial.println(F("Mode set to station"));

	// esp8266.status() indicates the ESP8266's WiFi connect
	// status.
	// A return value of 1 indicates the device is already
	// connected. 0 indicates disconnected. (Negative values
	// equate to communication errors.)
	retVal = esp8266.status();
	if (retVal <= 0)
	{
		Serial.print(F("Connecting to "));
		Serial.println(store.wifiSSID);

		retVal = esp8266.connect(store.wifiSSID, store.wifiPassword);
		if (retVal < 0)
		{
			if (retVal == -1) {
				Serial.println(F("Timeout trying to connect to network"));
			}
			else if (retVal == -3) {
				Serial.println(F("Cant connect to network"));
			}
			return retVal;
		}
	}

	Serial.print(F("Connected"));
	return 0;
}
