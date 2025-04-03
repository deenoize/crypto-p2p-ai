import fs from 'fs';
import path from 'path';

// Define log file path
const LOG_FILE_PATH = path.join(process.cwd(), 'okx-api-debug.log');

// Clear log file on startup
export function clearLogFile() {
  try {
    fs.writeFileSync(LOG_FILE_PATH, '', 'utf-8');
    console.log(`Cleared debug log file at ${LOG_FILE_PATH}`);
  } catch (error) {
    console.error(`Failed to clear debug log file: ${(error as Error).message}`);
  }
}

// Log debug information to file
export function logDebug(message: string, data?: any) {
  try {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}${data ? '\n' + JSON.stringify(data, null, 2) : ''}\n`;
    
    fs.appendFileSync(LOG_FILE_PATH, logEntry, 'utf-8');
  } catch (error) {
    console.error(`Failed to write to debug log file: ${(error as Error).message}`);
  }
}

// Function to fetch the debug log content
export function getDebugLogs() {
  try {
    if (fs.existsSync(LOG_FILE_PATH)) {
      return fs.readFileSync(LOG_FILE_PATH, 'utf-8');
    }
    return 'No debug logs available';
  } catch (error) {
    return `Error reading debug logs: ${(error as Error).message}`;
  }
}

// Initialize log file
clearLogFile(); 