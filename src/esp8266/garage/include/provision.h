#include "os_type.h"

typedef struct {
    uint8_t wifiSSID[33];
    uint8_t wifiPassword[64];
    uint8_t id[16];
    uint8_t host[16];
    uint16_t port;
} PROVISION_CONFIG;

PROVISION_CONFIG provisionCfg;

int provision_check_for_command(void);
ETSTimer provisionTimer;
void provision_checkUart(void *args);
