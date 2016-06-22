#ifndef DISPLAY
#define DISPLAY

#include "state.h"
#include "util.h"

#define DISPLAY_CLEAR_ROW  "                    "
void ICACHE_FLASH_ATTR display_show_loading();

void ICACHE_FLASH_ATTR display_show_normal_state(State* state);

#endif // DISPLAY
