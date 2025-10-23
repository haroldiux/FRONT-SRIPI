<template>
  <q-dialog v-model="isOpen" persistent maximized class="asignacion-dialog" transition-show="fade" transition-hide="fade">
    <q-card class="asignacion-card">
      <!-- Header mejorado con gradiente -->
      <q-card-section class="header-section" data-aos="fade-down" data-aos-duration="600">
        <div class="row items-center q-pb-md">
          <div class="col">
            <div class="text-h5 text-white text-weight-bold flex items-center">
              <q-icon name="assignment_turned_in" size="28px" class="q-mr-sm" />
              {{ encuesta ? encuesta.titulo : 'Asignación de Encuesta' }}
            </div>
            <div class="text-caption text-white opacity-8 q-mt-xs">
              Administra los usuarios asignados a esta encuesta
            </div>
          </div>
          <q-btn
            icon="close"
            flat
            round
            dense
            v-close-popup
            @click="onClose"
            class="close-btn"
            color="white"
          />
        </div>
      </q-card-section>

      <q-card-section class="q-pt-lg q-px-lg content-section">
        <div class="row q-col-gutter-lg">
          <!-- Panel de usuarios disponibles -->
          <div
            class="col-12 col-md-6"
            data-aos="fade-right"
            data-aos-duration="800"
          >
            <q-card flat bordered class="panel-card">
              <q-card-section class="panel-header bg-purple">
                <div class="text-subtitle1 text-white text-weight-bold flex items-center">
                  <q-icon name="person" class="q-mr-sm" />
                  Usuarios Disponibles
                  <q-badge color="white" text-color="purple" class="q-ml-sm badge-count" v-if="filteredUsers.length">
                    {{ filteredUsers.length }}
                  </q-badge>
                </div>
                <q-input
                  v-model="searchUser"
                  dense
                  outlined
                  placeholder="Buscar usuario..."
                  class="search-input"
                  clearable
                  dark
                  bg-color="rgba(255,255,255,0.2)"
                >
                  <template v-slot:append>
                    <q-icon name="search" />
                  </template>
                </q-input>
              </q-card-section>

              <q-card-section class="users-list-container">
                <div v-if="loadingUsers" class="flex flex-center q-py-md">
                  <q-spinner color="purple" size="40px" />
                </div>
                <div v-else-if="!filteredUsers.length" class="empty-state">
                  <q-icon name="person_search" size="48px" color="grey-5" />
                  <div class="text-subtitle1 text-grey-7 q-mt-sm">No se encontraron usuarios disponibles</div>
                  <div class="text-caption text-grey-6 q-mt-xs">Prueba ajustando los filtros de búsqueda</div>
                </div>
                <q-scroll-area v-else style="height: calc(100vh - 320px)" class="full-width users-scroll">
                  <q-list separator class="users-list">
                    <q-item
                      v-for="user in filteredUsers"
                      :key="`user-${user.id}`"
                      clickable
                      v-ripple
                      @click="promptObjetivo(user)"
                      class="user-item"
                      data-aos="fade-up"
                      data-aos-duration="400"
                      data-aos-delay="50"
                    >
                      <q-item-section avatar>
                        <q-avatar color="purple" text-color="white" class="avatar-user">
                          {{ getUserInitials(user) }}
                        </q-avatar>
                      </q-item-section>
                      <q-item-section>
                        <q-item-label class="text-weight-medium">{{ user.nombres }} {{ user.apellidos }}</q-item-label>
                        <q-item-label caption class="user-info">
                          <span>{{ user.usuario }}</span>
                          <q-badge :color="getRolColor(user.rol_id)" class="q-ml-sm">{{ getRolName(user.rol_id) }}</q-badge>
                        </q-item-label>
                      </q-item-section>
                      <q-item-section side>
                        <q-btn flat round color="teal" icon="add" size="sm" class="add-button">
                          <q-tooltip>Asignar a esta encuesta</q-tooltip>
                        </q-btn>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-scroll-area>
              </q-card-section>
            </q-card>
          </div>

          <!-- Panel de usuarios asignados -->
          <div
            class="col-12 col-md-6"
            data-aos="fade-left"
            data-aos-duration="800"
          >
            <q-card flat bordered class="panel-card">
              <q-card-section class="panel-header bg-teal">
                <div class="text-subtitle1 text-white text-weight-bold flex items-center">
                  <q-icon name="assignment_ind" class="q-mr-sm" />
                  Usuarios Asignados
                  <q-badge color="white" text-color="teal" class="q-ml-sm badge-count" v-if="asignaciones.length">
                    {{ asignaciones.length }}
                  </q-badge>
                </div>
                <q-btn
                  outline
                  color="white"
                  label="Actualizar"
                  icon="refresh"
                  dense
                  class="refresh-btn"
                  size="sm"
                  @click="loadAsignaciones"
                >
                  <q-tooltip>Refrescar lista de asignaciones</q-tooltip>
                </q-btn>
              </q-card-section>

              <q-card-section class="users-list-container">
                <div v-if="loadingAsignaciones" class="flex flex-center q-py-md">
                  <q-spinner color="teal" size="40px" />
                </div>
                <div v-else-if="!asignaciones.length" class="empty-state">
                  <q-icon name="group_off" size="48px" color="grey-5" />
                  <div class="text-subtitle1 text-grey-7 q-mt-sm">No hay usuarios asignados</div>
                  <div class="text-caption text-grey-6 q-mt-xs">Asigna usuarios desde el panel izquierdo</div>
                </div>
                <q-scroll-area v-else style="height: calc(100vh - 320px)" class="full-width users-scroll">
                  <q-list separator class="users-list">
                    <q-item
                      v-for="asignacion in asignaciones"
                      :key="`asignacion-${asignacion.id}`"
                      v-ripple
                      class="asignacion-item"
                      data-aos="fade-up"
                      data-aos-duration="400"
                      data-aos-delay="50"
                    >
                      <q-item-section avatar>
                        <q-avatar color="teal" text-color="white" class="avatar-assigned">
                          {{ getUserInitials(asignacion.usuario) }}
                        </q-avatar>
                      </q-item-section>
                      <q-item-section>
                        <q-item-label class="text-weight-medium">{{ asignacion.usuario.nombres || '' }} {{ asignacion.usuario.apellidos || '' }}</q-item-label>
                        <q-item-label caption>{{ asignacion.usuario.usuario }}</q-item-label>
                        <q-item-label caption class="objetivo-label">
                          <q-icon name="target" size="16px" class="q-mr-xs" color="teal" />
                          <span>Objetivo: <b>{{ asignacion.objetivo || 0 }}</b> encuestas</span>
                        </q-item-label>
                      </q-item-section>
                      <q-item-section side>
                        <div class="row q-gutter-xs action-buttons">
                          <q-btn
                            flat
                            round
                            color="purple"
                            icon="edit"
                            size="sm"
                            @click="editarObjetivo(asignacion)"
                            class="edit-btn"
                          >
                            <q-tooltip>Editar objetivo</q-tooltip>
                          </q-btn>
                          <q-btn
                            flat
                            round
                            color="negative"
                            icon="delete"
                            size="sm"
                            @click="removeAsignacion(asignacion)"
                            class="delete-btn"
                          >
                            <q-tooltip>Eliminar asignación</q-tooltip>
                          </q-btn>
                        </div>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-scroll-area>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right" class="q-pa-md footer-actions">
        <q-btn
          flat
          label="Cerrar"
          color="purple"
          v-close-popup
          @click="onClose"
          class="close-action-btn"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'src/boot/axios'
import AOS from 'aos'

const $q = useQuasar()

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  encuestaId: {
    type: [Number, String],
    default: null
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'close', 'refresh'])

// Estados reactivos
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const encuesta = ref(null)
const usuarios = ref([])
const asignaciones = ref([])
const searchUser = ref('')
const loadingUsers = ref(false)
const loadingAsignaciones = ref(false)
const objetivo = ref(1) // Valor predeterminado para el objetivo

// Inicializar AOS
const initAOS = () => {
  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 800,
      once: false,
      mirror: true
    });
  } else {
    console.warn('AOS no está disponible');
  }
};

// Refrescar AOS cuando cambia el contenido
const refreshAOS = () => {
  if (typeof AOS !== 'undefined') {
    setTimeout(() => {
      AOS.refresh();
    }, 100);
  }
};

// Roles permitidos (2 = Responsable, 3 = Investigador)
const rolesPermitidos = [2, 3]

// Computed
const filteredUsers = computed(() => {
  // Filtrar primero por roles permitidos y usuarios activos
  const usersWithValidRoles = usuarios.value.filter(user =>
    rolesPermitidos.includes(user.rol_id) &&
    user.estado === true
  )

  // Aplicar filtros adicionales
  if (!searchUser.value) return getUnassignedUsers(usersWithValidRoles)

  const term = searchUser.value.toLowerCase()
  const filtered = getUnassignedUsers(usersWithValidRoles).filter(user => {
    return user.nombres?.toLowerCase().includes(term) ||
           user.apellidos?.toLowerCase().includes(term) ||
           user.usuario?.toLowerCase().includes(term)
  })

  // Refrescar AOS cuando cambian los resultados
  nextTick(() => refreshAOS())

  return filtered
})

// Métodos
const getUnassignedUsers = (usersArray) => {
  // Filtrar usuarios que ya están asignados
  const assignedUserIds = asignaciones.value.map(a => a.usuario_id)
  return usersArray.filter(user => !assignedUserIds.includes(user.id))
}

const getUserInitials = (user) => {
  if (!user) return 'U'

  const nombres = user.nombres || ''
  const apellidos = user.apellidos || ''

  let initials = ''
  if (nombres) initials += nombres.charAt(0)
  if (apellidos) initials += apellidos.charAt(0)

  return initials.toUpperCase() || 'U'
}

// Obtener nombre del rol según ID
const getRolName = (rolId) => {
  const roles = {
    1: 'Admin',
    2: 'Responsable',
    3: 'Investigador'
  }
  return roles[rolId] || 'Usuario'
}

// Obtener color según rol
const getRolColor = (rolId) => {
  const colors = {
    1: 'purple',
    2: 'teal',
    3: 'light-teal'
  }
  return colors[rolId] || 'grey'
}

// Abrir diálogo para establecer objetivo con estilo personalizado
const promptObjetivo = (user) => {
  objetivo.value = 1 // Reset a valor por defecto

  $q.dialog({
    title: 'Establecer objetivo',
    message: `¿Cuántas encuestas debe completar ${user.nombres} ${user.apellidos}?`,
    prompt: {
      model: objetivo.value,
      type: 'number',
      min: 1,
    },
    persistent: true,
    style: 'min-width: 450px; max-width: 95vw;',
    class: 'objetivo-dialog-custom',
    html: true, // Permitir HTML en el mensaje
    dark: false,
    ok: {
      color: 'teal',
      label: 'Asignar',
      unelevated: true,
      class: 'confirm-btn'
    },
    cancel: {
      flat: true,
      color: 'grey-7',
      class: 'cancel-btn'
    }
  }).onOk(objetivoValue => {
    assignUser(user, parseInt(objetivoValue))
  })
}

// Editar objetivo de una asignación existente
const editarObjetivo = (asignacion) => {
  $q.dialog({
    title: 'Editar objetivo',
    message: `¿Cuántas encuestas debe completar <span class="text-weight-bold text-purple">${asignacion.usuario.nombres} ${asignacion.usuario.apellidos}</span>?`,
    prompt: {
      model: asignacion.objetivo || 1,
      type: 'number',
      min: 1,
    },
    persistent: true,
    style: 'min-width: 450px; max-width: 95vw;',
    class: 'objetivo-dialog-custom',
    html: true,
    dark: false,
    ok: {
      color: 'purple',
      label: 'Actualizar',
      unelevated: true,
      class: 'confirm-btn'
    },
    cancel: {
      flat: true,
      color: 'grey-7',
      class: 'cancel-btn'
    }
  }).onOk(async (nuevoObjetivo) => {
    try {
      $q.loading.show({
        message: 'Actualizando objetivo...',
        spinnerColor: 'purple'
      })

      // Implementación para actualizar el objetivo de asignación
      const response = await api.put(`/asignaciones/${asignacion.id}`, {
        objetivo: parseInt(nuevoObjetivo)
      })

      if (response.data) {
        // Actualizar en el array local
        const index = asignaciones.value.findIndex(a => a.id === asignacion.id)
        if (index !== -1) {
          asignaciones.value[index].objetivo = parseInt(nuevoObjetivo)
        }

        $q.notify({
          type: 'positive',
          message: 'Objetivo actualizado correctamente',
          position: 'top',
          classes: 'notification-custom'
        })
      }

      $q.loading.hide()
    } catch (error) {
      $q.loading.hide()
      console.error('Error al actualizar objetivo:', error)
      $q.notify({
        type: 'negative',
        message: error.response?.data?.message || 'Error al actualizar el objetivo',
        position: 'top',
        classes: 'notification-custom'
      })
    }
  })
}

const loadEncuesta = async () => {
  try {
    const response = await api.get(`/encuestas/${props.encuestaId}`)
    encuesta.value = response.data
  } catch (error) {
    console.error('Error al cargar encuesta:', error)
    $q.notify({
      type: 'negative',
      message: 'Error al cargar la información de la encuesta',
      position: 'top',
      classes: 'notification-custom'
    })
  }
}

const loadUsuarios = async () => {
  loadingUsers.value = true
  try {
    const response = await api.get('/usuarios')
    usuarios.value = response.data.data || response.data || []

    // Refrescar AOS después de cargar los datos
    nextTick(() => refreshAOS())
  } catch (error) {
    console.error('Error al cargar usuarios:', error)
    $q.notify({
      type: 'negative',
      message: 'Error al cargar la lista de usuarios',
      position: 'top',
      classes: 'notification-custom'
    })
  } finally {
    loadingUsers.value = false
  }
}

const loadAsignaciones = async () => {
  if (!props.encuestaId) return

  loadingAsignaciones.value = true
  try {
    const response = await api.get('/asignaciones', {
      params: {
        encuesta_id: props.encuestaId
      }
    })
    asignaciones.value = response.data.data || response.data || []

    // Refrescar AOS después de cargar los datos
    nextTick(() => refreshAOS())
  } catch (error) {
    console.error('Error al cargar asignaciones:', error)
    $q.notify({
      type: 'negative',
      message: 'Error al cargar las asignaciones de esta encuesta',
      position: 'top',
      classes: 'notification-custom'
    })
  } finally {
    loadingAsignaciones.value = false
  }
}

const assignUser = async (user, objetivoValue) => {
  if (!user || !props.encuestaId) return

  try {
    $q.loading.show({
      message: 'Asignando usuario...',
      spinnerColor: 'teal'
    })

    const response = await api.post('/asignaciones', {
      encuesta_id: props.encuestaId,
      usuario_id: user.id,
      objetivo: objetivoValue || 1 // Usar el valor proporcionado o 1 por defecto
    })

    if (response.data) {
      // Refrescar lista de asignaciones
      await loadAsignaciones()

      $q.notify({
        type: 'positive',
        message: 'Usuario asignado correctamente',
        position: 'top',
        classes: 'notification-custom'
      })
    }

    $q.loading.hide()
  } catch (error) {
    $q.loading.hide()
    console.error('Error al asignar usuario:', error)
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'Error al asignar el usuario',
      position: 'top',
      classes: 'notification-custom'
    })
  }
}

const removeAsignacion = async (asignacion) => {
  $q.dialog({
    title: 'Confirmar eliminación',
    message: `¿Está seguro de eliminar la asignación de ${asignacion.usuario.nombres} ${asignacion.usuario.apellidos}?`,
    persistent: true,
    class: 'confirm-dialog',
    ok: {
      label: 'Sí, eliminar',
      color: 'negative',
      unelevated: true
    },
    cancel: {
      label: 'Cancelar',
      flat: true,
      color: 'grey-7'
    }
  }).onOk(async () => {
    try {
      $q.loading.show({
        message: 'Eliminando asignación...',
        spinnerColor: 'negative'
      })

      await api.delete(`/asignaciones/${asignacion.id}`)

      // Eliminar de la lista con animación
      asignaciones.value = asignaciones.value.filter(a => a.id !== asignacion.id)

      $q.notify({
        type: 'positive',
        message: 'Asignación eliminada correctamente',
        position: 'top',
        classes: 'notification-custom'
      })

      $q.loading.hide()

      // Refrescar AOS después de eliminar
      refreshAOS()
    } catch (error) {
      $q.loading.hide()
      console.error('Error al eliminar asignación:', error)
      $q.notify({
        type: 'negative',
        message: 'Error al eliminar la asignación',
        position: 'top',
        classes: 'notification-custom'
      })
    }
  })
}

const onClose = () => {
  emit('close')
  emit('refresh')
}

// Watchers
watch(() => props.encuestaId, async (newVal) => {
  if (newVal) {
    await Promise.all([
      loadEncuesta(),
      loadUsuarios(),
      loadAsignaciones()
    ])
  }
})

watch(() => isOpen.value, (val) => {
  if (val) {
    // Inicializar AOS cuando se abre el diálogo
    nextTick(() => {
      initAOS();
      refreshAOS();
    })
  }
})

// Ciclo de vida
onMounted(async () => {
  // Inicializar AOS
  initAOS()

  if (props.encuestaId) {
    await Promise.all([
      loadEncuesta(),
      loadUsuarios(),
      loadAsignaciones()
    ])
  }
})
</script>

<style lang="scss">
// Variables de colores
:root {
  --purple: #663399;
  --teal: #009999;
  --light-teal: #00AAAA;
  --white: #FFFFFF;
}

// Clases de colores personalizados
.bg-purple {
  background-color: var(--purple) !important;
}

.bg-teal {
  background-color: var(--teal) !important;
}

.bg-light-teal {
  background-color: var(--light-teal) !important;
}

.text-purple {
  color: var(--purple) !important;
}

.text-teal {
  color: var(--teal) !important;
}

.text-light-teal {
  color: var(--light-teal) !important;
}

.asignacion-dialog {
  .q-dialog__inner {
    &--maximized {
      backdrop-filter: blur(4px);
    }
  }
}

.asignacion-card {
  display: flex;
  flex-direction: column;
  max-height: 100vh;
  border-radius: 12px;
  overflow: hidden;

  // Header con gradiente personalizado
  .header-section {
    background: linear-gradient(135deg, var(--purple) 0%, var(--teal) 100%);
    padding: 20px 24px;
    position: relative;
    overflow: hidden;

    &::after {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      width: 100px;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
      animation: shine 3s infinite;
    }

    .close-btn {
      transition: all 0.3s ease;
      opacity: 0.8;

      &:hover {
        opacity: 1;
        background-color: rgba(255, 255, 255, 0.2);
        transform: rotate(90deg);
      }
    }
  }

  .content-section {
    flex: 1;
    overflow: hidden;
  }

  .panel-card {
    border-radius: 10px;
    overflow: hidden;
    transition: all 0.3s;
    height: 100%;
    border-color: rgba(0, 0, 0, 0.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);

    &:hover {
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }
  }

  .panel-header {
    padding: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .search-input {
      width: 230px;
      max-width: 100%;
      transition: all 0.3s;

      .q-field__control {
        border-radius: 20px;
      }

      &:focus-within {
        width: 250px;
      }
    }

    .refresh-btn {
      transition: all 0.3s;
      border-color: white;

      &:hover {
        background-color: rgba(255, 255, 255, 0.2);
        transform: rotate(180deg);
      }
    }

    .badge-count {
      transition: all 0.3s;

      &:hover {
        transform: scale(1.1);
      }
    }
  }

  .users-list-container {
    padding: 0;
    position: relative;

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      text-align: center;
      animation: fadeIn 0.5s;
    }
  }

  .users-scroll {
    transition: all 0.3s;

    &:hover {
      &::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.3);
      }
    }
  }

  .users-list {
    padding: 8px 0;

    .user-item, .asignacion-item {
      transition: all 0.3s;
      border-left: 3px solid transparent;

      &:hover {
        background-color: rgba(0, 153, 153, 0.05);
        border-left-color: var(--teal);
      }
    }

    .asignacion-item {
      &:hover {
        border-left-color: var(--purple);
      }
    }

    .avatar-user, .avatar-assigned {
      transition: all 0.3s;

      &:hover {
        transform: scale(1.1);
      }
    }

    .add-button {
      transition: all 0.3s;
      opacity: 0.8;

      &:hover {
        opacity: 1;
        transform: scale(1.2);
      }
    }

    .objetivo-label {
      margin-top: 4px;
      display: inline-flex;
      align-items: center;
      background-color: rgba(0, 153, 153, 0.1);
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
    }

    .action-buttons {
      .edit-btn, .delete-btn {
        transition: all 0.3s;
        opacity: 0.8;

        &:hover {
          opacity: 1;
          transform: translateY(-2px);
        }
      }
    }
  }

  .footer-actions {
    border-top: 1px solid rgba(0, 0, 0, 0.1);
    background-color: #f9fafb;

    .close-action-btn {
      transition: all 0.3s;

      &:hover {
        background-color: rgba(102, 51, 153, 0.1);
        transform: translateY(-2px);
      }
    }
  }
}

// Estilos para diálogos personalizados
.objective-dialog, .confirm-dialog {
  .q-dialog__inner {
    backdrop-filter: blur(3px);
  }

  .q-card {
    border-radius: 12px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  }
}

// Estilos para el nuevo diálogo personalizado de objetivos
.objetivo-dialog-custom {
  .q-dialog__inner {
    &::before {
      content: '';
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(4px);
      z-index: -1;
    }
  }

  .q-card {
    animation: modalEnter 0.4s ease-out;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
  }

  .q-card__section--vert:first-child {
    background: linear-gradient(135deg, var(--purple) 0%, var(--teal) 100%);
    color: white;
    padding: 20px 24px;
    position: relative;
    overflow: hidden;

    &::after {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      width: 100px;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
      animation: shine 3s infinite;
    }
  }

  .q-input {
    .q-field__control {
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
      transition: all 0.3s;
    }

    &:focus-within .q-field__control {
      transform: translateY(-2px);
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
    }
  }

  .text-purple {
    color: var(--purple) !important;
  }

  .confirm-btn {
    box-shadow: 0 3px 5px rgba(0, 0, 0, 0.1);
    transition: all 0.3s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }
  }

  .cancel-btn {
    transition: all 0.3s;

    &:hover {
      background-color: rgba(0, 0, 0, 0.05);
    }
  }
}

@keyframes modalEnter {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

// Notificaciones personalizadas
.notification-custom {
  border-left: 4px solid var(--teal);
  font-weight: 500;
  animation: slideInRight 0.5s ease-out;
}

// Animaciones
@keyframes shine {
  0% {
    left: -100px;
    opacity: 0;
  }
  20% {
    opacity: 0.5;
  }
  60% {
    opacity: 0.3;
  }
  100% {
    left: 100%;
    opacity: 0;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInRight {
  from {
    transform: translateX(30px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

// Animaciones personalizadas para las listas
.animated {
  animation-duration: 0.5s;
  animation-fill-mode: both;
}

.fadeIn {
  animation-name: fadeIn;
}

.fadeOut {
  animation-name: fadeOut;
}

.fadeInRight {
  animation-name: fadeInRight;
}

.fadeOutRight {
  animation-name: fadeOutRight;
}

@keyframes fadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

@keyframes fadeInRight {
  from {
    opacity: 0;
    transform: translateX(40px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes fadeOutRight {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(40px);
  }
}

// Estilos responsivos
@media (max-width: 768px) {
  .asignacion-card {
    .panel-header {
      flex-direction: column;
      align-items: stretch;

      .search-input {
        width: 100%;
        margin-top: 8px;
      }

      .refresh-btn {
        align-self: flex-end;
        margin-top: 8px;
      }
    }

    .users-list-container {
      .users-scroll {
        height: calc(100vh - 400px) !important;
      }
    }

    .action-buttons {
      flex-direction: column;

      .q-btn {
        margin-bottom: 4px;
      }
    }
  }
}
</style>
