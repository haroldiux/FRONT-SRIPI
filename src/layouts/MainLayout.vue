<!-- MainLayout.vue -->
<template>
  <q-layout view="hHh lpR fFf">
    <!-- Header simple pero efectivo -->
    <q-header elevated class="bg-primary">
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="left = !left"
        />

        <q-toolbar-title class="row items-center">
          <span>Sistema de Encuestas</span>
        </q-toolbar-title>

        <!-- Dropdown de usuario -->
        <q-btn-dropdown
          v-if="auth.isAuth && auth.user"
          flat
          no-caps
          dense
          :label="auth.user ? `${auth.user.nombres} ${auth.user.apellidos}` : 'Usuario'"
          icon="account_circle"
        >
          <q-list>
            <q-item clickable v-close-popup @click="goToProfile">
              <q-item-section avatar>
                <q-icon name="person" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Mi Perfil</q-item-label>
              </q-item-section>
            </q-item>

            <q-separator />

            <q-item clickable v-close-popup @click="logout">
              <q-item-section avatar>
                <q-icon name="logout" color="negative" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Cerrar Sesión</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </q-toolbar>
    </q-header>

    <!-- Drawer -->
    <q-drawer
      v-model="left"
      show-if-above
      bordered
      content-class="bg-white"
      :width="250"
      v-if="auth.isAuth"
    >
      <!-- Logo simplificado -->
      <div class="q-pa-md flex items-center">
        <div class="text-primary text-h6 text-weight-bold">
          <q-avatar color="primary" text-color="white" class="q-mr-md">
            <span>SE</span>
          </q-avatar>
          Sistema
        </div>
      </div>

      <q-separator />

      <!-- Menú -->
      <q-list>
        <q-item
          clickable
          v-ripple
          :to="{ name: 'dashboard' }"
          :active="route.name === 'dashboard'"
          active-class="bg-primary text-white"
        >
          <q-item-section avatar>
            <q-icon name="dashboard" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Dashboard</q-item-label>
          </q-item-section>
        </q-item>

        <q-item
          clickable
          v-ripple
          :to="{ name: 'proyectos.list' }"
          :active="route.name?.includes('proyectos')"
          active-class="bg-primary text-white"
        >
          <q-item-section avatar>
            <q-icon name="folder" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Proyectos</q-item-label>
          </q-item-section>
        </q-item>

        <q-item
          clickable
          v-ripple
          :to="{ name: 'proyectos.new' }"
          active-class="bg-primary text-white"
        >
          <q-item-section avatar>
            <q-icon name="add_circle" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Nuevo Proyecto</q-item-label>
          </q-item-section>
        </q-item>

        <q-item
          clickable
          v-ripple
          :to="{ name: 'usuarios.list' }"
          :active="route.name?.includes('usuarios')"
          active-class="bg-primary text-white"
          v-if="hasPermission(['admin', 'supervisor'])"
        >
          <q-item-section avatar>
            <q-icon name="people" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Usuarios</q-item-label>
          </q-item-section>
        </q-item>

        <q-item
          clickable
          v-ripple
          :to="{ name: 'encuestadores.list' }"
          :active="route.name?.includes('encuestadores')"
          active-class="bg-primary text-white"
        >
          <q-item-section avatar>
            <q-icon name="badge" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Encuestadores</q-item-label>
          </q-item-section>
        </q-item>

        <q-separator v-if="hasPermission(['admin'])" />

        <q-item
          clickable
          v-ripple
          v-if="hasPermission(['admin'])"
        >
          <q-item-section avatar>
            <q-icon name="settings" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Configuración</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>

      <!-- Información del usuario -->
      <div class="absolute-bottom q-pa-md" v-if="auth.user">
        <q-item>
          <q-item-section avatar>
            <q-avatar color="primary" text-color="white">
              <span>{{ getUserInitials }}</span>
            </q-avatar>
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ auth.user ? `${auth.user.nombres} ${auth.user.apellidos}` : 'Usuario' }}</q-item-label>
            <q-item-label caption>{{ auth.user ? auth.user.usuario : '' }}</q-item-label>
          </q-item-section>
        </q-item>
      </div>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'src/stores/auth.store'

const router = useRouter()
const route = useRoute()
const $q = useQuasar()
const auth = useAuthStore()
const setupActivityMonitor = inject('setupActivityMonitor', null)

// Estado del drawer
const left = ref(false)

// Obtener iniciales del usuario para el avatar
const getUserInitials = computed(() => {
  if (!auth.user || !auth.user.nombres || !auth.user.apellidos) return '?'

  const firstNameInitial = auth.user.nombres.charAt(0)
  const lastNameInitial = auth.user.apellidos.charAt(0)

  return `${firstNameInitial}${lastNameInitial}`
})

// Verificar si el usuario tiene un rol específico
function hasPermission(roles) {
  if (!Array.isArray(roles)) {
    roles = [roles]
  }

  // Mapeo de roles por ID
  const roleMap = {
    1: 'admin',
    2: 'supervisor',
    3: 'encuestador'
  }

  // Obtener el rol del usuario
  const userRole = auth.user && auth.user.rol_id ? roleMap[auth.user.rol_id] : null

  // Verificar si el usuario tiene alguno de los roles permitidos
  return roles.includes(userRole)
}

// Ir al perfil del usuario
function goToProfile() {
  $q.notify({
    type: 'info',
    message: 'Función de perfil en desarrollo',
    position: 'top'
  })
}

// Cerrar sesión
function logout() {
  $q.dialog({
    title: 'Cerrar Sesión',
    message: '¿Está seguro que desea cerrar sesión?',
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      await auth.logout()
      router.push('/login')
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
      // En caso de error, forzar redirección manual
      window.location.href = '/login?logout=error'
    }
  })
}

// Configurar el monitor de actividad al montar el componente
onMounted(() => {
  if (setupActivityMonitor) {
    setupActivityMonitor()
  }
})
</script>

<style lang="scss" scoped>
// Estilos básicos
.q-item.active-item {
  background-color: #1976d2;
  color: white;
}

.q-drawer {
  .q-item:hover {
    background-color: rgba(0,0,0,0.03);
  }
}
</style>
