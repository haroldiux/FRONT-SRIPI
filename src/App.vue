<template>
  <router-view />
</template>

<script>
import { onMounted } from 'vue'
import { useAuthStore } from 'src/stores/auth.store'
import { useRouter } from 'vue-router'

export default {
  name: 'App',
  setup() {
    const auth = useAuthStore()
    const router = useRouter()

    onMounted(() => {
      // Validar sesión al montar la app
      if (!auth.checkSession()) {
        console.log("Sesión expirada o inválida, redirigiendo a login")
        router.push('/login')
      }
    })

    return {}
  }
}
</script>
