import { apiClient } from '../api';
import {
  SignupRequest,
  SigninRequest,
  RefreshTokenRequest,
  AuthResponse,
} from '../types/api';

export const authService = {
  async signup(data: SignupRequest): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/signup/', data);
    const authData = {
      access_token: response.data.access,
      refresh_token: response.data.refresh,
      user: response.data.user || { id: '', email: data.email },
    };
    this.setToken(authData.access_token);
    this.setRefreshToken(authData.refresh_token);
    return authData;
  },

  async signin(data: SigninRequest): Promise<AuthResponse> {
    // Django expects 'username' field, not 'email'
    const response = await apiClient.post('/auth/token/', {
      username: data.email,
      password: data.password,
    });
    
    const authData = {
      access_token: response.data.access,
      refresh_token: response.data.refresh,
      user: { id: '', email: data.email }, // Django doesn't return user in token endpoint
    };
    
    this.setToken(authData.access_token);
    this.setRefreshToken(authData.refresh_token);
    return authData;
  },

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/token/refresh/', {
      refresh: refreshToken,
    });
    
    const authData = {
      access_token: response.data.access,
      refresh_token: refreshToken, // Refresh token stays the same
      user: { id: '', email: '' },
    };
    
    this.setToken(authData.access_token);
    return authData;
  },

  setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  },

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  },

  removeToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
    }
  },

  setRefreshToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('refresh_token', token);
    }
  },

  getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('refresh_token');
    }
    return null;
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  logout(): void {
    this.removeToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/signin';
    }
  },
};