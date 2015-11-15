#include "os_type.h"

#define READ_BUF_SIZE 256

typedef struct {
    uint8_t wifiSSID[33];
    uint8_t wifiPassword[64];
    uint8_t id[16];
    uint8_t host[16];
    uint16_t port;
} PROVISION_CONFIG;


int ICACHE_FLASH_ATTR provision_check_for_command(void);
void ICACHE_FLASH_ATTR provision_checkUart(void *args);
