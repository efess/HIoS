#include "osapi.h"
#include "os_type.h"
#include "mqtt.h"

int ICACHE_FLASH_ATTR sensors_init(MQTT_Client *mqttClient);
void ICACHE_FLASH_ATTR sensors_poll_all();
