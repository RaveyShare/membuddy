/**
 * API Configuration
 *
 * This file contains all API endpoints and request functions
 * to interact with the FastAPI backend.
 */

import { authManager, type AuthResponse, type LoginCredentials, type RegisterCredentials } from "./auth"
import type { MemoryItem, MemoryItemCreate, MemoryAids } from "./types" // Assuming types.ts will be created
import { jwtDecode } from "jwt-decode";

const API_BASE_URL = "http://localhost:8000/api"

// Helper to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.detail || `HTTP error! status: ${response.status}`)
  }
  return response.json()
}

// API request functions
export const api = {
  // Authentication endpoints
  auth: {
    login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      const data = await handleResponse<{ access_token: string }>(response);

      // Decode JWT to get user info
      const tokenPayload: { sub: string, email: string, full_name: string } = jwtDecode(data.access_token);
      const user = {
        id: tokenPayload.sub,
        email: tokenPayload.email,
        name: tokenPayload.full_name,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${tokenPayload.sub}`,
        createdAt: new Date().toISOString(),
      };

      const authData = { user, token: data.access_token, refreshToken: "" };
      authManager.setAuth(authData);
      return authData;
    },

    register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
          full_name: credentials.name,
        }),
      });
      await handleResponse<any>(response);
      
      // After registration, log the user in to get a token
      return await api.auth.login(credentials);
    },

    logout: async (): Promise<void> => {
      authManager.clearAuth();
      return Promise.resolve();
    },
  },

  // Memory items endpoints
  async getMemoryItems(): Promise<any[]> {
    const token = authManager.getToken()
    if (!token) throw new Error("Not authenticated")

    const response = await fetch(`${API_BASE_URL}/memory_items`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return handleResponse<any[]>(response)
  },

  getMemoryItem: async (id: string): Promise<MemoryItem> => {
    const token = authManager.getToken()
    if (!token) throw new Error("Not authenticated")

    const response = await fetch(`${API_BASE_URL}/memory_items/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return handleResponse<MemoryItem>(response)
  },

  saveMemoryItem: async (item: MemoryItemCreate): Promise<MemoryItem> => {
    const token = authManager.getToken()
    if (!token) throw new Error("Not authenticated")

    const response = await fetch(`${API_BASE_URL}/memory_items/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(item),
    })
    return handleResponse<MemoryItem>(response)
  },

  updateMemoryItemAids: async (itemId: string, aids: MemoryAids): Promise<MemoryItem> => {
    const token = authManager.getToken();
    if (!token) throw new Error("Not authenticated");

    const response = await fetch(`${API_BASE_URL}/memory_items/${itemId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ memory_aids: aids }),
    });
    return handleResponse<MemoryItem>(response);
  },

  // Memory aids generation
  generateMemoryAids: async (content: string): Promise<MemoryAids> => {
    const token = authManager.getToken()
    if (!token) throw new Error("Not authenticated")

    const response = await fetch(`${API_BASE_URL}/memory/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content }),
    })
    return handleResponse<MemoryAids>(response)
  },
}

export default api