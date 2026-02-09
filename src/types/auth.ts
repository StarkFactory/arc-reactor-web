export interface User {
  id: string
  email: string
  name: string
  role: 'USER' | 'ADMIN'
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
}

export interface AuthResponse {
  token: string
  user: User | null
  error?: string
}
