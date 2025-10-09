<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title>
          <span class="text-weight-bold">Sistema de Encuestas</span>
        </q-toolbar-title>

        <!-- Usuario actual y logout -->
        <q-btn-dropdown
          flat
          no-caps
          dense
          icon="account_circle"
          :label="currentUser.name"
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

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      :mini="miniState"
      @mouseover="miniState = false"
      @mouseout="miniState = true"
      mini-to-overlay
      :width="250"
      :mini-width="65"
    >
      <!-- Header del drawer con logo/info -->
      <q-list class="q-pa-md">
        <q-item class="q-mb-md">
          <q-item-section avatar>
            <q-avatar color="primary" text-color="white" size="40px">
              <span class="text-h6">SE</span>
            </q-avatar>
          </q-item-section>
          <q-item-section v-if="!miniState">
            <q-item-label class="text-weight-bold">Sistema</q-item-label>
            <q-item-label caption>v1.0.0</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>

      <q-separator />

      <!-- Menú de navegación -->
      <q-list padding>
        <q-item
          clickable
          v-ripple
          :to="{ name: 'dashboard' }"
          active-class="bg-primary text-white"
          :class="$route.name === 'dashboard' ? 'bg-primary text-white' : ''"
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
          active-class="bg-primary text-white"
          :class="$route.name?.includes('proyectos') ? 'bg-primary text-white' : ''"
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
          :to="{ name: 'usuarios.list' }"
          active-class="bg-primary text-white"
          :class="$route.name?.includes('usuarios') ? 'bg-primary text-white' : ''"
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
          active-class="bg-primary text-white"
          :class="$route.name?.includes('encuestadores') ? 'bg-primary text-white' : ''"
          v-if="hasPermission(['admin'])"
        >
          <q-item-section avatar>
            <q-icon name="badge" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Encuestadores</q-item-label>
          </q-item-section>
        </q-item>

        <!-- Separador para sección de configuración -->
        <q-separator class="q-my-md" v-if="hasPermission(['admin'])" />

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

      <!-- Footer del drawer con info del usuario -->
      <div class="absolute-bottom q-pa-md" v-if="!miniState">
        <q-card flat bordered>
          <q-card-section class="q-pa-sm">
            <div class="row items-center no-wrap">
              <div class="col">
                <div class="text-caption text-grey-7">Sesión actual</div>
                <div class="text-weight-bold">{{ currentUser.name }}</div>
                <div class="text-caption">{{ currentUser.role }}</div>
              </div>
              <div class="col-auto">
                <q-chip
                  :color="getRoleColor(currentUser.role)"
                  text-color="white"
                  size="sm"
                  dense
                >
                  {{ currentUser.role }}
                </q-chip>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const router = useRouter()

// Estados
const leftDrawerOpen = ref(false)
const miniState = ref(false)

// Usuario actual (esto debería venir del store de autenticación)
const currentUser = ref({
  id: 1,
  name: 'Admin Usuario',
  email: 'admin@example.com',
  role: 'admin' // admin, supervisor, encuestador, user
})

// Función para alternar el drawer
function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

// Función para verificar permisos
function hasPermission(roles) {
  if (!Array.isArray(roles)) {
    roles = [roles]
  }
  return roles.includes(currentUser.value.role)
}

// Función para obtener color del rol
function getRoleColor(role) {
  const colors = {
    admin: 'red',
    supervisor: 'orange',
    encuestador: 'blue',
    user: 'grey'
  }
  return colors[role] || 'grey'
}

// Función para ir al perfil
function goToProfile() {
  // router.push({ name: 'profile' })
  $q.notify({
    type: 'info',
    message: 'Función de perfil en desarrollo'
  })
}

// Función para cerrar sesión
function logout() {
  $q.dialog({
    title: 'Cerrar Sesión',
    message: '¿Está seguro que desea cerrar sesión?',
    cancel: true,
    persistent: true
  }).onOk(() => {
    // Aquí deberías limpiar el token y datos del usuario
    // localStorage.removeItem('token')
    // store.dispatch('auth/logout')

    $q.notify({
      type: 'positive',
      message: 'Sesión cerrada exitosamente'
    })

    router.push({ name: 'login' })
  })
}
</script>

<style lang="scss" scoped>
.q-item.bg-primary {
  .q-icon {
    color: white !important;
  }
}

.q-drawer {
  .q-item {
    border-radius: 8px;
    margin: 4px 8px;

    &:hover {
      background-color: rgba(0, 0, 0, 0.05);
    }
  }
}
</style>
