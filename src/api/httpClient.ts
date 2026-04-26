import { z, type ZodType } from 'zod';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type RequestOptions<TSchema extends ZodType> = {
  body?: unknown;
  headers?: Record<string, string>;
  method?: HttpMethod;
  retries?: number;
  retryDelayMs?: number;
  schema: TSchema;
  signal?: AbortSignal;
  timeoutMs?: number;
};

type ResolvedRequestOptions<TSchema extends ZodType> = {
  body: unknown;
  headers: Record<string, string> | undefined;
  method: HttpMethod;
  retries: number;
  retryDelayMs: number;
  schema: TSchema;
  signal: AbortSignal | undefined;
  timeoutMs: number;
  url: string;
};

type ExecutableRequestOptions<TSchema extends ZodType> = Omit<
  ResolvedRequestOptions<TSchema>,
  'retries' | 'retryDelayMs'
>;

const DEFAULT_HEADERS = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
};

const DEFAULT_RETRIES = 2;
const DEFAULT_RETRY_DELAY_MS = 300;
const DEFAULT_TIMEOUT_MS = 8_000;
const inFlightRequests = new Map<string, Promise<unknown>>();

export class ApiError extends Error {
  readonly status: number;
  readonly url: string;

  constructor(message: string, options: { status: number; url: string }) {
    super(message);
    this.name = 'ApiError';
    this.status = options.status;
    this.url = options.url;
  }
}

export class ApiTimeoutError extends Error {
  readonly timeoutMs: number;
  readonly url: string;

  constructor(message: string, options: { timeoutMs: number; url: string }) {
    super(message);
    this.name = 'ApiTimeoutError';
    this.timeoutMs = options.timeoutMs;
    this.url = options.url;
  }
}

export async function httpRequest<TSchema extends ZodType>(
  url: string,
  options: RequestOptions<TSchema>,
): Promise<z.infer<TSchema>> {
  const {
    body,
    headers,
    method = 'GET',
    retries = DEFAULT_RETRIES,
    retryDelayMs = DEFAULT_RETRY_DELAY_MS,
    schema,
    signal,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  } = options;

  const requestKey = getRequestKey(url, method, body, headers);

  if (method === 'GET') {
    const existingRequest = inFlightRequests.get(requestKey);

    if (existingRequest) {
      return existingRequest as Promise<z.infer<TSchema>>;
    }
  }

  const requestPromise = executeWithRetry({
    body,
    headers,
    method,
    retries,
    retryDelayMs,
    schema,
    signal,
    timeoutMs,
    url,
  });

  if (method === 'GET') {
    inFlightRequests.set(requestKey, requestPromise);
  }

  try {
    return await requestPromise;
  } finally {
    if (method === 'GET') {
      inFlightRequests.delete(requestKey);
    }
  }
}

async function executeWithRetry<TSchema extends ZodType>(
  options: ResolvedRequestOptions<TSchema>,
): Promise<z.infer<TSchema>> {
  const {
    body,
    headers,
    method,
    retries,
    retryDelayMs,
    schema,
    signal,
    timeoutMs,
    url,
  } = options;

  let attempt = 0;

  while (true) {
    try {
      return await executeRequest({
        body,
        headers,
        method,
        schema,
        signal,
        timeoutMs,
        url,
      });
    } catch (error) {
      if (attempt >= retries || !isRetryableError(error)) {
        throw error;
      }

      const delayMs = retryDelayMs * 2 ** attempt;
      attempt += 1;
      await wait(delayMs);
    }
  }
}

async function executeRequest<TSchema extends ZodType>(
  options: ExecutableRequestOptions<TSchema>,
): Promise<z.infer<TSchema>> {
  const { body, headers, method, schema, signal, timeoutMs, url } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const abortHandler = () => controller.abort();

  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener('abort', abortHandler);
    }
  }

  try {
    const response = await fetch(url, {
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        ...DEFAULT_HEADERS,
        ...headers,
      },
      method,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new ApiError(`Request failed with status ${response.status}`, {
        status: response.status,
        url,
      });
    }

    const json = await response.json();
    return schema.parse(json);
  } catch (error) {
    if (controller.signal.aborted && !signal?.aborted) {
      throw new ApiTimeoutError(`Request timed out after ${timeoutMs}ms`, {
        timeoutMs,
        url,
      });
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);

    if (signal) {
      signal.removeEventListener('abort', abortHandler);
    }
  }
}

function getRequestKey(
  url: string,
  method: HttpMethod,
  body?: unknown,
  headers?: Record<string, string>,
): string {
  return JSON.stringify({
    body: body ?? null,
    headers: headers ?? null,
    method,
    url,
  });
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof ApiTimeoutError) {
    return true;
  }

  if (error instanceof ApiError) {
    return error.status >= 500 || error.status === 429;
  }

  return error instanceof Error;
}

function wait(delayMs: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, delayMs);
  });
}
