<template>
    <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" persistent>
        <q-card style="min-width: 500px; max-width: 600px;">
            <q-card-section class="row items-center q-pb-none dialog-header">
                <div class="text-h6">Crear Usuario Admin</div>
                <q-space />
                <q-btn icon="close" flat round dense @click="cerrarDialog" />
            </q-card-section>

            <q-card-section class="q-pt-md">
                <q-form @submit="crearAdmin" ref="formRef">
                    <div class="q-gutter-md">
                        <!-- Nombres -->
                        <q-input v-model="form.nombres" outlined label="Nombres *" :rules="[
                            val => !!val || 'Los nombres son requeridos',
                            val => /^[A-Za-záéíóúÁÉÍÓÚñÑ\s]+$/.test(val) || 'Solo se permiten letras y espacios'
                        ]" lazy-rules>
                            <template v-slot:prepend>
                                <q-icon name="person" color="primary" />
                            </template>
                        </q-input>

                        <!-- Apellidos -->
                        <q-input v-model="form.apellidos" outlined label="Apellidos *" :rules="[
                            val => !!val || 'Los apellidos son requeridos',
                            val => /^[A-Za-záéíóúÁÉÍÓÚñÑ\s]+$/.test(val) || 'Solo se permiten letras y espacios'
                        ]" lazy-rules>
                            <template v-slot:prepend>
                                <q-icon name="person_outline" color="primary" />
                            </template>
                        </q-input>

                        <!-- Cédula (Usuario) -->
                        <q-input v-model="form.usuario" outlined label="Cédula (Usuario) *"
                            hint="La cédula será usada como usuario y contraseña inicial" :rules="[
                                val => !!val || 'La cédula es requerida',
                                val => val.length >= 4 || 'La cédula debe tener al menos 4 caracteres'
                            ]" lazy-rules>
                            <template v-slot:prepend>
                                <q-icon name="badge" color="primary" />
                            </template>
                        </q-input>

                        <!-- Información adicional -->
                        <q-banner class="bg-blue-1 text-blue-9" rounded>
                            <template v-slot:avatar>
                                <q-icon name="info" color="blue" />
                            </template>
                            <div class="text-caption">
                                <strong>Nota:</strong> El usuario será creado con rol de <strong>Administrador</strong>.
                                La contraseña inicial será la cédula ingresada y deberá cambiarla en el primer inicio de
                                sesión.
                            </div>
                        </q-banner>
                    </div>
                </q-form>
            </q-card-section>

            <q-card-actions align="right" class="q-pa-md">
                <q-btn flat label="Cancelar" color="grey-7" @click="cerrarDialog" :disable="cargando" />
                <q-btn label="Crear Admin" color="primary" @click="crearAdmin" :loading="cargando" icon="add" />
            </q-card-actions>
        </q-card>
    </q-dialog>
</template>

<script>
import { defineComponent, ref } from 'vue';
import { api } from 'boot/axios';
import { useQuasar } from 'quasar';

export default defineComponent({
    name: 'AdminUserFormDialog',

    props: {
        modelValue: {
            type: Boolean,
            required: true
        }
    },

    emits: ['update:modelValue', 'created'],

    setup(props, { emit }) {
        const $q = useQuasar();
        const formRef = ref(null);
        const cargando = ref(false);

        const form = ref({
            nombres: '',
            apellidos: '',
            usuario: ''
        });

        const cerrarDialog = () => {
            emit('update:modelValue', false);
            resetForm();
        };

        const resetForm = () => {
            form.value = {
                nombres: '',
                apellidos: '',
                usuario: ''
            };
            formRef.value?.resetValidation();
        };

        const crearAdmin = async () => {
            const isValid = await formRef.value.validate();
            if (!isValid) {
                return;
            }

            cargando.value = true;
            try {
                const response = await api.post('/superadmin/users/admin', form.value);

                $q.notify({
                    type: 'positive',
                    message: response.data.message || 'Usuario Admin creado correctamente',
                    position: 'top-right',
                    timeout: 5000,
                    caption: `Usuario: ${form.value.usuario} | Contraseña: ${form.value.usuario}`
                });

                emit('created');
                cerrarDialog();
            } catch (error) {
                console.error('Error al crear admin:', error);
                $q.notify({
                    type: 'negative',
                    message: error.response?.data?.message || 'Error al crear el usuario Admin',
                    position: 'top-right'
                });
            } finally {
                cargando.value = false;
            }
        };

        return {
            formRef,
            form,
            cargando,
            cerrarDialog,
            crearAdmin
        };
    }
});
</script>

<style lang="scss" scoped>
.dialog-header {
    background: linear-gradient(135deg, rgba(102, 51, 153, 0.05), rgba(0, 153, 153, 0.05));
    border-bottom: 2px solid #663399;
}

:deep(.q-field__label) {
    font-weight: 500;
}

:deep(.q-banner) {
    border-left: 4px solid #2196F3;
}
</style>
