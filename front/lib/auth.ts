import { jwtDecode } from "jwt-decode";

/**
 * Authentication utilities and JWT token management
 */

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  createdAt: string
}

export interface AuthResponse {
  user: User
  token: string
  refreshToken: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  name: string
  email: string
  password: string
}

// Token storage keys
const TOKEN_KEY = "auth_token"
const REFRESH_TOKEN_KEY = "refresh_token"
const USER_KEY = "user_data"

export class AuthManager {
  private static instance: AuthManager
  private user: User | null = null
  private token: string | null = null
  private refreshToken: string | null = null
  private listeners: Array<() => void> = []

  private constructor() {
    // Initialize from localStorage if available
    if (typeof window !== "undefined") {
      this.loadFromStorage()
    }
  }

  static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager()
    }
    return AuthManager.instance
  }

  private loadFromStorage(): void {
    try {
      this.token = localStorage.getItem(TOKEN_KEY)
      this.refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
      const userData = localStorage.getItem(USER_KEY)
      if (userData) {
        this.user = JSON.parse(userData)
      }
    } catch (error) {
      console.error("Error loading auth from storage:", error)
      this.clearAuth()
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener())
  }

  // Add listener for auth state changes
  addListener(listener: () => void): () => void {
    this.listeners.push(listener)
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const authenticated = !!(this.token && this.user && !this.isTokenExpired())
    return authenticated
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.user
  }

  // Get auth token
  getToken(): string | null {
    return this.token
  }

  // Set authentication data
  setAuth(authData: AuthResponse): void {
    this.user = authData.user
    this.token = authData.token
    this.refreshToken = authData.refreshToken

    if (typeof window !== "undefined") {
      localStorage.setItem(TOKEN_KEY, authData.token)
      localStorage.setItem(REFRESH_TOKEN_KEY, authData.refreshToken)
      localStorage.setItem(USER_KEY, JSON.stringify(authData.user))
    }

    this.notifyListeners()
  }

  // Clear authentication data
  clearAuth(): void {
    this.user = null
    this.token = null
    this.refreshToken = null

    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(REFRESH_TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    }

    this.notifyListeners()
  }

  // Check if token is expired
  isTokenExpired(): boolean {
    if (!this.token) return true

    try {
      const decoded: { exp: number } = jwtDecode(this.token);
      const currentTime = Date.now() / 1000
      const isExpired = decoded.exp < currentTime
      return isExpired
    } catch (error) {
      console.warn("Unable to decode JWT payload, treating as expired:", error)
      return true
    }
  }

  // Get refresh token
  getRefreshToken(): string | null {
    return this.refreshToken
  }
}

export const authManager = AuthManager.getInstance()
