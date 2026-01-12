import axios from 'axios'
import { toast } from 'sonner'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - add auth token
apiClient.interceptors.request.use((config) => {
  // TODO: Replace with real auth - use env var for dev, localStorage for production
  const token = import.meta.env.VITE_API_TOKEN ?? localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `${token}`
    config.headers['tenant_id'] = "cleber"
    config.headers['tenant'] = "cleber"
  }
  return config
})

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message ?? 'An error occurred'

    if (error.response?.status === 401) {
      // Handle unauthorized
      localStorage.removeItem('auth_token')
      window.location.href = '/login'
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.')
    } else if (error.response?.status >= 400) {
      toast.error(message)
    }

    return Promise.reject(error)
  }
)
