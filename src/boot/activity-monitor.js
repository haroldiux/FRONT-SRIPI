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

      // Tiempo de inactividad máximo (30 minutos)
      const maxInactivityTime = 30 * 60 * 1000

      // Tiempo de advertencia (28 minutos)
      const warningTime = 28 * 60 * 1000

      // Si el tiempo de inactividad supera el máximo, cerrar sesión
      if (inactivityTime > maxInactivityTime) {
        clearInterval(inactivityInterval)
        auth.logout()

        Notify.create({
          type: 'negative',
          message: 'La sesión ha expirado por inactividad',
          position: 'top'
        })

        router.push('/login')
      }
      // Mostrar advertencia si está cerca del tiempo máximo
      else if (inactivityTime > warningTime) {
        Dialog.create({
          title: 'Advertencia de inactividad',
          message: 'Su sesión está a punto de expirar por inactividad. ¿Desea continuar activo?',
          cancel: true,
          persistent: true
        }).onOk(() => {
          // Actualizar actividad si el usuario confirma
          updateActivity()
        }).onCancel(() => {
          // Cerrar sesión si el usuario cancela
          clearInterval(inactivityInterval)
          auth.logout()
          router.push('/login')
        })
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
