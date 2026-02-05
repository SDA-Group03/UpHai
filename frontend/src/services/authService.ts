import axios, { type AxiosRequestConfig } from 'axios'
import { useState, useEffect } from 'react'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
const TOKEN_KEY = 'uph_access_token'
const USER_KEY = 'user'

export type Credentials = {
  username: string
  password: string
}

export type AuthResponse = {
  accessToken: string
  tokenType: string
  expiresIn: number
  refreshTokenExpiresAt: number
}

export type Profile = {
  id: number
  username: string
}

// Create axios instance with base config
const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // Important for cookies
  headers: {
    'Content-Type': 'application/json',
  },
})

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setAccessToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearAccessToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export function isAuthenticated() {
  return Boolean(getAccessToken())
}

export function getCurrentUser(): Profile | null {
  const userStr = localStorage.getItem(USER_KEY)
  if (!userStr) return null
  try {
    return JSON.parse(userStr)
  } catch {
    return null
  }
}

export function setCurrentUser(user: Profile) {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function removeCurrentUser() {
  localStorage.removeItem(USER_KEY)
}

export async function login(credentials: Credentials): Promise<AuthResponse> {
  try {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials)
    const data = response.data
    
    setAccessToken(data.accessToken)
    return data
  } catch (error: any) {
    console.error('Login failed:', error)
    const message = error.response?.data?.error || 'Login failed'
    throw new Error(message)
  }
}

export async function register(credentials: Credentials): Promise<{ id: number; username: string }> {
  try {
    const response = await apiClient.post<{ id: number; username: string }>('/auth/register', credentials)
    const data = response.data
    
    return data
  } catch (error: any) {
    console.error('Register failed:', error)
    const message = error.response?.data?.error || 'Registration failed'
    throw new Error(message)
  }
}

export async function refreshAccessToken(): Promise<AuthResponse> {
  try {
    const response = await apiClient.post<AuthResponse>('/auth/refresh')
    const data = response.data
    
    setAccessToken(data.accessToken)
    return data
  } catch (error: any) {
    console.error('Token refresh failed:', error)
    clearAccessToken()
    throw error
  }
}

export async function logout(): Promise<void> {
  try {
    await apiClient.post('/auth/logout')
  } catch (error) {
    console.error('Logout failed:', error)
  } finally {
    clearAccessToken()
    removeCurrentUser()
  }
}

export async function fetchProfile(): Promise<Profile> {
  const token = getAccessToken()
  if (!token) {
    throw new Error('Missing access token')
  }
  
  try {
    const response = await apiClient.get<Profile>('/auth/me', {
      headers: { 
        Authorization: `Bearer ${token}` 
      },
    })
    return response.data
  } catch (error: any) {
    console.error('Fetch profile failed:', error)
    if (error.response?.status === 401) {
      // Try to refresh token
      try {
        await refreshAccessToken()
        const newToken = getAccessToken()
        const response = await apiClient.get<Profile>('/auth/me', {
          headers: { 
            Authorization: `Bearer ${newToken}` 
          },
        })
        return response.data
      } catch (refreshError) {
        clearAccessToken()
        throw new Error('Authentication expired')
      }
    }
    throw error
  }
}

export function useCurrentUser() {
  const [user, setUser] = useState<Profile | null>(null)

  useEffect(() => {
    setUser(getCurrentUser())
  }, [])

  const handleLogout = async () => {
    await logout()
    setUser(null)
  }

  return { user, handleLogout }
}
