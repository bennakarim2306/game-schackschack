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
   * Get formatted timestamp
   */
  private getTimestamp(): string {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const ms = now.getMilliseconds().toString().padStart(3, '0');
    return `${hours}:${minutes}:${seconds}.${ms}`;
  }

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
    console.log(`${this.getTimestamp()} ${LogLevel.INFO} [${category}] ${message}`, data || '');
  }

  /**
   * Log success message
   */
  success(category: string, message: string, data?: any) {
    if (!this.enabled) return;
    console.log(`${this.getTimestamp()} ${LogLevel.SUCCESS} [${category}] ${message}`, data || '');
  }

  /**
   * Log warning message
   */
  warning(category: string, message: string, data?: any) {
    if (!this.enabled) return;
    console.warn(`${this.getTimestamp()} ${LogLevel.WARNING} [${category}] ${message}`, data || '');
  }

  /**
   * Log error message
   */
  error(category: string, message: string, error?: any) {
    if (!this.enabled) return;
    console.error(`${this.getTimestamp()} ${LogLevel.ERROR} [${category}] ${message}`, error || '');
  }

  /**
   * Log debug message
   */
  debug(category: string, message: string, data?: any) {
    if (!this.enabled) return;
    console.log(`${this.getTimestamp()} ${LogLevel.DEBUG} [${category}] ${message}`, data || '');
  }

  /**
   * Log HTTP request
   */
  request(url: string, method: string, body?: any) {
    if (!this.enabled) return;
    console.log(`${this.getTimestamp()} ${LogLevel.INFO} [HTTP] ${method} ${url}`);
    if (body) {
      console.log(`${this.getTimestamp()} ${LogLevel.DEBUG} [HTTP] Request Body:`, JSON.stringify(body, null, 2));
    }
  }

  /**
   * Log HTTP response
   */
  response(url: string, status: number, data?: any) {
    if (!this.enabled) return;
    const level = status >= 200 && status < 300 ? LogLevel.SUCCESS : LogLevel.ERROR;
    console.log(`${this.getTimestamp()} ${level} [HTTP] ${status} ${url}`);
    if (data) {
      console.log(`${this.getTimestamp()} ${LogLevel.DEBUG} [HTTP] Response:`, typeof data === 'string' ? data : JSON.stringify(data, null, 2));
    }
  }
}

// Export singleton instance
export default new Logger();
