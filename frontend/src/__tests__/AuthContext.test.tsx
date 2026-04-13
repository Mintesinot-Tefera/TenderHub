import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../context/AuthContext';
import type { User } from '../types';

// Mock the api module
vi.mock('../services/api', () => {
  const tokenStore: Record<string, string | null> = { token: null };
  return {
    authApi: {
      login: vi.fn(),
      register: vi.fn(),
      me: vi.fn(),
    },
    tokenStorage: {
      get: vi.fn(() => tokenStore.token),
      set: vi.fn((t: string) => { tokenStore.token = t; }),
      clear: vi.fn(() => { tokenStore.token = null; }),
    },
  };
});

import { authApi, tokenStorage } from '../services/api';

const mockUser: User = {
  id: 'u1',
  email: 'test@test.com',
  fullName: 'Test User',
  role: 'BIDDER',
  companyName: null,
  phone: null,
  avatarUrl: null,
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
};

function TestConsumer() {
  const { user, loading, login, logout } = useAuth();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div data-testid="user">{user ? user.fullName : 'no user'}</div>
      <button onClick={() => login('test@test.com', 'password')}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (tokenStorage.get as ReturnType<typeof vi.fn>).mockReturnValue(null);
  });

  it('starts with no user when no token exists', async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('no user');
    });
  });

  it('loads user from token on mount', async () => {
    (tokenStorage.get as ReturnType<typeof vi.fn>).mockReturnValue('existing_token');
    (authApi.me as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Test User');
    });
    expect(authApi.me).toHaveBeenCalled();
  });

  it('clears token when me() fails on mount', async () => {
    (tokenStorage.get as ReturnType<typeof vi.fn>).mockReturnValue('bad_token');
    (authApi.me as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Invalid'));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('no user');
    });
    expect(tokenStorage.clear).toHaveBeenCalled();
  });

  it('login sets user and token', async () => {
    (authApi.login as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: mockUser,
      token: 'new_token',
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('no user');
    });

    await act(async () => {
      await userEvent.click(screen.getByText('Login'));
    });

    expect(tokenStorage.set).toHaveBeenCalledWith('new_token');
    expect(screen.getByTestId('user')).toHaveTextContent('Test User');
  });

  it('logout clears user and token', async () => {
    (tokenStorage.get as ReturnType<typeof vi.fn>).mockReturnValue('token');
    (authApi.me as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('Test User');
    });

    await act(async () => {
      await userEvent.click(screen.getByText('Logout'));
    });

    expect(tokenStorage.clear).toHaveBeenCalled();
    expect(screen.getByTestId('user')).toHaveTextContent('no user');
  });
});

describe('useAuth outside provider', () => {
  it('throws error when used outside AuthProvider', () => {
    // Suppress console.error for this test since React will log the error
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<TestConsumer />)).toThrow(
      'useAuth must be used within AuthProvider'
    );

    spy.mockRestore();
  });
});
