#include "storage.h"
#include <avr/pgmspace.h>
#include <EEPROM.h>
#include <SoftwareSerial.h> 
#include "SparkFunESP8266WiFi.h"
#include "Thermo.h"

#include <Wire.h> 
#include "LiquidCrystal_I2C.h"

#define SOFT_SERIAL_TX			2  // Arduino TX pin to ESP RX
#define SOFT_SERIAL_RX			3  // Arduino RX pin from ESP TX

#define THERMO_CLK 4
#define THERMO_DATA 5
#define TEMP1_SELECT 6
#define TEMP2_SELECT 7
#define FAN_PWM 9

#define LCD_TEMP_TEST_MODE 0
#define FAN_TEST_MODE 0
#define BUFFER_SIZE 164

extern unsigned int __bss_end;
extern unsigned int __heap_start;
extern void *__brkval;

LiquidCrystal_I2C lcd(0x27,20,4);
storage::storageDataStruct store;

char buffer[BUFFER_SIZE];
int count, offset, length; // common buffer vars

Thermo	amp_smoker(THERMO_CLK, THERMO_DATA, TEMP1_SELECT), 
		amp_meat(THERMO_CLK, THERMO_DATA, TEMP2_SELECT);

const uint8_t PIN_LED_RED = 10;
const uint8_t PIN_LED_GREEN = 11;
const uint8_t PIN_LED_BLUE = 12;

const uint8_t LED_STATE_NONE = 0;
const uint8_t LED_STATE_DISCONNECTED = 1;
const uint8_t LED_STATE_CONNECTED = 2;
const uint8_t LED_STATE_ACTIVITY = 3;
const uint8_t LED_STATE_SERVER_CONNECT_FAIL = 4;

//const char destServer[] = "192.168.1.91";
const char clear_lcd_row[] PROGMEM = "                    ";
const char postHeaders[] PROGMEM = "POST /device/smokes/event HTTP/1.1\r\n"
						"content-type:application/x-www-form-urlencoded;charset=utf-8\r\n"
						"host: %s\r\ncontent-length: %d\r\n\r\n";
//const char postHeaderVals[] PROGMEM = "%s\r\ncontent-length: %d";
const char postBody[] PROGMEM = "id=%s&grill=%s&meat=%s&fanstate=%d\r\n";

const char newLine[] = "\r\n";

int fan_speeds[5] = {0, 70, 120, 190, 255};
int fan_index;
int target_smoker_temp = 230;
int target_meat_temp = 180;

float temp_average_smoker;
float temp_average_meat;
char temp_smoker[7];
char temp_meat[7];

#define TEMP_AVERAGE_COUNT 5

void setup() 
{
	pinMode(FAN_PWM, OUTPUT);
	analogWrite(FAN_PWM, 0);

	lcd.init(); 
    lcd.backlight();
    lcd.setCursor(0, 1);
    lcd.print(F("   Smoker Stoker"));
    lcd.setCursor(0, 2);
    lcd.print(F("   Starting...  "));

	amp_smoker.setIsFarenheit(1);
	amp_meat.setIsFarenheit(1);

	Serial.begin(9600);

	loadStore();
	
    lcd.setCursor(0, 2);
    lcd.print(F("   Init Wifi...  "));
	initWifi();	

	if (strlen(store.id) == 0 || strlen(store.wifiSSID) == 0)
	{
		lcd.setCursor(0, 2);
		lcd.print(F("No setup found -  "));
		lcd.setCursor(0, 3);
		lcd.print(F("Waiting for provision..."));
		Serial.println(F("No setup found, entering provision mode. "));	
		provisionMode();
	}
    lcd.setCursor(0, 2);
    lcd.print(F("   Connecting to"));
    lcd.setCursor(0, 3);
	lcd.print(store.wifiSSID);
	
	connectWifi();
	Serial.println(store.wifiSSID);
	
	Serial.println(store.wifiPassword);

	lcd.clear();
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

void loop()
{
	if(LCD_TEMP_TEST_MODE)
	{
		/*amp_smoker.readTemp();
		amp_meat.readTemp();
		char temp_smoker[6];
		char temp_meat[6];

		dtostrf(amp_meat.externalTemp, 6, 2, temp_meat);

		dtostrf(amp_smoker.externalTemp, 6, 2, temp_smoker);
		lcd_print_temps(temp_smoker, temp_meat);
		delay(500);
		return;*/
	} 
	else if(FAN_TEST_MODE)
	{
		/*fan_index++;
		fan_index = fan_index % 5;

		analogWrite(FAN_PWM, fan_speeds[fan_index]);
		
		char fan_status[16];
		sprintf(fan_status, "fan speed: %d", fan_speeds[fan_index]);

		lcd.setCursor(0, 0); 
		lcd.print(fan_status);

		delay(3000);

		return;*/
	}

	if(connectWifi() < 0)
	{
		return;
	}
	if (Serial.available() > 0)
	{
		readUntilTerminator(5000);
		if (strcmp(buffer, "initprovision") == 0)
		{
			printProvisionInfo();
			provisionMode();
		}
	}

	// read 5 times, than post mean
	readTemps();

	getTempValue(temp_average_meat, temp_meat);
	getTempValue(temp_average_smoker, temp_smoker);

	Serial.print(F("avg smoker: "));
	Serial.println(temp_smoker);
	Serial.print(F("avg meat: "));
	Serial.println(temp_meat);

	
	Serial.println(F("Adjust fan"));
	adjustFan();

	lcd_print_values();

	Serial.println(F("Posting to server"));
	postValues();
	
	Serial.print(F("Free Memory: "));
	Serial.println(freeMemory());
	Serial.println(F("--------------------"));
}

int freeMemory()
{
  int free_memory;

  if((int)__brkval == 0)
     free_memory = ((int)&free_memory) - ((int)&__bss_end);
  else
    free_memory = ((int)&free_memory) - ((int)__brkval);

  return free_memory;
}
void writeProgmem(
	const char *progMem, 
	Print* print)
{
	length = strlen_P(progMem);
	offset = 0;
	while(offset < length)
	{
		count = min(length - offset, 128); //postLen - 128;
		memcpy_P(buffer, progMem + offset, count);

		//Serial.write(readbuf, count);
		print->write(buffer, count);
		
		offset = offset + count;
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
			buffer[index++] = Serial.read();
			if (index > 1 && buffer[index - 1] == 10 && buffer[index - 2] == 13)
			{
				break;
			}
		}
	}

	return index;
}

void provisionMode()
{
	//int readBytes = 0;
	//while (true) 
	//{
	//	clearBuffer();

	//	while (!Serial.available())
	//		;
	//	readBytes = readUntilTerminator(5000);

	//	if (strcmp(buffer, "initprovision") == 0)
	//	{
	//		printProvisionInfo();
	//	}
	//	else if (strcmp(buffer, "exitprovision") == 0)
	//	{
	//		if (strlen(store.id) == 0 || strlen(store.wifiSSID) == 0)
	//		{
	//			Serial.println(F("Can't exit provision - missing setup requierd"));
	//		}
	//		else
	//		{
	//			return;
	//		}
	//	}
	//	else if (strcmp(buffer, "provision") == 0)
	//	{
	//		clearBuffer();
	//		readBytes = readUntilTerminator(5000);

	//		if (readBytes == 164)
	//		{
	//			/* skip control (2 bytes) */
	//			memcpy(&store, buffer, sizeof(store) - 2);

	//			if (strlen(store.wifiSSID) == 0) {
	//				Serial.println(F("missing-req SSID"));
	//			}
	//			else if (strlen(store.id) == 0) {
	//				Serial.println(F("missing-req ID"));
	//			}
	//			else {
	//				store.control[0] = 'O';
	//				store.control[1] = 'K';

	//				EEPROM.put(0, store);
	//				Serial.println(F("done"));
	//			}
	//		}
	//		else 
	//		{
	//			Serial.println(F("Invalid payload size"));
	//			Serial.print(F("Read bytes: "));
	//			Serial.println(readBytes);
	//		}

	//	}
	//}
}

void clearBuffer()
{
	memset(buffer, '\0', BUFFER_SIZE);
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

void getTempValue(float value, char* buffer)
{
	if(!tempWithinRange(value))
	{
		sprintf(buffer, "   ---");
	} 
	else 
	{
		dtostrf(value, 6, 2, buffer);
	}
}

void parseValues()
{
	char* strLocation;
	char value[5];
	int intValue;

	if(!strstr(buffer, "smokes_update:")){
		Serial.println(F("No update found in response"));
		return;
	}
	if(strLocation = strstr(buffer, "grill:"))
	{
		strLocation += 6;
		if(strLocation && (strLocation + 5))
		{
			strncpy(value,strLocation,5);
			target_smoker_temp = atoi(value);
		}
	}
	if(strLocation = strstr(buffer, "meat:"))
	{
		strLocation += 5;
		if(strLocation && (strLocation + 5))
		{
			strncpy(value,strLocation,5);
			target_meat_temp = atoi(value);
		}
	}
}

void readTemps()
{
	float temp_total_smoker = 0;
	float temp_total_meat = 0;

	// sample TEMP_AVERAGE_COUNT and average
	for(offset = 0; offset < TEMP_AVERAGE_COUNT; offset++)
	{
		amp_smoker.readTemp();
		amp_meat.readTemp();

		temp_total_smoker += amp_smoker.externalTemp;
		temp_total_meat += amp_meat.externalTemp;

		getTempValue(amp_smoker.externalTemp, temp_smoker);
		Serial.print(F("smoker: "));
		Serial.print(temp_smoker);
		Serial.print(F(" board: "));
		getTempValue(amp_smoker.internalTemp, temp_smoker);
		Serial.println(temp_smoker);
		
		getTempValue(amp_meat.externalTemp, temp_meat);
		Serial.print(F("meat: "));
		Serial.print(temp_meat);
		Serial.print(F(" board: "));
		getTempValue(amp_meat.internalTemp, temp_meat);
		Serial.println(temp_meat);

		delay(500);
	}

	temp_average_meat = temp_total_meat / TEMP_AVERAGE_COUNT;
	temp_average_smoker = temp_total_smoker / TEMP_AVERAGE_COUNT;
}
uint8_t tempWithinRange(float temp)
{
	return temp < 999 && temp > -99;
}

void adjustFan()
{
	int difference;
	if(temp_average_smoker > target_smoker_temp)
	{
		fan_index = 0;
	}
	else 
	{
		// Fan ON
		difference = target_smoker_temp - temp_average_smoker;
		if(difference < 2)
		{
			fan_index = 1;
		} 
		else if(difference < 3)
		{
			fan_index = 2;
		}
		else if(difference < 7)
		{
			fan_index = 3;
		}
		else
		{
			fan_index = 4;
		}
	}

	analogWrite(FAN_PWM, fan_speeds[fan_index]);
}

void postValues()
{
	// closing any connections that still persist
	esp8266.close(5);
	
	ESP8266Client client;
	char strBuf[20];
	int bodyLen = 0;
	int retVal = client.connect("192.168.1.91", 8080);
	if (retVal <= 0)
	{
		if(retVal == -1) 
		{
		Serial.println(F("Failed to connect to server.  (TIMEOUT) "));
		lcd_print_connection_status(F("Wifi Failed(TIMEOUT)"));
		return;
		} else if(retVal == -3) 
		{
		Serial.println(F("Failed to connect to server.  (GENERAL) "));
		lcd_print_connection_status(F("Wifi Failed(GENERAL)"));
		return;
		} else{
		Serial.print(F("Failed to connect to server.  "));
		lcd_print_connection_status(F("Wifi Failed(?)"));
		// close all connections.
		esp8266.close(5);

		Serial.println(retVal);
		return;
		}
	} else 
	{
		Serial.println(F("Connected to server."));
	}

	sprintf(strBuf, "Wifi %.14s", store.wifiSSID);
	lcd_print_connection_status(strBuf);

	Serial.println(F("Sending HTTP request."));  

	IPAddress thisIp = esp8266.localIP();
	sprintf(strBuf, "%d.%d.%d.%d", thisIp[0], thisIp[1], thisIp[2], thisIp[3]);
	//writeProgmem(postStart, &client);
	
	// we have to do this twice so we can reuse the buffer
	// once to get the length,and another to actually post it....
	sprintf_P(buffer, postBody, store.id, temp_smoker, temp_meat, fan_index);
	bodyLen = strlen(buffer) - 2; 

	sprintf_P(buffer, postHeaders, strBuf, bodyLen);
	client.write(buffer);

	sprintf_P(buffer, postBody, store.id, temp_smoker, temp_meat, fan_index);
	client.write(buffer);

	//int timeout = 2000;
	//unsigned long timeIn = millis();

	//while (timeIn + timeout > millis()) {
	//	while (client.available()){
	//		char c;
	//		c = client.read();
	//		Serial.print(c);
	//	}
	//}

	clearBuffer();
	
	offset = 0;
	while (client.available()){
		buffer[offset++] = client.read();
		if(offset >= BUFFER_SIZE){
			Serial.println(F("read overflowing buffer!!"));
			offset = 0;
		}
	}
	Serial.print(F("Read buffer: "));
	Serial.println(buffer);
	Serial.println(F("End read buffer"));

	parseValues();
	//
	if (client.connected())
		client.stop(); // stop() closes a TCP connection.
}

void initWifi() 
{
	Serial.println(F("try to load Wifi...."));
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
		Serial.println(F("Mode set to station"));
	}

	// esp8266.status() indicates the ESP8266's WiFi connect
	// status.
	// A return value of 1 indicates the device is already
	// connected. 0 indicates disconnected. (Negative values
	// equate to communication errors.)
	retVal = esp8266.status();
	Serial.print(F("Connection status: "));
	Serial.println(retVal);
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
		Serial.println(F("Connected"));
	}

	return 0;
}

void lcd_print_values()
{
	lcd.setCursor(0, 0); 
	lcd.print(clear_lcd_row);
	lcd.setCursor(0, 0);
	lcd.print(F("Grill:"));
	lcd.print(temp_smoker);
	lcd.print((char)223);
	lcd.print(F("F T:"));
	sprintf(buffer, "%3d", target_smoker_temp);
	lcd.print(buffer);
	
	lcd.setCursor(0, 1); 
	lcd.print(clear_lcd_row);
	lcd.setCursor(0, 1);
	lcd.print(F("Meat: "));
	lcd.print(temp_meat);	
	lcd.print((char)223);
	lcd.print(F("F T:"));
	sprintf(buffer, "%3d", target_meat_temp);
	lcd.print(buffer);

	lcd.setCursor(0, 2); 
	lcd.print(F("Fan speed: "));
	lcd.print(fan_index);
}

void lcd_print_connection_status(const char* status)
{
	lcd.setCursor(0, 3); 
	lcd.print(clear_lcd_row);
	lcd.setCursor(0, 3); 
	lcd.print(status);
}
void lcd_print_connection_status(const __FlashStringHelper *status)
{
	lcd.setCursor(0, 3);
	lcd.print(clear_lcd_row);
	lcd.setCursor(0, 3);
	lcd.print(status);
}
