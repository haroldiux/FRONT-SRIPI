<template>
  <q-dialog v-model="isOpen" persistent maximized class="asignacion-dialog" transition-show="fade"
    transition-hide="fade">
    <q-card class="asignacion-card">
      <!-- Header mejorado con gradiente -->
      <q-card-section class="header-section">
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
          <q-btn icon="close" flat round dense v-close-popup @click="onClose" class="close-btn" color="white" />
        </div>
      </q-card-section>

      <q-card-section class="q-pt-lg q-px-lg content-section">
        <div class="row q-col-gutter-lg">
          <!-- Panel de usuarios disponibles -->
          <div class="col-12 col-md-6">
            <q-card flat bordered class="panel-card">
              <q-card-section class="panel-header bg-purple">
                <div class="text-subtitle1 text-white text-weight-bold flex items-center">
                  <q-icon name="person" class="q-mr-sm" />
                  Usuarios Disponibles
                  <q-badge color="white" text-color="purple" class="q-ml-sm badge-count" v-if="filteredUsers.length">
                    {{ filteredUsers.length }}
                  </q-badge>
                </div>
                <q-input v-model="searchUser" dense outlined placeholder="Buscar usuario..." class="search-input"
                  clearable dark bg-color="rgba(255,255,255,0.2)">
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
                    <q-item v-for="user in filteredUsers" :key="`user-${user.id}`" clickable v-ripple
                      @click="promptObjetivo(user)" class="user-item">
                      <q-item-section avatar>
                        <q-avatar color="purple" text-color="white" class="avatar-user">
                          {{ getUserInitials(user) }}
                        </q-avatar>
                      </q-item-section>
                      <q-item-section>
                        <q-item-label class="text-weight-medium">{{ user.nombres }} {{ user.apellidos }}</q-item-label>
                        <q-item-label caption class="user-info">
                          <span>{{ user.usuario }}</span>
                          <q-badge :color="getRolColor(user.rol_id)" class="q-ml-sm">{{ getRolName(user.rol_id)
                          }}</q-badge>
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
          <div class="col-12 col-md-6">
            <q-card flat bordered class="panel-card">
              <!-- Botón de autoasignación para académicos -->
              <q-card-section v-if="userIsAcademico" class="self-assign-section">
                <q-banner rounded class="bg-deep-purple text-white self-assign-banner">
                  <template v-slot:avatar>
                    <q-icon name="person_add" />
                  </template>
                  <div class="text-subtitle1 text-weight-medium">Autoasignación</div>
                  <div class="text-caption q-mt-xs">Como académico, puedes autoasignarte a esta encuesta</div>

                  <template v-slot:action>
                    <q-btn v-if="!isUserAssigned" unelevated color="white" text-color="deep-purple"
                      label="Autoasignarme" @click="promptSelfAssign" class="self-assign-btn" />
                    <div v-else class="already-assigned">
                      <q-icon name="check_circle" color="white" class="q-mr-sm" />
                      Ya estás asignado
                    </div>
                  </template>
                </q-banner>
              </q-card-section>
              <q-card-section class="panel-header bg-teal">
                <div class="text-subtitle1 text-white text-weight-bold flex items-center">
                  <q-icon name="assignment_ind" class="q-mr-sm" />
                  Usuarios Asignados
                  <q-badge color="white" text-color="teal" class="q-ml-sm badge-count" v-if="asignaciones.length">
                    {{ asignaciones.length }}
                  </q-badge>
                </div>
                <q-btn outline color="white" label="Actualizar" icon="refresh" dense class="refresh-btn" size="sm"
                  @click="loadAsignaciones">
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
                    <q-item v-for="asignacion in asignaciones" :key="`asignacion-${asignacion.id}`" v-ripple
                      class="asignacion-item">
                      <q-item-section avatar>
                        <q-avatar color="teal" text-color="white" class="avatar-assigned">
                          {{ getUserInitials(asignacion.usuario) }}
                        </q-avatar>
                      </q-item-section>
                      <q-item-section>
                        <q-item-label class="text-weight-medium">{{ asignacion.usuario.nombres || '' }} {{
                          asignacion.usuario.apellidos || '' }}</q-item-label>
                        <q-item-label caption>{{ asignacion.usuario.usuario }}</q-item-label>
                        <q-item-label caption class="objetivo-label">
                          <q-icon name="target" size="16px" class="q-mr-xs" color="teal" />
                          <span>Objetivo: <b>{{ asignacion.objetivo || 0 }}</b> encuestas</span>
                        </q-item-label>
                      </q-item-section>
                      <q-item-section side>
                        <div class="row q-gutter-xs action-buttons">
                          <q-btn flat round color="purple" icon="edit" size="sm" @click="editarObjetivo(asignacion)"
                            class="edit-btn">
                            <q-tooltip>Editar objetivo</q-tooltip>
                          </q-btn>
                          <q-btn flat round color="negative" icon="delete" size="sm"
                            @click="removeAsignacion(asignacion)" class="delete-btn">
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
        <q-btn flat label="Cerrar" color="purple" v-close-popup @click="onClose" class="close-action-btn" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'src/boot/axios'
import { useAuthStore } from 'src/stores/auth.store'
const auth = useAuthStore()

const userIsAcademico = computed(() => {
  return auth.user && auth.user.rol_id === 4
})

// Verificar si el usuario actual ya está asignado
const isUserAssigned = computed(() => {
  if (!auth.user) return false
  return asignaciones.value.some(a => a.usuario_id === auth.user.id)
})
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



// Roles permitidos (2 = Responsable, 3 = Investigador)
const rolesPermitidos = [2, 3, 4]

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
    3: 'Investigador',
    4: 'Académico'
  }
  return roles[rolId] || 'Usuario'
}

// Obtener color según rol
const getRolColor = (rolId) => {
  const colors = {
    1: 'purple',
    2: 'teal',
    3: 'light-teal',
    4: 'deep-purple'
  }
  return colors[rolId] || 'grey'
}

// Abrir diálogo para establecer objetivo con estilo mejorado para móviles
const promptObjetivo = (user) => {
  $q.dialog({
    title: '<div class="text-h5 text-weight-bold">Establecer objetivo</div>',
    message: `<div class="q-mb-md">¿Cuántas encuestas debe completar <strong class="text-teal">${user.nombres} ${user.apellidos}</strong>?</div>`,
    prompt: {
      model: '1',
      type: 'number',
      min: 1,
      inputmode: 'numeric',
      outlined: true,
      dense: false,
      class: 'text-h4 text-center text-weight-bold mobile-objetivo-input',
      style: 'font-size: 32px; text-align: center; padding: 20px;'
    },
    html: true,
    persistent: true,
    class: 'objetivo-dialog-enhanced',
    style: 'min-width: 90vw; max-width: 500px;',
    ok: {
      label: 'Asignar',
      color: 'teal',
      unelevated: true,
      size: 'lg',
      class: 'q-px-xl q-py-md text-weight-bold',
      style: 'min-height: 50px; font-size: 16px;'
    },
    cancel: {
      label: 'Cancelar',
      flat: true,
      color: 'grey-7',
      size: 'lg',
      class: 'q-px-xl q-py-md',
      style: 'min-height: 50px; font-size: 16px;'
    }
  }).onOk(objetivoValue => {
    assignUser(user, parseInt(objetivoValue) || 1)
  })
}

// Editar objetivo de una asignación existente con mejor UX móvil
const editarObjetivo = (asignacion) => {
  $q.dialog({
    title: '<div class="text-h5 text-weight-bold">Editar objetivo</div>',
    message: `<div class="q-mb-md">¿Cuántas encuestas debe completar <strong class="text-purple">${asignacion.usuario.nombres} ${asignacion.usuario.apellidos}</strong>?</div>`,
    prompt: {
      model: String(asignacion.objetivo || 1),
      type: 'number',
      min: 1,
      inputmode: 'numeric',
      outlined: true,
      dense: false,
      class: 'text-h4 text-center text-weight-bold mobile-objetivo-input',
      style: 'font-size: 32px; text-align: center; padding: 20px;'
    },
    html: true,
    persistent: true,
    class: 'objetivo-dialog-enhanced',
    style: 'min-width: 90vw; max-width: 500px;',
    ok: {
      label: 'Actualizar',
      color: 'purple',
      unelevated: true,
      size: 'lg',
      class: 'q-px-xl q-py-md text-weight-bold',
      style: 'min-height: 50px; font-size: 16px;'
    },
    cancel: {
      label: 'Cancelar',
      flat: true,
      color: 'grey-7',
      size: 'lg',
      class: 'q-px-xl q-py-md',
      style: 'min-height: 50px; font-size: 16px;'
    }
  }).onOk(async (nuevoObjetivo) => {
    try {
      $q.loading.show({
        message: 'Actualizando objetivo...',
        spinnerColor: 'purple'
      })

      const response = await api.put(`/asignaciones/${asignacion.id}`, {
        objetivo: parseInt(nuevoObjetivo) || 1
      })

      if (response.data) {
        const index = asignaciones.value.findIndex(a => a.id === asignacion.id)
        if (index !== -1) {
          asignaciones.value[index].objetivo = parseInt(nuevoObjetivo) || 1
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

// Manejar autoasignación para académicos con mejor UX móvil
const promptSelfAssign = () => {
  if (!auth.user) return

  $q.dialog({
    title: '<div class="text-h5 text-weight-bold">Autoasignación</div>',
    message: '<div class="q-mb-md">¿Cuántas encuestas te gustaría realizar para esta investigación?</div>',
    prompt: {
      model: '1',
      type: 'number',
      min: 1,
      inputmode: 'numeric',
      outlined: true,
      dense: false,
      class: 'text-h4 text-center text-weight-bold mobile-objetivo-input',
      style: 'font-size: 32px; text-align: center; padding: 20px;'
    },
    html: true,
    persistent: true,
    class: 'objetivo-dialog-enhanced',
    style: 'min-width: 90vw; max-width: 500px;',
    ok: {
      label: 'Confirmar',
      color: 'deep-purple',
      unelevated: true,
      size: 'lg',
      class: 'q-px-xl q-py-md text-weight-bold',
      style: 'min-height: 50px; font-size: 16px;'
    },
    cancel: {
      label: 'Cancelar',
      flat: true,
      color: 'grey-7',
      size: 'lg',
      class: 'q-px-xl q-py-md',
      style: 'min-height: 50px; font-size: 16px;'
    }
  }).onOk(async (objetivoValue) => {
    try {
      $q.loading.show({
        message: 'Procesando autoasignación...',
        spinnerColor: 'deep-purple'
      })

      const response = await api.post('/asignaciones', {
        encuesta_id: props.encuestaId,
        usuario_id: auth.user.id,
        objetivo: parseInt(objetivoValue) || 1
      })

      if (response.data) {
        await loadAsignaciones()

        $q.notify({
          type: 'positive',
          message: 'Te has asignado correctamente a esta encuesta',
          position: 'top',
          classes: 'notification-custom'
        })
      }

      $q.loading.hide()
    } catch (error) {
      $q.loading.hide()
      console.error('Error en autoasignación:', error)
      $q.notify({
        type: 'negative',
        message: error.response?.data?.message || 'Error al realizar la autoasignación',
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
    // Cargar cada tipo de rol y combinar resultados
    // Solicitamos un número grande por página para asegurar que traemos todos
    const params = { perPage: 1000, status: 1 }

    const [usuariosResponsables, usuariosInvestigadores, usuariosAcademicos] = await Promise.all([
      api.get('/usuarios', { params: { ...params, role: 2 } }),
      api.get('/usuarios', { params: { ...params, role: 3 } }),
      api.get('/usuarios', { params: { ...params, role: 4 } })
    ])

    const responsables = usuariosResponsables.data.data || usuariosResponsables.data || [];
    const investigadores = usuariosInvestigadores.data.data || usuariosInvestigadores.data || [];
    const academicos = usuariosAcademicos.data.data || usuariosAcademicos.data || [];

    usuarios.value = [...responsables, ...investigadores, ...academicos];

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

  }
})

// Ciclo de vida
onMounted(async () => {
  // Inicializar AOS


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
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
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

    .user-item,
    .asignacion-item {
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

    .avatar-user,
    .avatar-assigned {
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

      .edit-btn,
      .delete-btn {
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
.objective-dialog,
.confirm-dialog {
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

// Estilos para el nuevo diálogo móvil de objetivos
.objetivo-dialog-mobile {
  max-width: 500px;
  width: 95vw;
  border-radius: 16px;
  overflow: hidden;

  .dialog-header {
    padding: 24px;
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

  .bg-gradient {
    background: linear-gradient(135deg, var(--purple) 0%, var(--teal) 100%);
  }

  .bg-gradient-purple {
    background: linear-gradient(135deg, var(--purple) 0%, #8e44ad 100%);
  }

  .bg-gradient-deep-purple {
    background: linear-gradient(135deg, #673AB7 0%, #9C27B0 100%);
  }

  .objetivo-input-container {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
    padding: 20px;
    background: linear-gradient(135deg, rgba(102, 51, 153, 0.05), rgba(0, 153, 153, 0.05));
    border-radius: 16px;
    margin: 16px 0;
  }

  .control-btn {
    width: 60px;
    height: 60px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transition: all 0.3s ease;

    &:hover:not(:disabled) {
      transform: scale(1.1);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
    }

    &:active:not(:disabled) {
      transform: scale(0.95);
    }

    &:disabled {
      opacity: 0.4;
    }
  }

  .objetivo-display {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-width: 120px;
    padding: 16px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  .objetivo-value {
    font-size: 48px;
    font-weight: bold;
    color: var(--purple);
    line-height: 1;
    background: linear-gradient(135deg, var(--purple), var(--teal));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .objetivo-label {
    font-size: 14px;
    color: #666;
    margin-top: 4px;
    font-weight: 500;
  }

  .mobile-number-input {
    .q-field__control {
      height: 56px;
      font-size: 18px;
    }

    input {
      text-align: center;
      font-size: 20px;
      font-weight: 500;
    }
  }

  .mobile-btn {
    min-width: 120px;
    height: 48px;
    font-size: 16px;
    font-weight: 500;
    border-radius: 8px;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    &:active {
      transform: translateY(0);
    }
  }

  .confirm-btn {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
}

// Mejoras responsivas adicionales
@media (max-width: 768px) {
  .asignacion-card {
    .header-section {
      padding: 14px 16px;

      .text-h5 {
        font-size: 1.15rem;
        line-height: 1.3;
      }

      .text-caption {
        font-size: 0.8rem;
      }

      .close-btn {
        padding: 8px;
      }
    }

    .content-section {
      padding: 12px !important;
      overflow-y: auto;
    }

    .panel-card {
      margin-bottom: 16px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    .panel-header {
      padding: 14px 16px;
      flex-direction: column;
      align-items: stretch;
      gap: 12px;

      .text-subtitle1 {
        font-size: 1rem;
      }

      .search-input {
        width: 100%;
        margin-top: 10px;

        input {
          font-size: 15px;
        }
      }

      .refresh-btn {
        align-self: flex-end;
        margin-top: 8px;
        min-width: 44px;
        min-height: 44px;
      }

      .badge-count {
        font-size: 12px;
        padding: 4px 8px;
      }
    }

    .users-list-container {
      padding: 8px;

      .users-scroll {
        height: 280px !important;
      }
    }

    .empty-state {
      padding: 32px 16px;

      .q-icon {
        font-size: 56px !important;
      }

      .text-subtitle1 {
        font-size: 15px;
      }

      .text-caption {
        font-size: 13px;
      }
    }

    // Mejorar items de usuario
    .user-item,
    .asignacion-item {
      padding: 14px 12px;
      border-radius: 8px;
      margin-bottom: 4px;

      .q-avatar {
        width: 42px;
        height: 42px;
        font-size: 16px;
      }

      .q-item-label {
        font-size: 14px;
        line-height: 1.4;
      }

      .user-info,
      .asignacion-info {
        font-size: 12px;
        margin-top: 4px;
      }

      .q-badge {
        font-size: 10px;
        padding: 2px 6px;
      }

      .q-btn {
        min-width: 48px;
        min-height: 48px;
        border-radius: 10px;

        .q-icon {
          font-size: 20px;
        }
      }

      .add-button,
      .edit-button,
      .remove-button {
        width: 48px;
        height: 48px;
      }
    }

    .action-buttons {
      flex-direction: row;
      gap: 8px;
      padding: 12px;

      .q-btn {
        flex: 1;
        margin-bottom: 0;
        min-height: 48px;
        font-size: 14px;
      }
    }

    .self-assign-section {
      padding: 12px;

      .self-assign-banner {
        padding: 14px;
        border-radius: 10px;

        .text-subtitle1 {
          font-size: 15px;
        }

        .text-caption {
          font-size: 12px;
        }

        .self-assign-btn {
          min-height: 42px;
          font-size: 14px;
          padding: 0 20px;
        }

        .already-assigned {
          font-size: 13px;
          padding: 8px 14px;
        }
      }
    }

    .footer-actions {
      padding: 14px 16px;

      .close-action-btn {
        min-height: 50px;
        font-size: 16px;
        padding: 0 28px;
        border-radius: 10px;
      }
    }
  }

  // Ajustes para el scroll area
  .q-scrollarea__content {
    padding-right: 4px;
  }

  // Mejorar tooltips en móvil
  .q-tooltip {
    font-size: 13px;
    padding: 6px 10px;
  }
}

// Estilos para móviles pequeños
@media (max-width: 480px) {
  .asignacion-card {
    .header-section {
      padding: 12px;

      .text-h5 {
        font-size: 1.05rem;
      }

      .text-caption {
        font-size: 0.75rem;
      }
    }

    .content-section {
      padding: 8px !important;
    }

    .panel-header {
      padding: 12px;

      .text-subtitle1 {
        font-size: 0.95rem;
      }

      .search-input {
        input {
          font-size: 14px;
        }
      }
    }

    .users-list-container {
      padding: 6px;

      .users-scroll {
        height: 250px !important;
      }
    }

    .user-item,
    .asignacion-item {
      padding: 12px 10px;

      .q-avatar {
        width: 38px;
        height: 38px;
        font-size: 14px;
      }

      .q-item-label {
        font-size: 13px;
      }

      .user-info,
      .asignacion-info {
        font-size: 11px;
      }

      .q-btn {
        min-width: 44px;
        min-height: 44px;

        .q-icon {
          font-size: 18px;
        }
      }
    }

    .self-assign-section {
      padding: 10px;

      .self-assign-banner {
        padding: 12px;

        .text-subtitle1 {
          font-size: 14px;
        }

        .text-caption {
          font-size: 11px;
        }

        .self-assign-btn {
          min-height: 40px;
          font-size: 13px;
          padding: 0 16px;
        }
      }
    }

    .footer-actions {
      padding: 12px;

      .close-action-btn {
        min-height: 48px;
        font-size: 15px;
        padding: 0 24px;
      }
    }
  }
}

// Mejoras para tablets en orientación landscape
@media (min-width: 769px) and (max-width: 1024px) {
  .asignacion-card {
    .users-list-container {
      .users-scroll {
        height: calc(100vh - 350px) !important;
      }
    }

    .user-item,
    .asignacion-item {
      padding: 12px 14px;

      .q-btn {
        min-width: 40px;
        min-height: 40px;
      }
    }
  }
}

.bg-deep-purple {
  background-color: #673AB7 !important;
}

.text-deep-purple {
  color: #673AB7 !important;
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
    .header-section {
      padding: 16px;

      .text-h5 {
        font-size: 1.1rem;
      }
    }

    .panel-header {
      flex-direction: column;
      align-items: stretch;
      gap: 10px;

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
        height: 300px !important;
      }
    }

    .content-section {
      overflow-y: auto;
      padding: 10px !important;
    }

    .action-buttons {
      flex-direction: row;

      .q-btn {
        margin-bottom: 0;
      }
    }
  }
}

.self-assign-section {
  margin-bottom: 16px;
}

.self-assign-banner {
  border-left: 4px solid var(--purple);
  animation: fadeIn 0.8s;
}

.self-assign-btn {
  transition: all 0.3s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
}

.already-assigned {
  display: flex;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.2);
  padding: 8px 12px;
  border-radius: 20px;
  font-weight: 500;
}

.bg-deep-purple {
  background-color: #673AB7 !important;
}

.text-deep-purple {
  color: #673AB7 !important;
}

// Estilos mejorados para los diálogos de objetivo
.objetivo-dialog-enhanced {
  .q-dialog__inner {
    padding: 16px;
  }

  .q-card {
    border-radius: 20px;
    box-shadow: 0 12px 48px rgba(0, 0, 0, 0.2);
    overflow: hidden;
  }

  .q-card__section {
    padding: 28px 24px;
  }

  // Título del diálogo
  .q-dialog__title {
    font-size: 24px;
    font-weight: 700;
    color: #1a1a1a;
    margin-bottom: 8px;
  }

  // Mensaje del diálogo
  .q-dialog__message {
    font-size: 16px;
    line-height: 1.6;
    color: #555;
    margin-bottom: 24px;
  }

  // Input grande y centrado para móviles
  .q-field {
    margin: 24px 0;

    .q-field__control {
      height: auto;
      min-height: 90px;
      border-radius: 16px;
      background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);
      border: 3px solid #e0e0e0;
      transition: all 0.3s ease;

      &:hover {
        border-color: #00bcd4;
        box-shadow: 0 4px 12px rgba(0, 188, 212, 0.15);
      }

      &.q-field__control--focused {
        border-color: #00bcd4;
        box-shadow: 0 6px 20px rgba(0, 188, 212, 0.25);
        background: #ffffff;
      }
    }

    input {
      font-size: 48px !important;
      font-weight: 800 !important;
      text-align: center !important;
      color: #00bcd4 !important;
      padding: 24px 16px !important;
      letter-spacing: 2px;
    }

    .q-field__label {
      font-size: 14px;
      font-weight: 600;
      color: #777;
    }
  }

  // Botones de acción
  .q-card__actions {
    padding: 20px 24px 24px;
    gap: 12px;
    display: flex;
    justify-content: flex-end;

    .q-btn {
      font-size: 16px !important;
      font-weight: 600 !important;
      min-height: 54px !important;
      min-width: 120px !important;
      border-radius: 12px !important;
      text-transform: none !important;
      letter-spacing: 0.5px;
      transition: all 0.3s ease;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
      }

      &:active {
        transform: translateY(0);
      }

      // Botón de confirmar
      &.q-btn--unelevated {
        background: linear-gradient(135deg, #00bcd4 0%, #0097a7 100%);

        &:hover {
          background: linear-gradient(135deg, #00acc1 0%, #00838f 100%);
        }
      }

      // Botón de cancelar
      &.q-btn--flat {
        background: #f5f5f5;
        color: #666;

        &:hover {
          background: #eeeeee;
          color: #444;
        }
      }
    }
  }
}

// Estilos responsivos para tablets
@media (max-width: 1024px) {
  .objetivo-dialog-enhanced {
    .q-dialog__inner {
      padding: 12px;
    }

    .q-card__section {
      padding: 24px 20px;
    }

    .q-field {
      input {
        font-size: 42px !important;
      }
    }

    .q-card__actions {
      .q-btn {
        min-width: 110px !important;
        font-size: 15px !important;
      }
    }
  }
}

// Estilos responsivos para móviles
@media (max-width: 768px) {
  .objetivo-dialog-enhanced {
    .q-dialog__inner {
      padding: 8px;
    }

    .q-card {
      border-radius: 16px;
      margin: 0;
    }

    .q-card__section {
      padding: 20px 16px;
    }

    .q-dialog__title {
      font-size: 20px;
    }

    .q-dialog__message {
      font-size: 15px;
      margin-bottom: 20px;
    }

    .q-field {
      margin: 20px 0;

      .q-field__control {
        min-height: 100px;
        border-radius: 14px;
        border-width: 2px;
      }

      input {
        font-size: 56px !important;
        padding: 28px 12px !important;
      }
    }

    .q-card__actions {
      padding: 16px;
      gap: 10px;
      flex-direction: column-reverse;

      .q-btn {
        width: 100% !important;
        min-width: 100% !important;
        min-height: 56px !important;
        font-size: 17px !important;
        border-radius: 10px !important;
      }
    }
  }
}

// Estilos responsivos para móviles pequeños
@media (max-width: 480px) {
  .objetivo-dialog-enhanced {
    .q-card__section {
      padding: 16px 12px;
    }

    .q-dialog__title {
      font-size: 18px;
    }

    .q-dialog__message {
      font-size: 14px;
    }

    .q-field {
      .q-field__control {
        min-height: 95px;
      }

      input {
        font-size: 52px !important;
      }
    }

    .q-card__actions {
      .q-btn {
        min-height: 52px !important;
        font-size: 16px !important;
      }
    }
  }
}

// Animación de entrada
.objetivo-dialog-enhanced {
  animation: dialogFadeIn 0.3s ease-out;
}

@keyframes dialogFadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}


</style>
