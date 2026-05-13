import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('API client', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('has the production base URL configured', async () => {
    const { default: client } = await import('./client');
    expect(client.defaults.baseURL).toBe('https://movie-be-rsbm.onrender.com/api');
  });

  it('sets Content-Type to application/json by default', async () => {
    const { default: client } = await import('./client');
    expect(client.defaults.headers['Content-Type']).toBe('application/json');
  });

  it('does not include Authorization header when no token in localStorage', async () => {
    localStorage.removeItem('token');
    const { default: client } = await import('./client');

    // Run the request interceptor manually
    const interceptor = client.interceptors.request.handlers[0].fulfilled;
    const config = { headers: {} };
    const result = interceptor(config);
    expect(result.headers.Authorization).toBeUndefined();
  });

  it('adds Bearer Authorization header when token is present in localStorage', async () => {
    localStorage.setItem('token', 'test-token-abc');
    const { default: client } = await import('./client');

    const interceptor = client.interceptors.request.handlers[0].fulfilled;
    const config = { headers: {} };
    const result = interceptor(config);
    expect(result.headers.Authorization).toBe('Bearer test-token-abc');
  });

  it('interceptor returns the config object', async () => {
    localStorage.setItem('token', 'my-token');
    const { default: client } = await import('./client');

    const interceptor = client.interceptors.request.handlers[0].fulfilled;
    const config = { headers: {}, url: '/test' };
    const result = interceptor(config);
    expect(result).toBe(config);
  });
});