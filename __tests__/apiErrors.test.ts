import { mapApiError } from '../src/api/errors';

describe('API Error Mapping (Critical Rule 8)', () => {
  it('maps network disconnect to citizen-friendly message with no tech jargon', () => {
    const error = new Error('Network Error');
    const mapped = mapApiError(error);

    expect(mapped.code).toBe('OFFLINE_OR_NETWORK_ERROR');
    expect(mapped.userMessage).toContain('temporarily unavailable');
    expect(mapped.userMessage).toContain('internet connection');
  });

  it('maps request timeouts to friendly retry message', () => {
    const error = { code: 'ECONNABORTED', message: 'timeout of 15000ms exceeded' };
    const mapped = mapApiError(error);

    expect(mapped.code).toBe('TIMEOUT');
    expect(mapped.userMessage).toContain('longer than expected');
  });

  it('maps HTTP 401 to session expiry message', () => {
    const error = { status: 401 };
    const mapped = mapApiError(error);

    expect(mapped.code).toBe('UNAUTHORIZED');
    expect(mapped.userMessage).toContain('session has expired');
  });

  it('maps HTTP 429 to rate limit guidance', () => {
    const error = { status: 429 };
    const mapped = mapApiError(error);

    expect(mapped.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(mapped.userMessage).toContain('query limit');
  });

  it('maps HTTP 500 without exposing raw database or server details', () => {
    const error = {
      status: 500,
      message: 'FATAL: database query execution failed on table legal_acts',
    };
    const mapped = mapApiError(error);

    expect(mapped.code).toBe('SERVER_ERROR');
    expect(mapped.userMessage).not.toContain('database');
    expect(mapped.userMessage).not.toContain('table');
    expect(mapped.userMessage).toContain('maintenance');
  });
});
