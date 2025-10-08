import { boot } from 'quasar/wrappers'
import { useAuthStore } from 'stores/auth.store'

const AUTH_DISABLED = import.meta.env.VITE_AUTH_DISABLED === 'true'

export default boot(({ router }) => {
  if (AUTH_DISABLED) {
    // No bloquees nada
    return
  }
  router.beforeEach((to) => {
    const auth = useAuthStore()
    if (to.meta?.requiresAuth && !auth.isAuth) {
      return { path: '/login', query: { redirect: to.fullPath } }
    }
    const reqRole = to.meta?.requiresRole
    if (reqRole && !auth.hasRole(reqRole)) {
      return { path: '/' }
    }
  })
})
