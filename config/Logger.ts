/**
 * Centralized logging utility with enable/disable configuration
 */

// Enable/Disable logging here
const LOGGING_ENABLED = true;

// Log levels
export enum LogLevel {
  INFO = '🔵',
  SUCCESS = '🟢',
  WARNING = '🟡',
  ERROR = '🔴',
  DEBUG = '⚪',
}

class Logger {
  private enabled: boolean = LOGGING_ENABLED;

  /**
   * Enable or disable all logging
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  /**
   * Check if logging is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Log info message
   */
  info(category: string, message: string, data?: any) {
    if (!this.enabled) return;
    console.log(`${LogLevel.INFO} [${category}] ${message}`, data || '');
  }

  /**
   * Log success message
   */
  success(category: string, message: string, data?: any) {
    if (!this.enabled) return;
    console.log(`${LogLevel.SUCCESS} [${category}] ${message}`, data || '');
  }

  /**
   * Log warning message
   */
  warning(category: string, message: string, data?: any) {
    if (!this.enabled) return;
    console.warn(`${LogLevel.WARNING} [${category}] ${message}`, data || '');
  }

  /**
   * Log error message
   */
  error(category: string, message: string, error?: any) {
    if (!this.enabled) return;
    console.error(`${LogLevel.ERROR} [${category}] ${message}`, error || '');
  }

  /**
   * Log debug message
   */
  debug(category: string, message: string, data?: any) {
    if (!this.enabled) return;
    console.log(`${LogLevel.DEBUG} [${category}] ${message}`, data || '');
  }

  /**
   * Log HTTP request
   */
  request(url: string, method: string, body?: any) {
    if (!this.enabled) return;
    console.log(`${LogLevel.INFO} [HTTP] ${method} ${url}`);
    if (body) {
      console.log(`${LogLevel.DEBUG} [HTTP] Request Body:`, JSON.stringify(body, null, 2));
    }
  }

  /**
   * Log HTTP response
   */
  response(url: string, status: number, data?: any) {
    if (!this.enabled) return;
    const level = status >= 200 && status < 300 ? LogLevel.SUCCESS : LogLevel.ERROR;
    console.log(`${level} [HTTP] ${status} ${url}`);
    if (data) {
      console.log(`${LogLevel.DEBUG} [HTTP] Response:`, typeof data === 'string' ? data : JSON.stringify(data, null, 2));
    }
  }
}

// Export singleton instance
export default new Logger();
