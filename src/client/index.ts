/**
 * Browser client entry point — auto-initializes devtools overlay
 * Injected by pulsar-vite-plugin in dev mode
 */

import { initPulsarDevtools } from './overlay.js';

// Auto-init on script load
initPulsarDevtools();
