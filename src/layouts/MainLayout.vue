<!-- MainLayout.vue -->
<template>
  <q-layout view="hHh lpR fFf">
    <!-- Header simple -->
    <q-header elevated class="bg-primary">
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menú"
          @click="drawer = !drawer"
        />

        <q-toolbar-title>
          Sistema de Encuestas
        </q-toolbar-title>

        <!-- Botón de logout simple -->
        <q-btn flat round icon="logout" @click="logout" />
      </q-toolbar>
    </q-header>

    <!-- Drawer lateral -->
    <q-drawer
      v-model="drawer"
      show-if-above
      bordered
      :width="250"
      v-if="auth.isAuth"
    >
      <!-- Información del usuario que cambia según quien inicia sesión -->
      <q-item class="q-py-md bg-grey-2">
        <q-item-section avatar>
          <q-avatar color="primary" text-color="white">
            {{ getUserInitials(auth.user) }}
          </q-avatar>
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ getUserName() }}</q-item-label>
        </q-item-section>
      </q-item>

      <q-separator />

      <!-- Menú navegación -->
      <q-list padding>
        <!-- Dashboard para todos -->
        <q-item
          clickable
          v-ripple
          :to="{ name: 'dashboard' }"
          :active="route.name === 'dashboard'"
          active-class="bg-blue-1 text-primary"
        >
          <q-item-section avatar>
            <q-icon name="dashboard" />
          </q-item-section>
          <q_item-section>Dashboard</q_item-section>
        </q-item>

        <!-- GESTIÓN DE PROYECTOS - solo para admin y supervisor -->
        <template v-if="userIsAdmin() || userIsSupervisor()">
          <q_item-label header class="text-uppercase text-grey-7">
            GESTIÓN DE PROYECTOS
          </q_item-label>

          <q_item
            clickable
            v-ripple
            :to="{ name: 'proyectos.list' }"
            :active="route.name?.includes('proyectos')"
            active-class="bg-blue-1 text-primary"
          >
            <q_item-section avatar>
              <q_icon name="folder" />
            </q_item-section>
            <q_item-section>Proyectos</q_item-section>
          </q_item>
        </template>

        <!-- ADMINISTRACIÓN - solo visible para administradores -->
        <template v-if="userIsAdmin() || userIsSupervisor()">
          <q-item-label header class="text-uppercase text-grey-7">
            ADMINISTRACIÓN
          </q-item-label>

          <q-item
            clickable
            v-ripple
            :to="{ name: 'usuarios.list' }"
            :active="route.name?.includes('usuarios')"
            active-class="bg-blue-1 text-primary"
          >
            <q-item-section avatar>
              <q-icon name="people" />
            </q-item-section>
            <q-item-section>Usuarios</q-item-section>
          </q-item>
        </template>

        <!-- MIS ENCUESTAS - solo visible para encuestadores -->
        <template v-if="userIsEncuestador()">
          <q-item-label header class="text-uppercase text-grey-7">
            MIS ENCUESTAS
          </q-item-label>

          <q-item
            clickable
            v-ripple
            :to="{ name: 'encuestadores.list' }"
            :active="route.name === 'encuestadores.list'"
            active-class="bg-blue-1 text-primary"
          >
            <q-item-section avatar>
              <q-icon name="assignment" />
            </q-item-section>
            <q-item-section>Encuestas Asignadas</q-item-section>
          </q-item>

          <q-item
            clickable
            v-ripple
            :to="{ name: 'encuestadores.envios' }"
            :active="route.name === 'encuestadores.envios'"
            active-class="bg-blue-1 text-primary"
          >
            <q-item-section avatar>
              <q-icon name="history" />
            </q-item-section>
            <q-item-section>Historial de Envíos</q-item-section>
          </q-item>
        </template>
      </q-list>
    </q-drawer>

    <!-- Contenido principal -->
    <q-page-container>
      <div v-if="showWelcomeMessage" class="welcome-message">
        <q-banner class="bg-green text-white" rounded>
          <template v-slot:avatar>
            <q-icon name="check_circle" />
          </template>
          Bienvenido, {{ getUserName() }}
        </q-banner>
      </div>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, onMounted, inject } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'src/stores/auth.store'

const router = useRouter()
const route = useRoute()
const $q = useQuasar()
const auth = useAuthStore()
const setupActivityMonitor = inject('setupActivityMonitor', null)

// Estado
const drawer = ref(false)
const showWelcomeMessage = ref(false)

// Obtener iniciales del usuario basado en su nombre
function getUserInitials(user) {
  if (!user) return '';

  // Si existe nombres, obtener la primera letra
  let initials = '';

  if (user.nombres) {
    const nombresArray = user.nombres.split(' ');
    initials += nombresArray[0].charAt(0);

    // Si hay apellidos, añadir la primera letra del primer apellido
    if (user.apellidos) {
      const apellidosArray = user.apellidos.split(' ');
      initials += apellidosArray[0].charAt(0);
    }
  } else if (user.usuario) {
    // Alternativa si no hay nombres
    initials = user.usuario.substring(0, 2).toUpperCase();
  }

  return initials || 'U';
}

// Obtener nombre del usuario para mostrar
function getUserName() {
  if (!auth.user) return '';

  if (auth.user.nombres) {
    return auth.user.nombres;
  }

  // Si no hay nombres, usar el usuario
  return auth.user.usuario || 'Usuario';
}

// Verificar si el usuario es administrador
function userIsAdmin() {
  return auth.user && auth.user.rol_id === 1;
}

// Verificar si el usuario es responsable/supervisor
function userIsSupervisor() {
  return auth.user && auth.user.rol_id === 2;
}

// Verificar si el usuario es encuestador
function userIsEncuestador() {
  return auth.user && auth.user.rol_id === 3;
}

// Cerrar sesión
function logout() {
  $q.dialog({
    title: 'Cerrar Sesión',
    message: '¿Está seguro que desea salir?',
    persistent: true,
    ok: {
      label: 'Salir',
      color: 'negative',
      flat: false
    },
    cancel: {
      label: 'Cancelar',
      flat: true
    }
  }).onOk(async () => {
    try {
      await auth.logout()
      router.push('/login')
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
      window.location.href = '/login'
    }
  })
}

// Inicialización
onMounted(() => {
  if (setupActivityMonitor) {
    setupActivityMonitor()
  }

  // Mostrar mensaje de bienvenida por 3 segundos
  showWelcomeMessage.value = true
  setTimeout(() => {
    showWelcomeMessage.value = false
  }, 3000)

  // Cerrar drawer en dispositivos móviles después de navegar
  if (window.innerWidth < 768) {
    router.afterEach(() => {
      drawer.value = false
    })
  }
})
</script>

<style>
.bg-blue-1 {
  background-color: rgba(25, 118, 210, 0.1);
}

.q-drawer .q-item {
  min-height: 48px;
}

.q-item-label.header {
  font-size: 12px;
  letter-spacing: 0.5px;
  padding: 8px 16px 4px;
  color: #757575;
}

.welcome-message {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 2000;
  max-width: 300px;
}

/* Mejora para dispositivos táctiles */
@media (max-width: 768px) {
  .q-drawer .q-item {
    min-height: 54px;
  }
}
</style>
