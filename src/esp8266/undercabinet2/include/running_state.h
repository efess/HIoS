#include "osapi.h"
#include "os_type.h"
#include "user_config.h"

#define OCCUPANCY_TIMEOUT_US 15000000 // 15 seconds ( for testing)
//#define OCCUPANCY_TIMEOUT_US 180000000 // 3 minutes


typedef struct {
    uint32_t update_after_this_time;
    bool needsOptionSend;
    bool needsPalleteSend;
} State;

void state_init();
void state_update();
void handle_mqtt_update(uint8_t *reqBuffer);
void handle_mqtt_request(uint8_t *respBuffer);
