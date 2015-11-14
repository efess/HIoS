#include "storage.h"
#include <avr/pgmspace.h>
#include <eeprom.h>
#include <SoftwareSerial.h> 
#include "SparkFunESP8266WiFi.h"
#include "Thermo.h"

#include <Wire.h> 
#include "LiquidCrystal_I2C.h"

LiquidCrystal_I2C lcd(0x27,20,4);
storage::storageDataStruct store;

const int READ_BUF_SIZE = 164;
char readbuf[READ_BUF_SIZE];
int count, offset, length; // common buffer vars

Thermo amp1(7,6,5), 
	amp2(7,6,4);

const uint8_t PIN_LED_RED = 10;
const uint8_t PIN_LED_GREEN = 11;
const uint8_t PIN_LED_BLUE = 12;

const uint8_t LED_STATE_NONE = 0;
const uint8_t LED_STATE_DISCONNECTED = 1;
const uint8_t LED_STATE_CONNECTED = 2;
const uint8_t LED_STATE_ACTIVITY = 3;
const uint8_t LED_STATE_SERVER_CONNECT_FAIL = 4;

//const char destServer[] = "192.168.1.91";

const char postStart[] PROGMEM  = "POST /device/smokes/event HTTP/1.1\r\n"
						"content-type:application/x-www-form-urlencoded;charset=utf-8\r\n"
						"host: ";
const char newLine[] = "\r\n";

void setup() 
{
	lcd.init(); 
    lcd.backlight();
    lcd.setCursor(0, 0);
    lcd.print("Hello");

	pinMode(PIN_LED_RED, OUTPUT);
	pinMode(PIN_LED_GREEN, OUTPUT);
	pinMode(PIN_LED_BLUE, OUTPUT);
	setLedState(LED_STATE_DISCONNECTED);

	amp1.setIsFarenheit(1);
	amp2.setIsFarenheit(1);

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

	if(connectWifi() < 0)
	{
		return;
	}

	if (Serial.available() > 0)
	{
		readUntilTerminator(5000);
		if (strcmp(readbuf, "initprovision") == 0)
		{
			printProvisionInfo();
			provisionMode();
		}
	}
	
	amp1.readTemp();
	amp2.readTemp();

	Serial.println(F("Tryin to post...."));
	postValues();

	delay(10000);
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
		memcpy_P(readbuf, progMem + offset, count);

		//Serial.write(readbuf, count);
		print->write(readbuf, count);
		
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

void postValues()
{
  // To use the ESP8266 as a TCP client, use the 
  // ESP8266Client class. First, create an object:
  ESP8266Client client;

  // ESP8266Client connect([server], [port]) is used to 
  // connect to a server (const char * or IPAddress) on
  // a specified port.
  // Returns: 1 on success, 2 on already connected,
  // negative on fail (-1=TIMEOUT, -3=FAIL).
  //IPAddress serverIP(192,168,1,91);
  // this makes the status return 0
  blinkActivity();
  int retVal = client.connect("192.168.1.91", 8080);
  if (retVal <= 0)
  {
	  setLedState(LED_STATE_SERVER_CONNECT_FAIL);
	  if(retVal == -1) 
	  {
		Serial.println(F("Failed to connect to server.  (TIMEOUT) "));
		return;
	  } else if(retVal == -3) 
	  {
		Serial.println(F("Failed to connect to server.  (GENERAL) "));
		return;
	  } else{
		Serial.print(F("Failed to connect to server.  "));
		Serial.println(retVal);
		return;
	  }
  } else 
  {
		Serial.println(F("Connected to server."));
  }
  
  Serial.println(F("Sending HTTP request."));
  short fanstate = 1;
  
	char temp_one[10];
	char temp_two[10];
  char ipStr[17];
  char lenStr[3];
  blinkActivity();

  IPAddress thisIp = esp8266.localIP();
  sprintf(ipStr, "%d.%d.%d.%d", thisIp[0], thisIp[1], thisIp[2], thisIp[3]);

  dtostrf(amp2.externalTemp, 7, 2, temp_two);

  dtostrf(amp1.externalTemp, 7, 2, temp_one);

  lcd_print_temps(temp_one, temp_two);

  writeProgmem(postStart, &client);

  Serial.println(temp_one);
  Serial.println(temp_two);
  sprintf(readbuf, "id=%s&temp1=%s&temp2=%s&fanstate=%d", store.id, temp_one, temp_two, fanstate);
  Serial.println(readbuf);
  length = strlen(readbuf);
  sprintf(lenStr, "%d", length);

  client.write(ipStr);
  client.write(newLine);
  client.write("content-length:");
  client.write(lenStr);

  client.write(newLine);
  client.write(newLine);

  client.write(readbuf);

  client.write(newLine);
  client.flush();
  blinkActivity();
  //client.print("GET /device/smokes/test HTTP/1.1\r\n");
  //client.print("Host: localhost:8080\r\n\r\n");
  //client.print("Connection: keep-alive\r\n\");


  // print and write can be used to send data to a connected
  // client connection.

  // available() will return the number of characters
  // currently in the receive buffer.
  while (client.available())
    Serial.write(client.read()); // read() gets the FIFO char
  
  // connected() is a boolean return value - 1 if the 
  // connection is active, 0 if it's closed.

	if (client.connected())
		client.stop(); // stop() closes a TCP connection.
  blinkActivity();
  setLedState(LED_STATE_CONNECTED);
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
			setLedState(LED_STATE_DISCONNECTED);
			return retVal;
		}
		Serial.println(F("Connected"));
	}
	setLedState(LED_STATE_CONNECTED);

	return 0;
}

void blinkActivity()
{
	digitalWrite(PIN_LED_BLUE, LOW);
	digitalWrite(PIN_LED_GREEN, LOW);
	digitalWrite(PIN_LED_RED, LOW);
	delay(100);
	digitalWrite(PIN_LED_GREEN, HIGH);
}

void setLedState(uint8_t state)
{
	digitalWrite(PIN_LED_BLUE, LOW);
	digitalWrite(PIN_LED_GREEN, LOW);
	digitalWrite(PIN_LED_RED, LOW);
	switch(state)
	{
		case LED_STATE_ACTIVITY:
			digitalWrite(PIN_LED_GREEN, HIGH);
			break;
		case LED_STATE_DISCONNECTED:
			digitalWrite(PIN_LED_RED, HIGH);
			break;
		case LED_STATE_CONNECTED:
			digitalWrite(PIN_LED_BLUE, HIGH);
			break;
		case LED_STATE_SERVER_CONNECT_FAIL:
			digitalWrite(PIN_LED_RED, HIGH);
			digitalWrite(PIN_LED_BLUE, HIGH);
			break;
	}
}

void lcd_print_temps(const char* temp1, const char* temp2)
{
	lcd.clear();
	lcd.setCursor(0, 0); 
	lcd.print("Outside: ");
	lcd.print(temp1);
	lcd.print((char)223);
	lcd.print("F");

	lcd.setCursor(0, 1); 
	lcd.print("Inside:  ");
	lcd.print(temp2);
	lcd.print((char)223);
	lcd.print("F");
}
