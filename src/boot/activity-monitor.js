// src/boot/activity-monitor.js
import { boot } from 'quasar/wrappers'
import { useAuthStore } from 'stores/auth.store'
import { useRouter } from 'vue-router'
import { Dialog, Notify } from 'quasar'

export default boot(({ app }) => {
  // Lista de eventos que consideramos como actividad del usuario
  const events = [
    'mousedown', 'mousemove', 'keydown',
    'scroll', 'touchstart', 'click', 'keypress'
  ]

  // Configurar intervalo para verificar inactividad (cada minuto)
  let inactivityInterval = null

  app.provide('setupActivityMonitor', () => {
    const auth = useAuthStore()
    const router = useRouter()

    // Si no hay sesión activa, no hacer nada
    if (!auth.isAuth) return

    // Función para actualizar la última actividad del usuario
    const updateActivity = () => {
      auth.updateLastActivity()
    }

    // Función para verificar si la sesión ha expirado por inactividad
    const checkInactivity = () => {
      const currentTime = Date.now()
      const lastActivity = auth.lastActivity
      const inactivityTime = currentTime - lastActivity

      // Tiempo máximo y de advertencia
      const maxInactivityTime = 30 * 60 * 1000  // 30 min
      const warningTime = 28 * 60 * 1000        // 28 min

      // Si ya no hay sesión activa, limpiar todo y salir
      if (!auth.isAuth) {
        clearInterval(inactivityInterval)
        return
      }

      // Cerrar sesión automáticamente si superó el tiempo máximo
      if (inactivityTime > maxInactivityTime) {
        clearInterval(inactivityInterval)
        auth.logout()

        Notify.create({
          type: 'negative',
          message: 'La sesión ha expirado por inactividad',
          position: 'top'
        })

        router.push('/login')
        return
      }

      // Mostrar advertencia si está cerca del tiempo máximo
      if (inactivityTime > warningTime) {
        // Evitar mostrar varios diálogos simultáneamente
        if (window.activeInactivityDialog) return

        // Guardamos referencia global del diálogo
        window.activeInactivityDialog = Dialog.create({
          title: 'Advertencia de inactividad',
          message: 'Su sesión está a punto de expirar por inactividad. ¿Desea continuar activo?',
          cancel: true,
          persistent: true
        })
          .onOk(() => {
            // Si aún sigue logueado, refresca la actividad
            if (auth.isAuth) updateActivity()
            window.activeInactivityDialog = null
          })
          .onCancel(() => {
            clearInterval(inactivityInterval)
            auth.logout()
            router.push('/login')
            window.activeInactivityDialog = null
          })

        // Cerrar automáticamente si se detecta que la sesión caducó mientras estaba visible
        const dialogCheckInterval = setInterval(() => {
          if (!auth.isAuth && window.activeInactivityDialog) {
            window.activeInactivityDialog.hide()
            window.activeInactivityDialog = null
            clearInterval(dialogCheckInterval)
          }
        }, 3000) // verifica cada 3 segundos
      }
    }

    // Agregar event listeners para cada tipo de evento
    events.forEach(event => {
      window.addEventListener(event, updateActivity)
    })

    // Iniciar intervalo para verificar inactividad
    inactivityInterval = setInterval(checkInactivity, 60000) // Verificar cada minuto

    // Limpiar event listeners cuando el componente se desmonte
    return () => {
      clearInterval(inactivityInterval)
      events.forEach(event => {
        window.removeEventListener(event, updateActivity)
      })
    }
  })
})
