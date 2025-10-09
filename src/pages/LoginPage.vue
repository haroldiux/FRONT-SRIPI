<template>
  <div class="login-page q-pa-md">
    <q-card class="login-card q-pa-lg">
      <q-card-section class="text-center">
        <div class="text-h5 text-weight-bold q-mb-md">Sistema de Encuestas</div>
        <q-avatar size="80px" color="primary" text-color="white" class="q-mb-lg">
          <span class="text-h4">SE</span>
        </q-avatar>
      </q-card-section>

      <q-card-section>
        <q-form ref="loginForm" @submit="onSubmit" class="q-gutter-md">
          <q-input v-model="form.usuario" label="Usuario" outlined
            :rules="[val => !!val || 'El usuario es obligatorio']">
            <template v-slot:prepend>
              <q-icon name="person" />
            </template>
          </q-input>

          <q-input v-model="form.password" label="Contraseña" outlined :type="isPwd ? 'password' : 'text'"
            :rules="[val => !!val || 'La contraseña es obligatoria']">
            <template v-slot:prepend>
              <q-icon name="lock" />
            </template>
            <template v-slot:append>
              <q-icon :name="isPwd ? 'visibility_off' : 'visibility'" class="cursor-pointer" @click="isPwd = !isPwd" />
            </template>
          </q-input>

          <div class="text-center q-mt-md">
            <q-btn label="INICIAR SESIÓN" type="submit" color="primary" :loading="loading" class="full-width" />
          </div>
        </q-form>
      </q-card-section>

      <!-- Notificación de cierre de sesión exitoso -->
      <q-banner v-if="logoutSuccess" class="bg-green-1 text-green q-mt-md" rounded>
        <template v-slot:avatar>
          <q-icon name="check_circle" color="positive" />
        </template>
        Sesión cerrada exitosamente
      </q-banner>
    </q-card>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useAuthStore } from 'src/stores/auth.store'
import { useQuasar } from 'quasar'

export default {
  name: 'LoginPage',

  setup() {
    const $q = useQuasar()
    const auth = useAuthStore()
    const loginForm = ref(null)

    const isPwd = ref(true)
    const loading = ref(false)
    const logoutSuccess = ref(false)
    const form = ref({
      usuario: '',
      password: ''
    })

    // Verificar si viene de un logout exitoso
    onMounted(() => {
      // Limpiar cualquier token o datos de sesión antiguos
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('lastActivity')

      // Verificar parámetro logout
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get('logout') === 'success') {
        logoutSuccess.value = true
      }
    })

    const onSubmit = async () => {
      try {
        if (loginForm.value && !loginForm.value.validate()) {
          return
        }

        loading.value = true
        logoutSuccess.value = false

        // Usar el store de autenticación para iniciar sesión
        const { user } = await auth.login(form.value)
        $q.notify({ type: 'positive', message: `Bienvenido, ${user?.nombres ?? 'usuario'}` })

        // Mostrar notificación de éxito
        $q.notify({
          type: 'positive',
          message: 'Inicio de sesión exitoso',
          position: 'top'
        })

        // Verificar si es el primer inicio de sesión
        if (auth.isFirstLogin()) {
          // Redireccionar a cambio de contraseña
          console.log("Redirigiendo a cambio de contraseña (primer inicio)")
          window.location.href = '/#/change-password'
        } else {
          // Redireccionar al dashboard
          console.log("Redirigiendo al dashboard")
          window.location.href = '/#/'
        }
      } catch (error) {
        console.error('Error de inicio de sesión:', error)

        // Limpiar cualquier dato de sesión parcial
        auth.logout()

        // Mostrar notificación de error
        $q.notify({
          type: 'negative',
          message: error.message || 'Error al iniciar sesión',
          position: 'top'
        })
      } finally {
        loading.value = false
      }
    }

    return {
      form,
      isPwd,
      loading,
      logoutSuccess,
      loginForm,
      onSubmit
    }
  }
}
</script>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f5f5;
}

.login-card {
  width: 100%;
  max-width: 400px;
  border-radius: 8px;
}
</style>
