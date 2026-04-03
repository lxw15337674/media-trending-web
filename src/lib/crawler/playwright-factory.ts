import type { LaunchOptions } from 'playwright-core';
import { chromium } from 'playwright-core';

/**
 * Options for creating a Playwright browser instance.
 */
export interface PlaywrightBrowserOptions {
  headless?: boolean;
  timeoutMs?: number;
  browserExecutablePath?: string | null;
  slowMo?: number;
}

const DEFAULT_WINDOWS_BROWSER_EXECUTABLE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const DEFAULT_DARWIN_BROWSER_EXECUTABLE_PATHS = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
] as const;
const DEFAULT_LINUX_BROWSER_EXECUTABLE_PATHS = [
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
] as const;

/**
 * Find browser executable path automatically based on OS.
 */
function findBrowserExecutablePath(customPath?: string | null): string | undefined {
  if (customPath && customPath.trim().length > 0) {
    return customPath.trim();
  }

  // Check custom path from environment first
  const envPath = process.env.BROWSER_EXECUTABLE_PATH?.trim();
  if (envPath) {
    return envPath;
  }

  const fs = require('fs');
  if (process.platform === 'win32') {
    return DEFAULT_WINDOWS_BROWSER_EXECUTABLE_PATH;
  }

  if (process.platform === 'darwin') {
    for (const path of DEFAULT_DARWIN_BROWSER_EXECUTABLE_PATHS) {
      if (fs.existsSync(path)) {
        return path;
      }
    }
  }

  if (process.platform === 'linux') {
    for (const path of DEFAULT_LINUX_BROWSER_EXECUTABLE_PATHS) {
      if (fs.existsSync(path)) {
        return path;
      }
    }
  }

  return undefined;
}

/**
 * Create a configured Playwright browser instance with sensible defaults.
 * Automatically finds browser executable based on OS if not provided.
 */
export async function createPlaywrightBrowser(
  options: PlaywrightBrowserOptions,
): Promise<ReturnType<typeof chromium.launch>> {
  const executablePath = findBrowserExecutablePath(options.browserExecutablePath);

  const launchOptions: LaunchOptions = {
    headless: options.headless ?? true,
    timeout: options.timeoutMs ?? 60_000,
    executablePath,
    slowMo: options.slowMo ?? 0,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled',
    ],
  };

  return chromium.launch(launchOptions);
}
