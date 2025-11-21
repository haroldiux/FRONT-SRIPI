<template>
    <q-page padding class="superadmin-users-page">
        <div class="q-pa-md">
            <!-- Header -->
            <div class="header-container q-mb-lg">
                <div class="row items-center">
                    <div class="col-12 col-md-8">
                        <h1 class="page-title text-h4 q-mb-sm">Gestión de Usuarios</h1>
                        <p class="text-subtitle1 q-mb-none subtitle-text">
                            Administra todos los usuarios del sistema
                        </p>
                    </div>
                    <div class="col-12 col-md-4 q-pt-sm q-pt-md-none text-right">
                        <q-btn color="primary" icon="add" label="Crear Admin" @click="showCreateAdminDialog = true"
                            class="create-btn" />
                    </div>
                </div>
            </div>

            <!-- Filtros -->
            <q-card class="filter-panel q-mb-md">
                <q-card-section class="q-pa-md">
                    <div class="row items-center q-col-gutter-md">
                        <div class="col-12 col-sm-6 col-md-4">
                            <q-input v-model="search" outlined dense clearable
                                placeholder="Buscar por nombre, apellido o cédula" @update:model-value="cargarUsuarios">
                                <template v-slot:prepend>
                                    <q-icon name="search" color="primary" />
                                </template>
                            </q-input>
                        </div>
                        <div class="col-12 col-sm-6 col-md-3">
                            <q-select v-model="filtroRol" :options="rolesOptions" outlined dense label="Filtrar por rol"
                                emit-value map-options clearable @update:model-value="cargarUsuarios">
                                <template v-slot:prepend>
                                    <q-icon name="filter_list" color="secondary" />
                                </template>
                            </q-select>
                        </div>
                        <div class="col-12 col-sm-12 col-md-auto text-center text-md-right">
                            <q-btn color="primary" icon="refresh" label="Actualizar" @click="cargarUsuarios"
                                :loading="cargando" />
                        </div>
                    </div>
                </q-card-section>
            </q-card>

            <!-- Tabla de usuarios -->
            <q-card>
                <q-table :rows="usuarios" :columns="columns" row-key="id" :loading="cargando" :pagination="pagination"
                    @request="onRequest" binary-state-sort class="users-table">
                    <template v-slot:body-cell-rol_id="props">
                        <q-td :props="props">
                            <q-chip :color="getRoleColor(props.row.rol_id)" text-color="white" size="sm"
                                class="q-px-md">
                                <q-icon :name="getRoleIcon(props.row.rol_id)" size="16px" class="q-mr-xs" />
                                {{ getRoleLabel(props.row.rol_id) }}
                            </q-chip>
                        </q-td>
                    </template>

                    <template v-slot:body-cell-estado="props">
                        <q-td :props="props">
                            <q-badge :color="props.row.estado ? 'positive' : 'negative'"
                                :label="props.row.estado ? 'Activo' : 'Inactivo'" />
                        </q-td>
                    </template>

                    <template v-slot:body-cell-acciones="props">
                        <q-td :props="props">
                            <div class="row q-gutter-xs no-wrap">
                                <q-btn flat round dense :icon="props.row.estado ? 'toggle_on' : 'toggle_off'"
                                    :color="props.row.estado ? 'positive' : 'negative'"
                                    @click="toggleStatus(props.row)">
                                    <q-tooltip>{{ props.row.estado ? 'Desactivar' : 'Activar' }}</q-tooltip>
                                </q-btn>
                                <q-btn flat round dense icon="lock_reset" color="warning"
                                    @click="confirmResetPassword(props.row)">
                                    <q-tooltip>Restablecer contraseña</q-tooltip>
                                </q-btn>
                            </div>
                        </q-td>
                    </template>

                    <template v-slot:loading>
                        <q-inner-loading showing color="primary" />
                    </template>

                    <template v-slot:no-data>
                        <div class="full-width row flex-center q-gutter-sm q-pa-lg">
                            <q-icon size="2em" name="info" />
                            <span>No se encontraron usuarios</span>
                        </div>
                    </template>
                </q-table>
            </q-card>
        </div>

        <!-- Dialog para crear admin -->
        <admin-user-form-dialog v-model="showCreateAdminDialog" @created="onAdminCreated" />
    </q-page>
</template>

<script>
import { defineComponent, ref, onMounted } from 'vue';
import { api } from 'boot/axios';
import { useQuasar } from 'quasar';
import AdminUserFormDialog from 'src/components/superadmin/AdminUserFormDialog.vue';

export default defineComponent({
    name: 'SuperadminUsersPage',
    components: {
        AdminUserFormDialog
    },

    setup() {
        const $q = useQuasar();
        const usuarios = ref([]);
        const cargando = ref(false);
        const search = ref('');
        const filtroRol = ref(null);
        const showCreateAdminDialog = ref(false);

        const pagination = ref({
            sortBy: 'created_at',
            descending: true,
            page: 1,
            rowsPerPage: 15,
            rowsNumber: 0
        });

        const columns = [
            {
                name: 'id',
                label: 'ID',
                field: 'id',
                align: 'left',
                sortable: true
            },
            {
                name: 'nombres',
                label: 'Nombres',
                field: 'nombres',
                align: 'left',
                sortable: true
            },
            {
                name: 'apellidos',
                label: 'Apellidos',
                field: 'apellidos',
                align: 'left',
                sortable: true
            },
            {
                name: 'usuario',
                label: 'Cédula/Usuario',
                field: 'usuario',
                align: 'left',
                sortable: true
            },
            {
                name: 'rol_id',
                label: 'Rol',
                field: 'rol_id',
                align: 'center',
                sortable: true
            },
            {
                name: 'estado',
                label: 'Estado',
                field: 'estado',
                align: 'center',
                sortable: true
            },
            {
                name: 'acciones',
                label: 'Acciones',
                field: 'acciones',
                align: 'center'
            }
        ];

        const rolesOptions = [
            { label: 'Administrador', value: 1 },
            { label: 'Supervisor', value: 2 },
            { label: 'Investigador', value: 3 },
            { label: 'Académico', value: 4 },
            { label: 'Superadmin', value: 5 }
        ];

        const getRoleLabel = (rolId) => {
            const roleMap = {
                1: 'Administrador',
                2: 'Supervisor',
                3: 'Investigador',
                4: 'Académico',
                5: 'Superadmin'
            };
            return roleMap[rolId] || 'Desconocido';
        };

        const getRoleColor = (rolId) => {
            const colorMap = {
                1: 'red',
                2: 'blue',
                3: 'green',
                4: 'purple',
                5: 'deep-orange'
            };
            return colorMap[rolId] || 'grey';
        };

        const getRoleIcon = (rolId) => {
            const iconMap = {
                1: 'admin_panel_settings',
                2: 'supervisor_account',
                3: 'assignment_ind',
                4: 'school',
                5: 'verified_user'
            };
            return iconMap[rolId] || 'person';
        };

        const cargarUsuarios = async () => {
            cargando.value = true;
            try {
                const params = {
                    page: pagination.value.page,
                    perPage: pagination.value.rowsPerPage,
                    sortBy: pagination.value.sortBy,
                    sortDesc: pagination.value.descending
                };

                if (search.value) {
                    params.search = search.value;
                }

                if (filtroRol.value) {
                    params.rol_id = filtroRol.value;
                }

                const response = await api.get('/superadmin/users', { params });

                usuarios.value = response.data.data;
                pagination.value.rowsNumber = response.data.total;
            } catch (error) {
                console.error('Error al cargar usuarios:', error);
                $q.notify({
                    type: 'negative',
                    message: error.response?.data?.message || 'Error al cargar usuarios',
                    position: 'top-right'
                });
            } finally {
                cargando.value = false;
            }
        };

        const onRequest = (props) => {
            const { page, rowsPerPage, sortBy, descending } = props.pagination;
            pagination.value.page = page;
            pagination.value.rowsPerPage = rowsPerPage;
            pagination.value.sortBy = sortBy;
            pagination.value.descending = descending;
            cargarUsuarios();
        };

        const toggleStatus = async (usuario) => {
            try {
                await api.post(`/usuarios/${usuario.id}/toggle-status`);
                $q.notify({
                    type: 'positive',
                    message: `Usuario ${usuario.estado ? 'desactivado' : 'activado'} correctamente`,
                    position: 'top-right'
                });
                cargarUsuarios();
            } catch (error) {
                console.error('Error al cambiar estado:', error);
                $q.notify({
                    type: 'negative',
                    message: 'Error al cambiar el estado del usuario',
                    position: 'top-right'
                });
            }
        };

        const confirmResetPassword = (usuario) => {
            $q.dialog({
                title: 'Restablecer Contraseña',
                message: `¿Está seguro que desea restablecer la contraseña de ${usuario.nombres} ${usuario.apellidos}? La nueva contraseña será su cédula (${usuario.usuario}).`,
                persistent: true,
                ok: {
                    label: 'Restablecer',
                    color: 'warning',
                    flat: false
                },
                cancel: {
                    label: 'Cancelar',
                    flat: true
                }
            }).onOk(() => {
                resetPassword(usuario);
            });
        };

        const resetPassword = async (usuario) => {
            try {
                await api.post(`/superadmin/users/${usuario.id}/reset-password`);
                $q.notify({
                    type: 'positive',
                    message: 'Contraseña restablecida correctamente. La nueva contraseña es la cédula del usuario.',
                    position: 'top-right',
                    timeout: 5000
                });
            } catch (error) {
                console.error('Error al restablecer contraseña:', error);
                $q.notify({
                    type: 'negative',
                    message: error.response?.data?.message || 'Error al restablecer contraseña',
                    position: 'top-right'
                });
            }
        };

        const onAdminCreated = () => {
            showCreateAdminDialog.value = false;
            cargarUsuarios();
        };

        onMounted(() => {
            cargarUsuarios();
        });

        return {
            usuarios,
            cargando,
            search,
            filtroRol,
            pagination,
            columns,
            rolesOptions,
            showCreateAdminDialog,
            getRoleLabel,
            getRoleColor,
            getRoleIcon,
            cargarUsuarios,
            onRequest,
            toggleStatus,
            confirmResetPassword,
            onAdminCreated
        };
    }
});
</script>

<style lang="scss" scoped>
.superadmin-users-page {
    .header-container {
        background: linear-gradient(135deg, rgba(102, 51, 153, 0.05), rgba(0, 153, 153, 0.05));
        padding: 24px;
        border-radius: 12px;
    }

    .page-title {
        color: #663399;
        font-weight: 600;
    }

    .subtitle-text {
        color: #718096;
    }

    .create-btn {
        border-radius: 8px;
        font-weight: 500;
    }

    .filter-panel {
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    .users-table {
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

        :deep(.q-table__top) {
            padding: 16px;
        }

        :deep(.q-table thead tr th) {
            font-weight: 600;
            color: #663399;
        }

        :deep(.q-table tbody td) {
            padding: 12px;
        }
    }
}
</style>
