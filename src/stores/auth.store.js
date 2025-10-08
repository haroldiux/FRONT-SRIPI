import { defineStore } from 'pinia'
const AUTH_DISABLED = import.meta.env.VITE_AUTH_DISABLED === 'true'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: AUTH_DISABLED
      ? { id: 1, name: 'Usuario Mock', email: 'mock@sripi.tld', roles: ['admin'] }
      : JSON.parse(localStorage.getItem('sripi_user') || 'null'),
  }),
  getters: {
    isAuth: (s) => !!s.user,
    roles: (s) => s.user?.roles || [],
    hasRole: (s) => (role) => s.user?.roles?.includes(role),
  },
  // src/stores/auth.store.js
  actions: {
    async login({ email /* , password */ }) {
      // 👈 password comentado (no-unused-vars feliz)
      const roles = email.includes('admin') ? ['admin'] : ['encuestador']
      const user = { id: 1, name: email.split('@')[0], email, roles }
      localStorage.setItem('sripi_user', JSON.stringify(user))
      this.user = user
    },
  },
})
