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
    const authData = response.data;
    this.setToken(authData.access_token);
    this.setRefreshToken(authData.refresh_token);
    return authData;
  },

  async signin(data: SigninRequest): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/token/', data);
    const authData = response.data;
    this.setToken(authData.access_token);
    this.setRefreshToken(authData.refresh_token);
    return authData;
  },

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/token/refresh/', {
      refresh_token: refreshToken,
    });
    const authData = response.data;
    this.setToken(authData.access_token);
    this.setRefreshToken(authData.refresh_token);
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