<template>
  <router-view />
</template>

<script>
import { onMounted } from 'vue'
import { useAuthStore } from 'src/stores/auth.store'

export default {
  name: 'App',
  setup() {
    const auth = useAuthStore()

    onMounted(() => {
      auth.checkSession()       // valida sesión
    })

    // Verificar la autenticación antes de mostrar cualquier contenido
    onMounted(() => {
      console.log("App.vue - Verificando autenticación antes de renderizar...")

      // Obtener información de la ruta actual
      const currentHash = window.location.hash || ''
      const currentPath = currentHash.substring(1) // Quita el # del inicio

      console.log("Ruta actual:", currentPath)

      // Si es la página de login o change-password, permitir el renderizado
      if (currentPath === '/login' || currentPath === '/change-password') {
        console.log("Ruta permitida sin autenticación, continuando")
        return
      }

      // Para cualquier otra ruta, verificar autenticación
      const token = localStorage.getItem('token')
      if (!token) {
        console.log("No hay token, redirigiendo a login")
        window.location.href = '/#/login'
        return
      }
    })

    return {}
  }
}
</script>
