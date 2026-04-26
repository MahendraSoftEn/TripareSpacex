import { z } from 'zod';

import { ApiError, ApiTimeoutError, httpRequest } from '../src/api/httpClient';

const okResponse = (body: unknown) =>
  ({
    json: jest.fn().mockResolvedValue(body),
    ok: true,
    status: 200,
  }) as unknown as Response;

describe('httpRequest', () => {
  const schema = z.object({
    value: z.string(),
  });

  beforeEach(() => {
    globalThis.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('deduplicates matching in-flight get requests', async () => {
    (globalThis.fetch as jest.Mock).mockImplementation(
      () =>
        new Promise(resolve => {
          setTimeout(() => resolve(okResponse({ value: 'ok' })), 5);
        }),
    );

    const requestA = httpRequest('https://example.com/data', { schema });
    const requestB = httpRequest('https://example.com/data', { schema });

    await expect(Promise.all([requestA, requestB])).resolves.toEqual([
      { value: 'ok' },
      { value: 'ok' },
    ]);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it('retries retryable failures with exponential backoff', async () => {
    (globalThis.fetch as jest.Mock)
      .mockRejectedValueOnce(new Error('temporary failure'))
      .mockRejectedValueOnce(new Error('temporary failure'))
      .mockResolvedValueOnce(okResponse({ value: 'ok' }));

    await expect(
      httpRequest('https://example.com/data', {
        retries: 2,
        retryDelayMs: 1,
        schema,
      }),
    ).resolves.toEqual({ value: 'ok' });

    expect(globalThis.fetch).toHaveBeenCalledTimes(3);
  });

  it('throws a timeout error when the request exceeds timeoutMs', async () => {
    (globalThis.fetch as jest.Mock).mockImplementation(
      (_url: string, init?: RequestInit) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new Error('aborted'));
          });
        }),
    );

    await expect(
      httpRequest('https://example.com/data', {
        retries: 0,
        schema,
        timeoutMs: 10,
      }),
    ).rejects.toBeInstanceOf(ApiTimeoutError);
  });

  it('validates responses with zod', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValueOnce(
      okResponse({ value: 42 }),
    );

    await expect(
      httpRequest('https://example.com/data', {
        retries: 0,
        schema,
      }),
    ).rejects.toThrow();
  });

  it('does not retry non-retryable api errors', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
      json: jest.fn(),
      ok: false,
      status: 404,
    } as unknown as Response);

    await expect(
      httpRequest('https://example.com/data', {
        retries: 2,
        schema,
      }),
    ).rejects.toBeInstanceOf(ApiError);

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });
});
