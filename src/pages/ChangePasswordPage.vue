<template>
  <div class="change-password-page q-pa-md">
    <q-card class="change-password-card q-pa-lg">
      <q-card-section class="text-center">
        <div class="text-h5 text-weight-bold q-mb-md">Cambio de Contraseña</div>
        <p class="text-body1">
          Por razones de seguridad, debe cambiar su contraseña inicial antes de continuar.
        </p>
      </q-card-section>

      <q-card-section v-if="isLoading">
        <div class="text-center">
          <q-spinner color="primary" size="3em" />
          <p class="q-mt-md">Cargando información de usuario...</p>
        </div>
      </q-card-section>

      <template v-else>
        <q-card-section v-if="isReady">
          <q-form @submit="onSubmit" class="q-gutter-md">
            <q-input v-model="form.currentPassword" label="Contraseña actual" outlined
              :type="isPwd1 ? 'password' : 'text'" :rules="[val => !!val || 'Este campo es obligatorio']">
              <template v-slot:prepend>
                <q-icon name="lock" />
              </template>
              <template v-slot:append>
                <q-icon :name="isPwd1 ? 'visibility_off' : 'visibility'" class="cursor-pointer"
                  @click="isPwd1 = !isPwd1" />
              </template>
            </q-input>

            <q-input v-model="form.newPassword" label="Nueva contraseña" outlined :type="isPwd2 ? 'password' : 'text'"
              :rules="passwordRules">
              <template v-slot:prepend>
                <q-icon name="lock" />
              </template>
              <template v-slot:append>
                <q-icon :name="isPwd2 ? 'visibility_off' : 'visibility'" class="cursor-pointer"
                  @click="isPwd2 = !isPwd2" />
              </template>
              <template v-slot:hint>
                Debe contener al menos 6 caracteres
              </template>
            </q-input>

            <q-input v-model="form.confirmPassword" label="Confirmar nueva contraseña" outlined
              :type="isPwd3 ? 'password' : 'text'" :rules="[
                val => !!val || 'Este campo es obligatorio',
                val => val === form.newPassword || 'Las contraseñas no coinciden'
              ]">
              <template v-slot:prepend>
                <q-icon name="lock" />
              </template>
              <template v-slot:append>
                <q-icon :name="isPwd3 ? 'visibility_off' : 'visibility'" class="cursor-pointer"
                  @click="isPwd3 = !isPwd3" />
              </template>
            </q-input>

            <div class="q-mt-md text-center">
              <q-btn label="CAMBIAR CONTRASEÑA" type="submit" color="primary" :loading="loading" class="full-width" />
            </div>
          </q-form>
        </q-card-section>

        <q-card-section v-else class="text-center">
          <p class="text-negative">Error al cargar datos del usuario. Por favor, intente iniciar sesión de nuevo.</p>
          <q-btn color="primary" label="Volver al login" @click="redirectToLogin" />
        </q-card-section>
      </template>
    </q-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { api } from 'src/boot/axios'
import { useAuthStore } from 'src/stores/auth.store'

const $q = useQuasar()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

// UI state
const isPwd1 = ref(true)
const isPwd2 = ref(true)
const isPwd3 = ref(true)
const loading = ref(false)
const isLoading = ref(true)
const isReady = ref(false)
const username = ref('')

// Form
const form = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

// Reglas de nueva contraseña
const passwordRules = computed(() => [
  (val) => !!val || 'Este campo es obligatorio',
  (val) => val.length >= 6 || 'La contraseña debe tener al menos 6 caracteres',
  (val) => val !== form.value.currentPassword || 'La nueva contraseña debe ser diferente a la actual',
  (val) => val !== username.value || 'La nueva contraseña no puede ser igual a su nombre de usuario',
])

// Verificación de autenticación + carga de usuario
async function checkAuthentication() {
  isLoading.value = true

  // 1) si no hay token -> login
  if (!auth.isAuth) {
    isLoading.value = false
    return router.push({ name: 'login' })
  }

  // 2) intenta poblar el usuario si no está en memoria
  if (!auth.user) {
    try {
      const { data } = await api.get('/api/auth/user')
      const payload = data?.user ?? data // acepta { user: {...} } o {...}

      if (payload && payload.id) {
        auth.updateUser(payload)
        username.value = payload.usuario ?? ''
      } else {
        $q.notify({ type: 'negative', message: 'Error al obtener información del usuario', position: 'top' })
        isLoading.value = false
        return router.push({ name: 'login' })
      }
    } catch {
      $q.notify({ type: 'negative', message: 'Sesión inválida. Inicie sesión nuevamente.', position: 'top' })
      isLoading.value = false
      return router.push({ name: 'login' })
    }
  } else {
    username.value = auth.user?.usuario ?? ''
  }

  // 3) si no es primer inicio, no corresponde estar aquí
  if (!auth.isFirstLogin()) {
    isLoading.value = false
    return router.push('/')
  }

  // 4) si la cuenta está desactivada (tolera booleano/numérico), cerrar sesión
  const estado = auth.user?.estado
  const desactivado = estado === 0 || estado === false
  if (desactivado) {
    await auth.logout()
    isLoading.value = false
    return
  }

  // ok para mostrar el formulario
  isReady.value = true
  isLoading.value = false
}

// Volver al login limpiando estado local
function redirectToLogin() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  localStorage.removeItem('lastActivity')
  if (api.defaults.headers.common?.Authorization) {
    delete api.defaults.headers.common.Authorization
  }
  router.push({ name: 'login' })
}

// Submit cambio de contraseña
const onSubmit = async () => {
  try {
    loading.value = true

    // Validaciones simples locales (ajusta a tu backend si quieres verificar server-side)
    if (form.value.currentPassword !== username.value) {
      throw new Error('La contraseña actual es incorrecta')
    }
    if (form.value.newPassword === form.value.currentPassword) {
      throw new Error('La nueva contraseña debe ser diferente a la actual')
    }
    if (form.value.newPassword === username.value) {
      throw new Error('La nueva contraseña no puede ser igual a su nombre de usuario')
    }

    // Petición al backend
    await api.post('/api/auth/change-password', {
      current_password: form.value.currentPassword, // si decides validar
      password: form.value.newPassword,
      password_confirmation: form.value.confirmPassword,
    })
    // Actualiza el usuario en el store
    if (auth.user) {
      auth.updateUser({ ...auth.user, password_changed: true, password_changed_at: new Date().toISOString() })
    }
    localStorage.removeItem(`pwd_changed_${auth.user?.id}`)
    // Marcar que ya cambió la contraseña
    const user = auth.user
    if (user?.id) {
      localStorage.setItem(`pwd_changed_${user.id}`, 'true')
    }

    $q.notify({ type: 'positive', message: 'Contraseña actualizada correctamente', position: 'top' })

    // Redirección
    const redirectPath =
      typeof route.query.redirect === 'string'
        ? route.query.redirect
        : '/'
    router.push(redirectPath)
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || error.message || 'Error al cambiar la contraseña',
      position: 'top',
    })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  checkAuthentication()
})

// Expuestos al template (en <script setup> ya quedan disponibles)
</script>


<style lang="scss" scoped>
.change-password-page {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f5f5;
}

.change-password-card {
  width: 100%;
  max-width: 500px;
  border-radius: 8px;
}
</style>
