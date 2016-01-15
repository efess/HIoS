#include <avr/pgmspace.h>
#include "SparkFunESP8266WiFi.h"
#include "SparkFunESP8266Client.h"
#include "PubSubClient.h"
#include <eeprom.h>
#include <SoftwareSerial.h> 

#define ESP8266_SW_RX	2
#define ESP8266_SW_TX	3

#define ESP_BRIDGE 0

char ssid[] = "Asus_Joes";
char password[] = "fuckingshit";
uint8_t mqqtHost[] = {192, 168, 1, 91};
char buffer[128];
ESP8266Client client;
PubSubClient pubSub(mqqtHost, (uint16_t)1880, mqttPublished, client);

void setup()
{
	Serial.begin(9600);
	if(!ESP_BRIDGE)
	{
		initWifi();
	}
	else 
	{
	}

	delay(5000);
}

void loop()
{
	if(ESP_BRIDGE)
	{
		mirror();
		return;
	}

	if(connectWifi() < 0)
	{
		Serial.println("Failed to connect to AP");
		delay(1000);
		return;
	}
	if(!pubSub.connected())
	{
		if(!pubSub.connect("smokes"))
		{
			Serial.println("Failed to connect to MQTT broker");
			delay(1000);
			return;
		}
		else 
		{
			pubSub.subscribe("/home/smokes/change");
		}
	}
	if(!pubSub.publish("/home/smokes/update", "23:2523"))
	{
		Serial.println("Failed to connect to publish message");
		delay(1000);
		return;
	}
  	/*	memset(buffer, '\0', 128);

		swSerial.write("AT\r\n");

		delay(200);

		readUntilTerminator(1000);
	
		Serial.println("Buffer:");
		Serial.print(buffer);

		de*/
}
void mqttPublished(char* topic,uint8_t* payload,unsigned int length)
{
	Serial.print("Received topic: ");
	Serial.println(topic);
	Serial.println();
	Serial.print("Received payload: ");
	Serial.println((char*)payload);
}

void mirror()
{
  char c;

  if (Serial.available()) {
    c = Serial.read();
	esp8266.print(c);
  }
  if (esp8266.available()) {
    c = esp8266.read();
    Serial.print(c);
  }
}
int connectToServer()
{
  // ESP8266Client connect([server], [port]) is used to 
  // connect to a server (const char * or IPAddress) on
  // a specified port.
  // Returns: 1 on success, 2 on already connected,
  // negative on fail (-1=TIMEOUT, -3=FAIL).
  //IPAddress serverIP(192,168,1,91);
  // this makes the status return 0
  int retVal = client.connect("192.168.1.91", 1880);
  if (retVal <= 0)
  {
	  if(retVal == -1) 
	  {
		Serial.println(F("Failed to connect to server.  (TIMEOUT) "));
	  } else if(retVal == -3) 
	  {
		Serial.println(F("Failed to connect to server.  (GENERAL) "));
	  } else{
		Serial.print(F("Failed to connect to server.  "));
		Serial.println(retVal);
	  }
	return false;
  } else 
  {
		Serial.println(F("Connected to server."));
  }
  return true;
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
		Serial.println(ssid);

		retVal = esp8266.connect(ssid, password);
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
