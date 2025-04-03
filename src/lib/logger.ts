/**
 * Simple logger utility for consistent logging across the application
 */

// Define colors for different log levels (for console output)
const colors = {
  info: '\x1b[36m%s\x1b[0m', // Cyan
  success: '\x1b[32m%s\x1b[0m', // Green
  warn: '\x1b[33m%s\x1b[0m', // Yellow
  error: '\x1b[31m%s\x1b[0m', // Red
  debug: '\x1b[35m%s\x1b[0m', // Magenta
};

// Logger utility with methods for different log levels
export const log = {
  info: (message: string) => {
    console.log(colors.info, `INFO: ${message}`);
  },
  
  success: (message: string) => {
    console.log(colors.success, `SUCCESS: ${message}`);
  },
  
  warn: (message: string) => {
    console.warn(colors.warn, `WARNING: ${message}`);
  },
  
  error: (message: string) => {
    console.error(colors.error, `ERROR: ${message}`);
  },
  
  debug: (message: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(colors.debug, `DEBUG: ${message}`);
    }
  },
  
  // Log an object as JSON for debugging
  json: (label: string, data: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(colors.debug, `${label}:`);
      console.log(JSON.stringify(data, null, 2));
    }
  }
}; 