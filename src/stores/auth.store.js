// src/stores/auth.store.js
import { defineStore } from 'pinia'
import { api } from 'src/boot/axios'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  // Estado
  const token = ref(localStorage.getItem('token') || null)
  const user = ref(null)
  const lastActivity = ref(localStorage.getItem('lastActivity') || Date.now())

  // Inicializar user de manera segura
  try {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      user.value = JSON.parse(userStr)
    }
  } catch (e) {
    console.error('Error parsing user from localStorage:', e)
    localStorage.removeItem('user') // Limpiar datos corruptos
  }

  // Getters
  const isAuth = computed(() => !!token.value)

  const hasRole = computed(() => (role) => {
    if (!user.value || !user.value.rol_id) return false

    // Mapeo de roles por ID
    const roles = {
      1: 'admin',
      2: 'supervisor',
      3: 'encuestador'
    }

    // Obtener el nombre del rol del usuario actual
    const userRole = roles[user.value.rol_id]

    // Verificar si coincide con el rol requerido
    return userRole === role
  })

  // Acciones
  function updateUser(userData) {
    // si la respuesta del backend trajo "password_changed" fuera del objeto user,
    // puedes mezclarlo así:
    if (typeof userData.password_changed === 'undefined' && typeof userData.user?.password_changed !== 'undefined') {
      userData.password_changed = userData.user.password_changed;
    }
    user.value = userData;
    try {
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (e) {
      console.error('Error saving user to localStorage:', e)
    }
  }

  function setToken(tokenValue) {
  token.value = tokenValue
  localStorage.setItem('token', tokenValue)

  // Configurar el header de Authorization para futuras peticiones
  if (tokenValue) {
    api.defaults.headers.common['Authorization'] = `Bearer ${tokenValue}`
  } else {
    delete api.defaults.headers.common['Authorization']
  }
}

  function updateLastActivity() {
    lastActivity.value = Date.now()
    try {
      localStorage.setItem('lastActivity', lastActivity.value)
    } catch (e) {
      console.error('Error saving lastActivity to localStorage:', e)
    }
  }

  // Función login
  async function login(credentials) {
    try {
      const response = await api.post('/api/auth/login', credentials)

      // Verificar si el usuario está activo
      if (response.data.user.estado === 0 || response.data.user.estado === false) {
        throw new Error('Su cuenta está desactivada. Contacte al administrador.')
      }

      updateUser(response.data.user)
      setToken(response.data.token)
      updateLastActivity()

      return response.data
    } catch (error) {
      // Si el error viene del servidor, mantener el mensaje original
      if (error.response && error.response.data && error.response.data.message) {
        throw new Error(error.response.data.message)
      }
      // Si no, lanzar el error original
      throw error
    }
  }

  // Función logout mejorada
  async function logout() {
    // Primero verificar si hay un token válido antes de intentar hacer logout en el servidor
    if (token.value) {
      try {
        // Configurar el header de autorización antes de la petición
        api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`;

        // Intentar logout en el servidor
        await api.post('/api/auth/logout');
        console.log('Logout exitoso en el servidor');
      } catch (error) {
        // No es crítico si falla el logout en el servidor
        console.log('Error al cerrar sesión en el servidor, continuando con logout local:', error);
      }
    }

    // Siempre limpiar datos locales independientemente del resultado del servidor
    token.value = null;
    user.value = null;

    // Limpiar localStorage de manera segura
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('lastActivity');

      // También limpiar cualquier dato relacionado con cambio de contraseña
      const userKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('pwd_changed_')) {
          userKeys.push(key);
        }
      }
      userKeys.forEach(key => localStorage.removeItem(key));
    } catch (e) {
      console.error('Error clearing localStorage:', e)
    }

    // Limpiar headers de API
    if (api.defaults.headers.common) {
      delete api.defaults.headers.common['Authorization'];
    }

    console.log('Sesión cerrada correctamente');
  }

  function checkSession() {
    // Si no hay token, no hay sesión que verificar
    if (!token.value) return false

    // Verificar si el usuario está activo
    if (user.value && (user.value.estado === 0 || user.value.estado === false)) {
      logout()
      throw new Error('Su cuenta ha sido desactivada. Contacte al administrador.')
    }
    const currentTime = Date.now()
    const inactivityTime = currentTime - lastActivity.value
    const maxInactivityTime = 30 * 60 * 1000 // 30 minutos en milisegundos

    // Si el tiempo de inactividad supera el máximo, cerrar sesión
    if (inactivityTime > maxInactivityTime) {
      logout()
      return false
    }

    // Actualizar el tiempo de última actividad
    updateLastActivity()
    return true
  }

  function isFirstLogin() {
    // Verificar si el usuario existe
    if (!user.value) {
      console.log("isFirstLogin: usuario no definido");
      return false;
    }

    // 1) Si el backend ya envía el flag explícito:
    if (typeof user.value.password_changed !== 'undefined') {
      return !user.value.password_changed;
    }

    // 2) Si solo viene la fecha:
    if (typeof user.value.password_changed_at !== 'undefined') {
      return !user.value.password_changed_at; // true si null
    }

    // 3) Fallback (temporal) a localStorage si no vino nada
    try {
      const changed = localStorage.getItem(`pwd_changed_${user.value.id}`);
      return !changed;
    } catch (e) {
      console.error('Error reading from localStorage:', e)
      return false;
    }
  }

  return {
    // Estado
    token,
    user,
    lastActivity,

    // Getters
    isAuth,
    hasRole,

    // Acciones
    login,
    logout,
    checkSession,
    updateLastActivity,
    isFirstLogin,
    updateUser
  }
})
