/**
 * Retry utility for HTTP calls with exponential backoff
 * Handles transient network errors: ECONNRESET, ECONNREFUSED, timeouts, 502/503/504
 */

export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  multiplier?: number;
  onRetry?: (attempt: number, error: Error, delayMs: number) => void;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'onRetry'>> = {
  maxAttempts: 4,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  multiplier: 2,
};

/**
 * Checks if an error is retryable (transient network/server error)
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('econnrefused') ||
      message.includes('econnreset') ||
      message.includes('fetch failed') ||
      message.includes('socket') ||
      message.includes('aborted') ||
      message.includes('502') ||
      message.includes('503') ||
      message.includes('504')
    );
  }
  return false;
}

/**
 * Checks if an HTTP response status code is retryable
 */
export function isRetryableStatus(status: number): boolean {
  return status === 502 || status === 503 || status === 504 || status === 429;
}

/**
 * Delay for a given number of milliseconds
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute a function with retry logic and exponential backoff
 *
 * @param fn - The async function to execute
 * @param options - Retry configuration options
 * @returns The result of the function
 * @throws The last error if all retries are exhausted
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | undefined;
  let delayMs = opts.initialDelayMs;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry if it's not a retryable error
      if (!isRetryableError(lastError)) {
        throw lastError;
      }

      // Don't retry if we've exhausted attempts
      if (attempt >= opts.maxAttempts) {
        throw lastError;
      }

      // Calculate delay with jitter (±10%)
      const jitter = delayMs * 0.1 * (Math.random() * 2 - 1);
      const actualDelay = Math.min(delayMs + jitter, opts.maxDelayMs);

      if (opts.onRetry) {
        opts.onRetry(attempt, lastError, actualDelay);
      }

      await delay(actualDelay);
      delayMs = Math.min(delayMs * opts.multiplier, opts.maxDelayMs);
    }
  }

  throw lastError || new Error('Retry failed');
}

/**
 * Fetch with automatic retry for transient errors
 *
 * @param url - The URL to fetch
 * @param init - Fetch options
 * @param retryOptions - Retry configuration options
 * @returns The fetch response
 */
export async function fetchWithRetry(
  url: string | URL,
  init?: RequestInit,
  retryOptions?: RetryOptions
): Promise<Response> {
  return withRetry(async () => {
    const response = await fetch(url, init);

    // Throw a retryable error for server errors
    if (isRetryableStatus(response.status)) {
      throw new Error(`HTTP ${response.status}: Server error`);
    }

    return response;
  }, retryOptions);
}
