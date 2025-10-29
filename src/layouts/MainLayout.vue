<template>
  <q-layout view="hHh lpR fFf">
    <!-- Header mejorado con degradado -->
    <q-header elevated class="modern-header">
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menú"
          @click="drawer = !drawer"
          class="menu-btn"
        />

        <q-toolbar-title class="toolbar-title">
          <span class="title-text">Sistema de Encuestas</span>
        </q-toolbar-title>

        <!-- Avatar de usuario -->
        <q-btn flat round>
          <q-avatar size="32px">
            <img v-if="auth.user?.avatar" :src="auth.user.avatar" alt="Avatar">
            <div v-else class="user-avatar">{{ getUserInitials(auth.user) }}</div>
          </q-avatar>
          <q-tooltip>{{ getUserName() }}</q-tooltip>

          <!-- Menú desplegable de usuario -->
          <q-menu transition-show="jump-down" transition-hide="jump-up" class="user-menu">
            <q-list style="min-width: 180px">
              <q-item class="user-info">
                <q-item-section>
                  <q-item-label class="text-weight-bold">{{ getUserName() }}</q-item-label>
                  <q-item-label caption>
                    {{ getRoleName() }}
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-separator />

              <q-item clickable v-ripple @click="logout" class="logout-item">
                <q-item-section avatar>
                  <q-icon name="logout" />
                </q-item-section>
                <q-item-section>Cerrar Sesión</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </q-header>

    <!-- Drawer lateral mejorado -->
    <q-drawer
      v-model="drawer"
      show-if-above
      :width="250"
      v-if="auth.isAuth"
      class="modern-drawer"
    >
      <!-- Información del usuario mejorada -->
      <div class="user-header">
        <q-avatar size="64px" class="q-mb-sm">
          <img v-if="auth.user?.avatar" :src="auth.user.avatar" alt="Avatar">
          <div v-else class="big-avatar">{{ getUserInitials(auth.user) }}</div>
        </q-avatar>
        <div class="user-header-info">
          <div class="text-weight-bold">{{ getUserName() }}</div>
          <div class="user-role">{{ getRoleName() }}</div>
        </div>
      </div>

      <q-separator />

      <!-- Menú navegación mejorado -->
      <q-scroll-area class="drawer-scroll-area">
        <q-list padding>
          <!-- Dashboard para todos -->
          <q-item
            clickable
            v-ripple
            :to="{ name: 'dashboard' }"
            :active="route.name === 'dashboard'"
            active-class="active-menu-item"
          >
            <q-item-section avatar>
              <q-icon name="dashboard" />
            </q-item-section>
            <q-item-section>Dashboard</q-item-section>
          </q-item>

          <!-- GESTIÓN DE PROYECTOS - solo para admin y supervisor -->
          <template v-if="userIsAdmin() || userIsSupervisor() || userIsAcademico()">
            <q-item-label header class="menu-header">
              GESTIÓN DE PROYECTOS
            </q-item-label>

            <q-item
              clickable
              v-ripple
              :to="{ name: 'proyectos.list' }"
              :active="route.name?.includes('proyectos')"
              active-class="active-menu-item"
            >
              <q-item-section avatar>
                <q-icon name="folder" />
              </q-item-section>
              <q-item-section>Proyectos</q-item-section>
            </q-item>
          </template>

          <!-- ADMINISTRACIÓN - solo visible para administradores -->
          <template v-if="userIsAdmin() || userIsSupervisor()">
            <q-item-label header class="menu-header">
              ADMINISTRACIÓN
            </q-item-label>

            <q-item
              clickable
              v-ripple
              :to="{ name: 'usuarios.list' }"
              :active="route.name?.includes('usuarios')"
              active-class="active-menu-item"
            >
              <q-item-section avatar>
                <q-icon name="people" />
              </q-item-section>
              <q-item-section>Usuarios</q-item-section>
            </q-item>
          </template>

          <!-- MIS ENCUESTAS - solo visible para encuestadores -->
          <template v-if="userIsEncuestador() || userIsAcademico()">
            <q-item-label header class="menu-header">
              MIS ENCUESTAS
            </q-item-label>

            <q-item
              clickable
              v-ripple
              :to="{ name: 'encuestadores.list' }"
              :active="route.name === 'encuestadores.list'"
              active-class="active-menu-item"
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
              active-class="active-menu-item"
            >
              <q-item-section avatar>
                <q-icon name="history" />
              </q-item-section>
              <q-item-section>Historial de Envíos</q-item-section>
            </q-item>
          </template>

          <q-separator class="q-my-md" />

          <!-- Footer con versión de la aplicación -->
          <div class="drawer-footer">
            <span class="app-version">v1.0.0</span>
            <q-icon name="copyright" size="16px" class="q-mr-xs" />
            <span>2025 Sistema de Encuestas</span>
          </div>
        </q-list>
      </q-scroll-area>
    </q-drawer>

    <!-- Contenido principal -->
    <q-page-container>
      <div v-if="showWelcomeMessage" class="welcome-message">
        <q-banner class="welcome-banner" rounded>
          <template v-slot:avatar>
            <q-icon name="check_circle" color="white" />
          </template>
          <div class="welcome-text">Bienvenido, {{ getUserName() }}</div>
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
    return `${auth.user.nombres}${auth.user.apellidos ? ' ' + auth.user.apellidos : ''}`;
  }

  // Si no hay nombres, usar el usuario
  return auth.user.usuario || 'Usuario';
}

// Obtener nombre del rol de usuario
function getRoleName() {
  if (!auth.user) return '';

  const roles = {
    1: 'Administrador',
    2: 'Supervisor',
    3: 'Encuestador',
    4: 'Académico'
  };

  return roles[auth.user.rol_id] || 'Usuario';
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

// Verificar si el usuario es académico
function userIsAcademico() {
  return auth.user && auth.user.rol_id === 4;
}

// Cerrar sesión
function logout() {
  $q.dialog({
    title: 'Cerrar Sesión',
    message: '¿Está seguro que desea salir?',
    persistent: true,
    class: 'logout-dialog',
    ok: {
      label: 'Salir',
      color: 'negative',
      flat: false,
      class: 'logout-btn'
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

<style lang="scss">
/* Variables de colores */
:root {
  --color-primary: #663399;
  --color-secondary: #009999;
  --color-accent: #00AAAA;
  --color-background: #FFFFFF;
  --color-light-bg: #F5F7FA;
  --color-border: #E2E8F0;
  --color-text: #2D3748;
  --color-text-light: #718096;
}

/* Estilos del header */
.modern-header {
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary)) !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;

  .q-toolbar {
    height: 64px;
    padding: 0 16px;
  }

  .toolbar-title {
    .title-text {
      font-size: 1.3rem;
      font-weight: 600;
      letter-spacing: 0.5px;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
      background: linear-gradient(to right, #fff, rgba(255,255,255,0.85));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
  }

  .menu-btn {
    transition: transform 0.3s ease;

    &:hover {
      transform: rotate(90deg);
    }
  }
}

/* Avatar de usuario */
.user-avatar {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-secondary), var(--color-primary));
  color: white;
  font-weight: 600;
}

.big-avatar {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  color: white;
  font-weight: 600;
  font-size: 1.5rem;
  border-radius: 50%;
}

/* Menú de usuario */
.user-menu {
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  overflow: hidden;

  .user-info {
    background-color: var(--color-light-bg);
    padding: 12px 16px;
  }

  .logout-item {
    color: #E53E3E;
    transition: all 0.3s ease;

    &:hover {
      background-color: rgba(229, 62, 62, 0.1);
    }
  }
}

/* Drawer lateral */
.modern-drawer {
  border-right: none;
  background-color: var(--color-background);
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);

  .user-header {
    background: linear-gradient(to right, rgba(102, 51, 153, 0.05), rgba(0, 153, 153, 0.05));
    padding: 24px 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: radial-gradient(circle at top right, rgba(102, 51, 153, 0.1), transparent 70%);
      z-index: 1;
      pointer-events: none;
    }

    .user-header-info {
      position: relative;
      z-index: 2;
      width: 100%;
      margin-top: 8px;
    }

    .user-role {
      color: var(--color-secondary);
      font-size: 0.85rem;
      margin-top: 4px;
      font-weight: 500;
    }
  }

  /* Scroll area */
  .drawer-scroll-area {
    height: calc(100% - 130px);
    margin-top: 0;
    border-right: none;

    .q-scrollarea__container {
      border-right: none;
    }
  }

  /* Estilo de los elementos del menú */
  .q-list {
    padding: 12px 0;
  }

  .q-item {
    min-height: 48px;
    padding: 8px 16px;
    border-radius: 8px;
    margin: 4px 8px;
    transition: all 0.3s ease;

    &:hover {
      background-color: rgba(102, 51, 153, 0.05);
      transform: translateX(4px);
    }

    .q-icon {
      color: var(--color-primary);
    }
  }

  .active-menu-item {
    background: linear-gradient(to right, rgba(102, 51, 153, 0.15), rgba(0, 153, 153, 0.1)) !important;
    color: var(--color-primary) !important;
    font-weight: 500;
    box-shadow: 0 2px 6px rgba(102, 51, 153, 0.1);

    .q-icon {
      color: var(--color-secondary);
    }
  }

  /* Headers de sección */
  .menu-header {
    color: var(--color-text-light);
    font-size: 0.75rem;
    letter-spacing: 1px;
    padding: 16px 16px 8px;
    margin: 8px 8px 0;
    position: relative;

    &:after {
      content: '';
      position: absolute;
      bottom: 4px;
      left: 16px;
      width: 32px;
      height: 2px;
      background: linear-gradient(to right, var(--color-primary), var(--color-secondary));
      border-radius: 2px;
    }
  }

  /* Footer del drawer */
  .drawer-footer {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 16px;
    text-align: center;
    color: var(--color-text-light);
    font-size: 0.8rem;
    background-color: var(--color-light-bg);

    .app-version {
      color: var(--color-accent);
      font-weight: 500;
      margin-right: 8px;
    }
  }
}

/* Mensaje de bienvenida */
.welcome-message {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 2000;
  max-width: 300px;
  animation: fadeInUp 0.5s ease forwards;
}

.welcome-banner {
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary)) !important;
  color: white !important;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15) !important;
  padding: 12px 16px;

  .welcome-text {
    font-weight: 500;
    letter-spacing: 0.5px;
  }
}

/* Diálogo de logout */
.logout-dialog {
  .q-card {
    border-radius: 12px;
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2) !important;
    border-top: 4px solid #E53E3E;
    overflow: hidden;
  }

  .logout-btn {
    background: linear-gradient(135deg, #E53E3E, #FF5252) !important;
    border-radius: 8px;
  }
}

/* Animaciones */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Ajustes responsivos */
@media (max-width: 767px) {
  .user-header {
    padding: 16px !important;

    .q-avatar {
      width: 56px !important;
      height: 56px !important;
    }
  }

  .q-item {
    min-height: 54px !important;
  }
}
</style>
