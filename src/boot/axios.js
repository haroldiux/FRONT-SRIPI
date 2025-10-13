// Modificación para boot/axios.js
// Asegúrate de que este código esté en el archivo axios.js

import { boot } from 'quasar/wrappers'
import axios from 'axios'

// Crear instancia de axios
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  //withCredentials: true // Importante para CORS y cookies
})

export default boot(({ app }) => {
  // Restaurar Authorization desde localStorage si existe
  const token = localStorage.getItem('token')
  if (token) {
    console.log('Configurando token desde localStorage:', token.substring(0, 10) + '...')
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  }

  // Interceptor para solicitudes
  api.interceptors.request.use(
    (config) => {
      // Verificar el token en cada solicitud
      const token = localStorage.getItem('token')
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`
      }
      config.headers['X-Requested-With'] = 'XMLHttpRequest'
      config.headers['Accept'] = 'application/json'
      return config
    },
    (error) => {
      console.error('Error en interceptor de solicitud:', error)
      return Promise.reject(error)
    }
  )

  // Interceptor para respuestas
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      // Si hay error 401 (no autorizado), limpiar datos de sesión
      if (error.response && error.response.status === 401) {
        console.log('Error 401: Limpiando datos de sesión')
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        localStorage.removeItem('lastActivity')

        // Opcional: redirigir a login si no estamos ya en la página de login
        if (!window.location.href.includes('/login')) {
          window.location.href = '/#/login?session=expired'
        }
      }
      return Promise.reject(error)
    }
  )

  app.config.globalProperties.$api = api
})
