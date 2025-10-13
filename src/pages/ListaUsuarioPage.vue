<template>
  <q-page padding>
    <!-- Header mejorado -->
    <div class="row items-center justify-between q-mb-xl">
      <div>
        <h4 class="text-h4 text-weight-bold q-ma-none">Gestión de Usuarios</h4>
        <p class="text-grey-7 q-mt-sm q-mb-none">Administra los usuarios del sistema</p>
      </div>
      <q-btn unelevated color="primary" icon="add" label="Nuevo Usuario" @click="onCreateUser" v-if="canCreateUser"
        size="md" class="q-px-lg" />
    </div>

    <!-- Card con tabla y filtros mejorados -->
    <q-card flat bordered class="shadow-1">
      <q-card-section class="q-pa-lg">
        <!-- Filtros mejorados -->
        <div class="row q-col-gutter-md q-mb-lg">
          <div class="col-12 col-md-5">
            <q-input v-model="filters.search" debounce="300" placeholder="Buscar por código, nombre o apellido..."
              outlined clearable @update:model-value="onFilter">
              <template v-slot:prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>

          <div class="col-6 col-md-3">
            <q-select v-model="filters.role" :options="roleOptions" label="Filtrar por Rol" outlined clearable
              emit-value map-options @update:model-value="onFilter">
              <template v-slot:prepend>
                <q-icon name="badge" />
              </template>
            </q-select>
          </div>

          <div class="col-6 col-md-3">
            <q-select v-model="filters.status" :options="statusOptions" label="Filtrar por Estado" outlined clearable
              emit-value map-options @update:model-value="onFilter">
              <template v-slot:prepend>
                <q-icon name="toggle_on" />
              </template>
            </q-select>
          </div>

          <div class="col-12 col-md-1 flex items-center">
            <q-btn flat round color="grey-7" icon="filter_list_off" @click="clearFilters" size="md">
              <q-tooltip>Limpiar filtros</q-tooltip>
            </q-btn>
          </div>
        </div>

        <!-- Tabla mejorada -->
        <q-table ref="tableRef" :rows="users" :columns="columns" row-key="id" :pagination="pagination"
          :loading="loading" @request="onRequest" binary-state-sort :rows-per-page-options="[10, 20, 50, 100]" flat
          class="custom-table">
          <!-- Header personalizado -->
          <template v-slot:header="props">
            <q-tr :props="props" class="bg-grey-2">
              <q-th v-for="col in props.cols" :key="col.name" :props="props" class="text-weight-bold text-grey-8">
                {{ col.label }}
              </q-th>
            </q-tr>
          </template>

          <!-- Código de Usuario -->
          <template v-slot:body-cell-usuario="props">
            <q-td :props="props">
              <div class="text-weight-medium text-primary">
                {{ props.row.usuario }}
              </div>
            </q-td>
          </template>

          <!-- Nombre completo -->
          <template v-slot:body-cell-fullName="props">
            <q-td :props="props">
              <div class="text-weight-medium">
                {{ props.row.nombres }} {{ props.row.apellidos }}
              </div>
            </q-td>
          </template>

          <!-- Rol con mejor diseño -->
          <template v-slot:body-cell-rol_id="props">
            <q-td :props="props">
              <q-chip :color="getRoleColor(props.row.rol_id)" text-color="white" size="sm" class="q-px-md">
                <q-icon :name="getRoleIcon(props.row.rol_id)" size="16px" class="q-mr-xs" />
                {{ getRoleLabel(props.row.rol_id) }}
              </q-chip>
            </q-td>
          </template>

          <!-- Estado con badge mejorado -->
          <template v-slot:body-cell-estado="props">
            <q-td :props="props">
              <q-badge :color="getEstadoColor(props.row)" :label="getEstadoLabel(props.row)" class="q-px-md q-py-xs" />
            </q-td>
          </template>

          <!-- Fecha con mejor formato -->
          <template v-slot:body-cell-created_at="props">
            <q-td :props="props">
              <div class="text-grey-7">
                {{ formatDate(props.row.created_at) }}
              </div>
            </q-td>
          </template>

          <!-- Acciones mejoradas -->
          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <div class="row q-gutter-xs justify-center">
                <q-btn flat round dense color="blue-grey-7" icon="visibility" @click="viewUser(props.row)" size="sm">
                  <q-tooltip>Ver detalles</q-tooltip>
                </q-btn>
                <q-btn flat round dense color="amber-8" icon="edit" @click="editUser(props.row)" size="sm"
                  v-if="canEditUser()">
                  <q-tooltip>Editar</q-tooltip>
                </q-btn>
                <q-btn flat round dense :color="getToggleButtonColor(props.row)" :icon="getToggleButtonIcon(props.row)"
                  @click="toggleUserStatus(props.row)" size="sm" v-if="canToggleUserStatus">
                  <q-tooltip>{{ getToggleButtonTooltip(props.row) }}</q-tooltip>
                </q-btn>
              </div>
            </q-td>
          </template>

          <!-- Loading personalizado -->
          <template v-slot:loading>
            <q-inner-loading showing color="primary" />
          </template>

          <!-- Sin datos -->
          <template v-slot:no-data>
            <div class="full-width column flex-center q-pa-xl">
              <q-icon size="4em" name="person_off" color="grey-5" />
              <span class="text-grey-7 text-h6 q-mt-md">No se encontraron usuarios</span>
              <span class="text-grey-6 q-mt-sm">Intenta ajustar los filtros de búsqueda</span>
            </div>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <!-- Dialog para ver detalles -->
    <q-dialog v-model="viewDialog">
      <q-card style="min-width: 450px">
        <q-card-section class="bg-blue-grey-1">
          <div class="text-h6 text-weight-medium">
            <q-icon name="account_circle" size="28px" class="q-mr-sm" />
            Detalles del Usuario
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section class="q-pa-lg">
          <div class="q-gutter-md" v-if="selectedUser">
            <div class="row">
              <div class="col-5 text-grey-7 text-weight-medium">Código:</div>
              <div class="col-7 text-weight-bold">{{ selectedUser.usuario }}</div>
            </div>

            <q-separator />

            <div class="row">
              <div class="col-5 text-grey-7 text-weight-medium">Nombre Completo:</div>
              <div class="col-7">{{ selectedUser.nombres }} {{ selectedUser.apellidos }}</div>
            </div>

            <q-separator />

            <div class="row">
              <div class="col-5 text-grey-7 text-weight-medium">Rol:</div>
              <div class="col-7">
                <q-chip :color="getRoleColor(selectedUser.rol_id)" text-color="white" size="sm">
                  {{ getRoleLabel(selectedUser.rol_id) }}
                </q-chip>
              </div>
            </div>

            <q-separator />

            <div class="row">
              <div class="col-5 text-grey-7 text-weight-medium">Estado:</div>
              <div class="col-7">
                <q-badge :color="getEstadoColor(selectedUser)" :label="getEstadoLabel(selectedUser)" />
              </div>
            </div>

            <q-separator />

            <div class="row">
              <div class="col-5 text-grey-7 text-weight-medium">Fecha Registro:</div>
              <div class="col-7">{{ formatDate(selectedUser.created_at) }}</div>
            </div>

            <!-- Documento SUS para estudiantes -->
            <template v-if="selectedUser.rol_id === 3 && selectedUser.sus">
              <q-separator />
              <div class="row">
                <div class="col-5 text-grey-7 text-weight-medium">Documento SUS:</div>
                <div class="col-7">
                  <q-btn color="blue" label="Ver documento" icon="description" flat dense
                    @click="viewSusFile(selectedUser.sus)" />
                </div>
              </div>
            </template>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Cerrar" color="primary" v-close-popup class="q-px-lg" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Componente CrearUsuarioForm -->
    <crear-usuario-form v-model="showUserForm" :edit-user="userToEdit" @save="onUserSaved" />
  </q-page>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import CrearUsuarioForm from 'components/usuarios/CrearUsuarioForm.vue'
import { api } from 'boot/axios'

export default {
  name: 'ListaUsuarioPage',
  components: {
    CrearUsuarioForm
  },

  setup() {
    const $q = useQuasar()

    // Estados
    const loading = ref(false)
    const users = ref([])
    const tableRef = ref(null)
    const viewDialog = ref(false)
    const selectedUser = ref(null)

    // Estado para el formulario de usuario
    const showUserForm = ref(false)
    const userToEdit = ref(null)

    // Filtros
    const filters = reactive({
      search: '',
      role: null,
      status: null
    })

    // Paginación
    const pagination = ref({
      sortBy: 'created_at',
      descending: true,
      page: 1,
      rowsPerPage: 10,
      rowsNumber: 0
    })

    // Columnas de la tabla
    const columns = [
      {
        name: 'usuario',
        required: true,
        label: 'Código',
        align: 'left',
        field: 'usuario',
        sortable: true
      },
      {
        name: 'fullName',
        label: 'Nombre Completo',
        align: 'left',
        field: row => `${row.nombres} ${row.apellidos}`,
        sortable: true
      },
      {
        name: 'rol_id',
        label: 'Rol',
        align: 'center',
        field: 'rol_id',
        sortable: true
      },
      {
        name: 'estado',
        label: 'Estado',
        align: 'center',
        field: 'estado',
        sortable: true
      },
      {
        name: 'created_at',
        label: 'Fecha Registro',
        align: 'center',
        field: 'created_at',
        sortable: true
      },
      {
        name: 'actions',
        label: 'Acciones',
        align: 'center',
        field: 'actions'
      }
    ]

    // Opciones de select - Sin mostrar Administrador
    const roleOptions = [
      { label: 'Responsable', value: 2 },
      { label: 'Encuestador', value: 3 }
    ]

    const statusOptions = [
      { label: 'Activo', value: 1 },
      { label: 'Inactivo', value: 0 }
    ]

    // Permisos
    // Asumimos que es admin para pruebas
    const currentUserRole = ref(1)

    const canCreateUser = computed(() => {
      return [1, 2].includes(currentUserRole.value)
    })

    const canEditUser = () => {
      return [1, 2].includes(currentUserRole.value)
    }

    const canDeleteUser = () => {
      return currentUserRole.value === 1
    }

    // CORRECCIÓN: Cambiado a computed para que funcione correctamente en la plantilla
    const canToggleUserStatus = computed(() => {
      return [1, 2].includes(currentUserRole.value)
    })

    // Funciones de utilidad para el estado
    // NUEVAS FUNCIONES PARA MANEJAR EL ESTADO CORRECTAMENTE
    const getEstadoValue = (user) => {
      // Normaliza el valor del estado a un número (1 o 0)
      return user && user.estado === 1 ? 1 : 0
    }

    const getEstadoColor = (user) => {
      return getEstadoValue(user) === 1 ? 'positive' : 'grey-5'
    }

    const getEstadoLabel = (user) => {
      return getEstadoValue(user) === 1 ? 'Activo' : 'Inactivo'
    }

    const getToggleButtonColor = (user) => {
      return getEstadoValue(user) === 1 ? 'red-6' : 'green-6'
    }

    const getToggleButtonIcon = (user) => {
      return getEstadoValue(user) === 1 ? 'toggle_off' : 'toggle_on'
    }

    const getToggleButtonTooltip = (user) => {
      return getEstadoValue(user) === 1 ? 'Desactivar' : 'Activar'
    }

    // Funciones auxiliares
    const getRoleColor = (roleId) => {
      const colors = {
        1: 'red-7',
        2: 'orange-7',
        3: 'blue-7'
      }
      return colors[roleId] || 'grey'
    }

    const getRoleIcon = (roleId) => {
      const icons = {
        1: 'admin_panel_settings',
        2: 'school',
        3: 'science'
      }
      return icons[roleId] || 'person'
    }

    const getRoleLabel = (roleId) => {
      const labels = {
        1: 'Administrador',
        2: 'Responsable',
        3: 'Encuestador'
      }
      return labels[roleId] || 'Desconocido'
    }

    const formatDate = (dateString) => {
      if (!dateString) return '-'
      const date = new Date(dateString)
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }

    // Funciones CRUD
    const fetchUsers = async (props = { pagination: pagination.value }) => {
      loading.value = true
      try {
        const { page, rowsPerPage, sortBy, descending } = props.pagination || pagination.value

        // Obtener usuarios desde la API
        const response = await api.get('/api/usuarios', {
          params: {
            page,
            perPage: rowsPerPage,
            sortBy,
            sortDesc: descending ? 1 : 0,
            search: filters.search || undefined,
            role: filters.role || undefined,
            status: filters.status !== null ? filters.status : undefined,
            exclude_admin: true // Excluir administradores
          }
        })

        // Actualizar datos de la tabla
        if (response.data && response.data.data) {
          // Filtrar usuarios (no mostrar administradores)
          const filteredUsers = response.data.data
            .filter(user => user.rol_id !== 1)
            // Asegurar que el estado sea un número y normalizar
            .map(user => ({
              ...user,
              // Convertir el estado a un número (1 o 0)
              estado: user.estado === true || user.estado === 1 || user.estado === '1' ? 1 : 0
            }))

          console.log('Usuarios cargados:', filteredUsers)
          users.value = filteredUsers
          pagination.value.rowsNumber = response.data.total || filteredUsers.length
        } else {
          users.value = []
          pagination.value.rowsNumber = 0
        }

        pagination.value.page = page
        pagination.value.rowsPerPage = rowsPerPage
        pagination.value.sortBy = sortBy
        pagination.value.descending = descending
      } catch (error) {
        console.error('Error al cargar usuarios:', error)
        $q.notify({
          type: 'negative',
          message: error.response?.data?.message || 'Error al cargar los usuarios',
          position: 'top'
        })
        users.value = []
        pagination.value.rowsNumber = 0
      } finally {
        loading.value = false
      }
    }

    const onRequest = (props) => {
      fetchUsers(props)
    }

    const onFilter = () => {
      pagination.value.page = 1
      tableRef.value.requestServerInteraction()
    }

    const clearFilters = () => {
      filters.search = ''
      filters.role = null
      filters.status = null
      onFilter()
    }

    const onCreateUser = () => {
      userToEdit.value = null
      showUserForm.value = true
    }

    const viewUser = (user) => {
      selectedUser.value = user
      viewDialog.value = true
    }

    const editUser = (user) => {
      userToEdit.value = { ...user }
      showUserForm.value = true
    }

    const viewSusFile = (fileUrl) => {
      if (fileUrl) {
        // Usar la ruta web directa en lugar de la API
        const url = `${api.defaults.baseURL.replace('/api', '')}/ver-documento/${encodeURIComponent(fileUrl)}`;
        console.log(`Intentando abrir: ${url}`);
        window.open(url, '_blank');
      } else {
        $q.notify({
          type: 'warning',
          message: 'No hay documento disponible',
          position: 'top'
        });
      }
    }

    // CORRECCIÓN: Función toggleUserStatus completamente implementada
    const toggleUserStatus = async (user) => {
      try {
        console.log(`Cambiando estado del usuario ${user.id} (${user.usuario}) - Estado actual: ${user.estado}`)

        // Llamar a la API para cambiar el estado
        const response = await api.post(`/api/usuarios/${user.id}/toggle-status`)

        if (response.data && response.data.data) {
          console.log('Respuesta del servidor:', response.data)

          // Encontrar el usuario en la lista y actualizar su estado
          const index = users.value.findIndex(u => u.id === user.id)
          if (index !== -1) {
            // Actualizar el estado según la respuesta del servidor
            users.value[index].estado = response.data.data.estado === true ||
              response.data.data.estado === 1 ||
              response.data.data.estado === '1' ? 1 : 0

            console.log(`Estado actualizado: ${users.value[index].estado}`)
          }

          // Mostrar notificación de éxito
          $q.notify({
            type: 'positive',
            message: `Usuario ${getEstadoValue(user) === 1 ? 'desactivado' : 'activado'} correctamente`,
            position: 'top'
          })
        }
      } catch (error) {
        console.error('Error al cambiar estado:', error)
        $q.notify({
          type: 'negative',
          message: error.response?.data?.message || 'Error al cambiar el estado del usuario',
          position: 'top'
        })
      }
    }

    const onUserSaved = () => {
      // Refrescar la lista después de guardar
      tableRef.value.requestServerInteraction()

      $q.notify({
        type: 'positive',
        message: userToEdit.value ? 'Usuario actualizado exitosamente' : 'Usuario creado exitosamente',
        position: 'top'
      })
    }

    // Lifecycle
    onMounted(() => {
      tableRef.value.requestServerInteraction()
    })

    return {
      loading,
      users,
      tableRef,
      viewDialog,
      selectedUser,
      filters,
      columns,
      pagination,
      roleOptions,
      statusOptions,
      showUserForm,
      userToEdit,
      canCreateUser,
      canEditUser,
      canDeleteUser,
      canToggleUserStatus,
      getEstadoColor,
      getEstadoLabel,
      getToggleButtonColor,
      getToggleButtonIcon,
      getToggleButtonTooltip,
      onRequest,
      onFilter,
      clearFilters,
      onCreateUser,
      viewUser,
      editUser,
      toggleUserStatus,
      onUserSaved,
      viewSusFile,
      getRoleColor,
      getRoleIcon,
      getRoleLabel,
      formatDate
    }
  }
}
</script>

<style lang="scss" scoped>
.custom-table {
  :deep(.q-table__top) {
    padding: 12px 16px;
  }

  :deep(.q-table thead tr),
  :deep(.q-table tbody td) {
    height: 60px;
  }

  :deep(.q-table__bottom) {
    border-top: 1px solid rgba(0, 0, 0, 0.12);
  }
}
</style>
