import { config as loadEnv } from 'dotenv';

let envLoaded = false;

export function loadScriptEnv() {
  if (envLoaded) return;

  loadEnv({ path: '.env' });
  loadEnv({ path: '.env.local', override: true });
  loadEnv({ path: '.dev.vars', override: true });
  envLoaded = true;
}
