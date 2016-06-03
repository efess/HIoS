#include "osapi.h"
#include "os_type.h"
#include "user_config.h"

#define OCCUPANCY_TIMEOUT_US 15000000 // 15 seconds ( for testing)
//#define OCCUPANCY_TIMEOUT_US 180000000 // 3 minutes


typedef struct {
    uint32_t update_after_this_time;
    bool needsConfigSend;
} State;

void state_init();
void state_update();
void handle_mqtt_config_update(char *reqBuffer);
void handle_mqtt_request(char **respBuffer);
