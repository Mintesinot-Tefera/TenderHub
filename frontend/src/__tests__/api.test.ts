import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { getErrorMessage, tokenStorage } from '../services/api';

describe('getErrorMessage', () => {
  it('extracts message from AxiosError response', () => {
    const err = {
      isAxiosError: true,
      response: {
        data: {
          error: { code: 'VALIDATION_ERROR', message: 'Bad input' },
        },
      },
      message: 'Request failed',
    };

    // Mock axios.isAxiosError to return true
    vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

    const msg = getErrorMessage(err);
    expect(msg).toBe('Bad input');
  });

  it('falls back to axios message when no nested error', () => {
    const err = {
      isAxiosError: true,
      response: { data: {} },
      message: 'Network Error',
    };

    vi.spyOn(axios, 'isAxiosError').mockReturnValue(true);

    const msg = getErrorMessage(err);
    expect(msg).toBe('Network Error');
  });

  it('handles standard Error objects', () => {
    vi.spyOn(axios, 'isAxiosError').mockReturnValue(false);

    const msg = getErrorMessage(new Error('standard error'));
    expect(msg).toBe('standard error');
  });

  it('handles unknown error types', () => {
    vi.spyOn(axios, 'isAxiosError').mockReturnValue(false);

    const msg = getErrorMessage('string error');
    expect(msg).toBe('An unexpected error occurred');
  });
});

describe('tokenStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('stores and retrieves token', () => {
    tokenStorage.set('my_token');
    expect(tokenStorage.get()).toBe('my_token');
  });

  it('returns null when no token', () => {
    expect(tokenStorage.get()).toBeNull();
  });

  it('clears stored token', () => {
    tokenStorage.set('my_token');
    tokenStorage.clear();
    expect(tokenStorage.get()).toBeNull();
  });
});
