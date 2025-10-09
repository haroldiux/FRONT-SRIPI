// src/boot/auth-guard.js
import { boot } from 'quasar/wrappers'
import { useAuthStore } from 'src/stores/auth.store'
import { Notify } from 'quasar'

export default boot(({ router }) => {
  router.beforeEach((to) => {
    const auth = useAuthStore()

    // 1) Rutas públicas (guest)
    if (to.meta?.guest || to.path === '/login' || to.path === '/change-password') {
      // Si ya estás logueado e intentas ir a /login, manda al dashboard
      if (to.path === '/login' && auth.isAuth && auth.user) {
        return { path: '/' }
      }
      return true
    }

    // 2) Rutas protegidas: requiere sesión
    if (!auth.isAuth || !auth.user) {
      Notify.create({
        type: 'negative',
        message: 'Debe iniciar sesión para acceder al sistema',
        position: 'top'
      })
      return { name: 'login' }
    }

    // 3) Validez de sesión / inactividad
    try {
      if (!auth.checkSession()) {
        Notify.create({
          type: 'negative',
          message: 'La sesión ha expirado por inactividad',
          position: 'top'
        })
        return { name: 'login' }
      }
    } catch (e) {
      Notify.create({
        type: 'negative',
        message: e.message || 'Error de sesión',
        position: 'top'
      })
      return { name: 'login' }
    }

    // 4) Cambio de contraseña forzado
    if (auth.isFirstLogin() && to.path !== '/change-password') {
      Notify.create({
        type: 'warning',
        message: 'Por seguridad, debe cambiar su contraseña inicial',
        position: 'top'
      })
      return { name: 'change-password' }
    }

    // 5) Reglas de rol (si están configuradas)
    const reqRole = to.meta?.requiresRole
    if (reqRole && !auth.hasRole(reqRole)) {
      Notify.create({
        type: 'negative',
        message: 'No tiene permisos para acceder a esta página',
        position: 'top'
      })
      return { path: '/' }
    }

    // Actualiza actividad en cada navegación
    auth.updateLastActivity()

    return true
  })
})
