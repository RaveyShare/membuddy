/**
 * Mock Authentication Service
 *
 * This file provides mock authentication functionality for development and demo purposes.
 * In production, this would be replaced with real API calls.
 */

import { authManager, type User, type AuthResponse, type LoginCredentials, type RegisterCredentials } from "./auth"

// Mock user database
const MOCK_USERS: User[] = [
  {
    id: "user_001",
    email: "demo@membuddy.com",
    name: "张小明",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=demo",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "user_002",
    email: "test@example.com",
    name: "李小红",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=test",
    createdAt: "2024-01-02T00:00:00Z",
  },
]

// Mock password storage (in real app, passwords would be hashed)
const MOCK_PASSWORDS: Record<string, string> = {
  "demo@membuddy.com": "demo123",
  "test@example.com": "test123",
}

// Generate a mock JWT token
const generateMockToken = (userId: string): string => {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }))
  const payload = btoa(
    JSON.stringify({
      sub: userId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
    }),
  )
  const signature = btoa("mock-signature")
  return `${header}.${payload}.${signature}`
}

// Generate a mock refresh token
const generateMockRefreshToken = (userId: string): string => {
  return btoa(`refresh_${userId}_${Date.now()}`)
}

// Simulate API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const mockAuthService = {
  /**
   * Mock login function
   */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    await delay(1000) // Simulate network delay

    const { email, password } = credentials

    // Find user by email
    const user = MOCK_USERS.find((u) => u.email === email)
    if (!user) {
      throw new Error("用户不存在")
    }

    // Check password
    if (MOCK_PASSWORDS[email] !== password) {
      throw new Error("密码错误")
    }

    // Generate tokens
    const token = generateMockToken(user.id)
    const refreshToken = generateMockRefreshToken(user.id)

    return {
      user,
      token,
      refreshToken,
    }
  },

  /**
   * Mock register function
   */
  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    await delay(1500) // Simulate network delay

    const { name, email, password } = credentials

    // Check if user already exists
    if (MOCK_USERS.find((u) => u.email === email)) {
      throw new Error("该邮箱已被注册")
    }

    // Create new user
    const newUser: User = {
      id: `user_${Date.now()}`,
      email,
      name,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
      createdAt: new Date().toISOString(),
    }

    // Add to mock database
    MOCK_USERS.push(newUser)
    MOCK_PASSWORDS[email] = password

    // Generate tokens
    const token = generateMockToken(newUser.id)
    const refreshToken = generateMockRefreshToken(newUser.id)

    return {
      user: newUser,
      token,
      refreshToken,
    }
  },

  /**
   * Mock logout function
   */
  logout: async (): Promise<void> => {
    await delay(500) // Simulate network delay
    // In a real app, this would invalidate the token on the server
    console.log("User logged out")
  },

  /**
   * Mock refresh token function
   */
  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    await delay(800) // Simulate network delay

    try {
      // Decode refresh token to get user ID
      const decoded = atob(refreshToken)
      const userId = decoded.split("_")[1]

      // Find user
      const user = MOCK_USERS.find((u) => u.id === userId)
      if (!user) {
        throw new Error("Invalid refresh token")
      }

      // Generate new tokens
      const newToken = generateMockToken(user.id)
      const newRefreshToken = generateMockRefreshToken(user.id)

      return {
        user,
        token: newToken,
        refreshToken: newRefreshToken,
      }
    } catch (error) {
      throw new Error("Invalid refresh token")
    }
  },

  /**
   * Mock forgot password function
   */
  forgotPassword: async (email: string): Promise<void> => {
    await delay(1200) // Simulate network delay

    const user = MOCK_USERS.find((u) => u.email === email)
    if (!user) {
      throw new Error("该邮箱未注册")
    }

    // In a real app, this would send an email
    console.log(`Password reset email sent to ${email}`)
  },

  /**
   * Mock reset password function
   */
  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await delay(1000) // Simulate network delay

    // In a real app, this would validate the reset token
    // For demo purposes, we'll just simulate success
    console.log("Password reset successfully")
  },

  /**
   * Mock get user profile function
   */
  getUserProfile: async (): Promise<User> => {
    await delay(600) // Simulate network delay

    const currentUser = authManager.getCurrentUser()
    if (!currentUser) {
      throw new Error("Not authenticated")
    }

    // Find user in mock database
    const user = MOCK_USERS.find((u) => u.id === currentUser.id)
    if (!user) {
      throw new Error("User not found")
    }

    return user
  },

  /**
   * Mock update user profile function
   */
  updateUserProfile: async (profileData: Partial<User>): Promise<User> => {
    await delay(800) // Simulate network delay

    const currentUser = authManager.getCurrentUser()
    if (!currentUser) {
      throw new Error("Not authenticated")
    }

    // Find and update user in mock database
    const userIndex = MOCK_USERS.findIndex((u) => u.id === currentUser.id)
    if (userIndex === -1) {
      throw new Error("User not found")
    }

    // Update user data
    MOCK_USERS[userIndex] = { ...MOCK_USERS[userIndex], ...profileData }
    const updatedUser = MOCK_USERS[userIndex]

    // Update auth manager
    authManager.setAuth({
      user: updatedUser,
      token: authManager.getToken()!,
      refreshToken: authManager.getRefreshToken()!,
    })

    return updatedUser
  },

  /**
   * Mock change password function
   */
  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await delay(1000) // Simulate network delay

    const currentUser = authManager.getCurrentUser()
    if (!currentUser) {
      throw new Error("Not authenticated")
    }

    // Check current password
    if (MOCK_PASSWORDS[currentUser.email] !== currentPassword) {
      throw new Error("当前密码错误")
    }

    // Update password
    MOCK_PASSWORDS[currentUser.email] = newPassword
    console.log("Password changed successfully")
  },

  /**
   * Get mock users (for demo purposes)
   */
  getMockUsers: () => MOCK_USERS,

  /**
   * Get demo credentials
   */
  getDemoCredentials: () => ({
    email: "demo@membuddy.com",
    password: "demo123",
    name: "张小明",
  }),
}

export default mockAuthService
