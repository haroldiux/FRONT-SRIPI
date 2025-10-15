<template>
  <q-dialog v-model="isOpen" persistent maximized>
    <q-card class="asignacion-dialog">
      <q-card-section class="row items-center q-pb-none header">
        <div class="text-h6">{{ encuesta ? encuesta.titulo : 'Asignación de Encuesta' }}</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup @click="onClose" />
      </q-card-section>

      <q-card-section class="q-pt-sm q-px-md">
        <div class="row q-col-gutter-md">
          <!-- Panel de usuarios disponibles -->
          <div class="col-12 col-md-6">
            <q-card flat bordered class="panel-card">
              <q-card-section class="panel-header bg-blue-1">
                <div class="text-subtitle1 text-weight-bold flex items-center">
                  <q-icon name="person" class="q-mr-sm" />
                  Usuarios Disponibles
                  <q-badge color="primary" class="q-ml-sm" v-if="filteredUsers.length">{{ filteredUsers.length }}</q-badge>
                </div>
                <q-input
                  v-model="searchUser"
                  dense
                  outlined
                  placeholder="Buscar usuario..."
                  class="search-input"
                  clearable
                >
                  <template v-slot:append>
                    <q-icon name="search" />
                  </template>
                </q-input>
              </q-card-section>

              <q-card-section class="users-list-container">
                <div v-if="loadingUsers" class="flex flex-center q-py-md">
                  <q-spinner color="primary" size="40px" />
                </div>
                <div v-else-if="!filteredUsers.length" class="text-center q-pa-md text-grey-7">
                  No se encontraron usuarios disponibles
                </div>
                <q-scroll-area style="height: calc(100vh - 320px)" class="full-width">
                  <q-list separator class="users-list">
                    <q-item
                      v-for="user in filteredUsers"
                      :key="user.id"
                      clickable
                      v-ripple
                      @click="promptObjetivo(user)"
                      class="user-item"
                    >
                      <q-item-section avatar>
                        <q-avatar color="blue-6" text-color="white">
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
                        <q-btn flat round color="primary" icon="add" size="sm" />
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
              <q-card-section class="panel-header bg-green-1">
                <div class="text-subtitle1 text-weight-bold flex items-center">
                  <q-icon name="assignment_ind" class="q-mr-sm" />
                  Usuarios Asignados
                  <q-badge color="green" class="q-ml-sm" v-if="asignaciones.length">{{ asignaciones.length }}</q-badge>
                </div>
                <q-btn
                  outline
                  color="primary"
                  label="Actualizar"
                  icon="refresh"
                  dense
                  class="refresh-btn"
                  size="sm"
                  @click="loadAsignaciones"
                />
              </q-card-section>

              <q-card-section class="users-list-container">
                <div v-if="loadingAsignaciones" class="flex flex-center q-py-md">
                  <q-spinner color="primary" size="40px" />
                </div>
                <div v-else-if="!asignaciones.length" class="text-center q-pa-md text-grey-7">
                  No hay usuarios asignados a esta encuesta
                </div>
                <q-scroll-area style="height: calc(100vh - 320px)" class="full-width">
                  <q-list separator class="users-list">
                    <q-item
                      v-for="asignacion in asignaciones"
                      :key="asignacion.id"
                      v-ripple
                      class="asignacion-item"
                    >
                      <q-item-section avatar>
                        <q-avatar color="green-7" text-color="white">
                          {{ getUserInitials(asignacion.usuario) }}
                        </q-avatar>
                      </q-item-section>
                      <q-item-section>
                        <q-item-label class="text-weight-medium">{{ asignacion.usuario.nombres || '' }} {{ asignacion.usuario.apellidos || '' }}</q-item-label>
                        <q-item-label caption>{{ asignacion.usuario.usuario }}</q-item-label>
                        <q-item-label caption class="objetivo-label">
                          <q-icon name="target" size="16px" class="q-mr-xs" color="green-7" />
                          <span>Objetivo: <b>{{ asignacion.objetivo || 0 }}</b> encuestas</span>
                        </q-item-label>
                      </q-item-section>
                      <q-item-section side>
                        <div class="row q-gutter-xs">
                          <q-btn
                            flat
                            round
                            color="primary"
                            icon="edit"
                            size="sm"
                            @click="editarObjetivo(asignacion)"
                            class="action-btn"
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
                            class="action-btn"
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

      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat label="Cerrar" color="primary" v-close-popup @click="onClose" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'src/boot/axios'

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
  return getUnassignedUsers(usersWithValidRoles).filter(user => {
    return user.nombres?.toLowerCase().includes(term) ||
           user.apellidos?.toLowerCase().includes(term) ||
           user.usuario?.toLowerCase().includes(term)
  })
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
    1: 'blue-10',
    2: 'blue-8',
    3: 'blue-6'
  }
  return colors[rolId] || 'grey'
}

// Abrir diálogo para establecer objetivo
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
    cancel: true,
    persistent: true,
    style: 'min-width: 300px'
  }).onOk(objetivoValue => {
    assignUser(user, parseInt(objetivoValue))
  })
}

// Editar objetivo de una asignación existente
const editarObjetivo = (asignacion) => {
  $q.dialog({
    title: 'Editar objetivo',
    message: `¿Cuántas encuestas debe completar ${asignacion.usuario.nombres} ${asignacion.usuario.apellidos}?`,
    prompt: {
      model: asignacion.objetivo || 1,
      type: 'number',
      min: 1,
    },
    cancel: true,
    persistent: true,
    style: 'min-width: 300px'
  }).onOk(async (nuevoObjetivo) => {
    try {
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
          position: 'top'
        })
      }
    } catch (error) {
      console.error('Error al actualizar objetivo:', error)
      $q.notify({
        type: 'negative',
        message: error.response?.data?.message || 'Error al actualizar el objetivo',
        position: 'top'
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
      position: 'top'
    })
  }
}

const loadUsuarios = async () => {
  loadingUsers.value = true
  try {
    const response = await api.get('/usuarios')
    usuarios.value = response.data.data || response.data || []
  } catch (error) {
    console.error('Error al cargar usuarios:', error)
    $q.notify({
      type: 'negative',
      message: 'Error al cargar la lista de usuarios',
      position: 'top'
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
      position: 'top'
    })
  } finally {
    loadingAsignaciones.value = false
  }
}

const assignUser = async (user, objetivoValue) => {
  if (!user || !props.encuestaId) return

  try {
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
        position: 'top'
      })
    }
  } catch (error) {
    console.error('Error al asignar usuario:', error)
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'Error al asignar el usuario',
      position: 'top'
    })
  }
}

const removeAsignacion = async (asignacion) => {
  $q.dialog({
    title: 'Confirmar eliminación',
    message: `¿Está seguro de eliminar la asignación de ${asignacion.usuario.nombres} ${asignacion.usuario.apellidos}?`,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      await api.delete(`/asignaciones/${asignacion.id}`)

      // Eliminar de la lista
      asignaciones.value = asignaciones.value.filter(a => a.id !== asignacion.id)

      $q.notify({
        type: 'positive',
        message: 'Asignación eliminada correctamente',
        position: 'top'
      })
    } catch (error) {
      console.error('Error al eliminar asignación:', error)
      $q.notify({
        type: 'negative',
        message: 'Error al eliminar la asignación',
        position: 'top'
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

// Ciclo de vida
onMounted(async () => {
  if (props.encuestaId) {
    await Promise.all([
      loadEncuesta(),
      loadUsuarios(),
      loadAsignaciones()
    ])
  }
})
</script>

<style lang="scss" scoped>
.asignacion-dialog {
  display: flex;
  flex-direction: column;
  max-height: 100vh;

  .header {
    background: linear-gradient(to right, #1976d2, #1a237e);
    color: white;
  }

  :deep(.q-card__section) {
    padding: 16px;
  }
}
</style>
