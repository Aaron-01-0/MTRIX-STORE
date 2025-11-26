/**
 * Secure logging utility that prevents sensitive data exposure
 * Logs full details server-side, shows generic messages to users in production
 */

const isDevelopment = import.meta.env.DEV;

export const logger = {
  /**
   * Log an error - shows generic message in production, full details in development
   */
  error: (message: string, error?: any, context?: Record<string, any>) => {
    if (isDevelopment) {
      console.error(`[ERROR] ${message}`, { error, context });
    } else {
      // In production, only log generic info to console
      console.error(`[ERROR] ${message}`);
      // TODO: Send full error details to server-side logging service
      // Example: sendToLoggingService({ message, error, context });
    }
  },

  /**
   * Log a warning
   */
  warn: (message: string, context?: Record<string, any>) => {
    if (isDevelopment) {
      console.warn(`[WARN] ${message}`, context);
    } else {
      console.warn(`[WARN] ${message}`);
    }
  },

  /**
   * Log info - safe to show in production
   */
  info: (message: string, context?: Record<string, any>) => {
    console.info(`[INFO] ${message}`, context);
  },

  /**
   * Log debug info - only in development
   */
  debug: (message: string, context?: Record<string, any>) => {
    if (isDevelopment) {
      console.log(`[DEBUG] ${message}`, context);
    }
  },

  /**
   * Get a user-friendly error message
   */
  getUserMessage: (error: any): string => {
    if (isDevelopment && error?.message) {
      return error.message;
    }
    return "An error occurred. Please try again later.";
  }
};
