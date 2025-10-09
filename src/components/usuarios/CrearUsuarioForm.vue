<template>
  <q-dialog v-model="showDialog" persistent transition-show="slide-up" transition-hide="slide-down" maximized>
    <q-card class="bg-grey-1">
      <!-- Header fijo -->
      <q-card-section class="bg-gradient-primary text-white q-pa-lg">
        <div class="row items-center">
          <q-icon :name="isEditMode ? 'edit' : 'person_add'" size="32px" class="q-mr-md" />
          <div class="col">
            <div class="text-h5 text-weight-bold">
              {{ isEditMode ? 'Editar Usuario' : 'Crear Nuevo Usuario' }}
            </div>
            <div class="text-subtitle2 text-grey-3">
              {{ isEditMode ? 'Modifica la información del usuario' : 'Completa el formulario para registrar un nuevo usuario' }}
            </div>
          </div>
          <q-btn flat round dense icon="close" @click="onCancel" size="md" />
        </div>
      </q-card-section>

      <!-- Pestañas -->
      <q-tabs
        v-model="activeTab"
        dense
        class="bg-white text-grey-8 shadow-2"
        active-color="primary"
        indicator-color="primary"
        align="justify"
      >
        <q-tab name="responsable" icon="school" label="Responsable (Docente)" />
        <q-tab name="estudiante" icon="science" label="Estudiante" />
      </q-tabs>

      <q-separator />

      <!-- Contenido con scroll -->
      <q-card-section class="q-pa-none" style="height: calc(100vh - 240px); overflow-y: auto;">
        <q-tab-panels v-model="activeTab" animated class="bg-transparent">

          <!-- Panel Responsable (Docente) -->
          <q-tab-panel name="responsable" class="q-pa-lg">
            <q-form @submit.prevent="onSubmit" class="q-gutter-md">
              <!-- Card de Información Personal -->
              <q-card flat bordered>
                <q-card-section class="bg-blue-grey-1">
                  <div class="text-h6 text-weight-medium">
                    <q-icon name="person" class="q-mr-sm" />
                    Información Personal
                  </div>
                </q-card-section>
                <q-separator />
                <q-card-section class="q-pa-lg">
                  <div class="row q-col-gutter-md">
                    <div class="col-12 col-md-6">
                      <q-input
                        v-model="form.usuario"
                        label="Carnet de Identidad (CI) *"
                        outlined
                        :rules="[
                          val => !!val || 'El CI es requerido',
                          val => /^\d+$/.test(val) || 'Solo números'
                        ]"
                        hint="Ejemplo: 12345678"
                        maxlength="15"
                      >
                        <template v-slot:prepend>
                          <q-icon name="badge" color="primary" />
                        </template>
                      </q-input>
                    </div>

                    <div class="col-12 col-md-6">
                      <q-input
                        v-model="form.nombres"
                        label="Nombres *"
                        outlined
                        :rules="[
                          val => !!val || 'Los nombres son requeridos',
                          val => !(/[0-9@#$%^&*()_+\-=\[\]{};':\\|,.<>\/?]/).test(val) || 'No se permiten números ni caracteres especiales',
                        ]"
                        @update:model-value="convertToUpperCase('nombres')"
                      >
                        <template v-slot:prepend>
                          <q-icon name="person_outline" color="primary" />
                        </template>
                      </q-input>
                    </div>

                    <div class="col-12 col-md-6">
                      <q-input
                        v-model="form.apellidos"
                        label="Apellidos *"
                        outlined
                        :rules="[
                          val => !!val || 'Los apellidos son requeridos',
                          val => !(/[0-9@#$%^&*()_+\-=\[\]{};':\\|,.<>\/?]/).test(val) || 'No se permiten números ni caracteres especiales'
                        ]"
                        @update:model-value="convertToUpperCase('apellidos')"
                      >
                        <template v-slot:prepend>
                          <q-icon name="person_outline" color="primary" />
                        </template>
                      </q-input>
                    </div>
                  </div>
                </q-card-section>
              </q-card>

              <!-- Card de Acceso al Sistema -->
              <q-card flat bordered>
                <q-card-section class="bg-blue-grey-1">
                  <div class="text-h6 text-weight-medium">
                    <q-icon name="lock" class="q-mr-sm" />
                    Acceso al Sistema
                  </div>
                </q-card-section>
                <q-separator />
                <q-card-section class="q-pa-lg">
                  <div class="row q-col-gutter-md">
                    <div class="col-12 col-md-6">
                      <q-input
                        v-if="!isEditMode"
                        v-model="form.password"
                        label="Contraseña *"
                        :type="showPassword ? 'text' : 'password'"
                        outlined
                        autocomplete="new-password"
                        :rules="[
                          val => !isEditMode && !!val || 'La contraseña es requerida',
                          val => !val || val.length >= 6 || 'Mínimo 6 caracteres'
                        ]"
                        hint="Por defecto se usa el CI como contraseña inicial"
                        readonly
                      >
                        <template v-slot:prepend>
                          <q-icon name="vpn_key" color="primary" />
                        </template>
                        <template v-slot:append>
                          <q-icon
                            :name="showPassword ? 'visibility_off' : 'visibility'"
                            class="cursor-pointer"
                            @click="showPassword = !showPassword"
                          />
                        </template>
                      </q-input>
                      <div v-else class="text-grey-7 q-pa-md bg-blue-grey-1 rounded-borders">
                        <q-icon name="info" color="blue" size="20px" class="q-mr-sm" />
                        La contraseña no se puede editar desde aquí
                      </div>
                    </div>

                    <div class="col-12 col-md-6">
                      <q-select
                        v-model="form.rol_id"
                        :options="rolOptions"
                        label="Rol *"
                        outlined
                        emit-value
                        map-options
                        :rules="[val => !!val || 'El rol es requerido']"
                      >
                        <template v-slot:prepend>
                          <q-icon name="admin_panel_settings" color="primary" />
                        </template>
                      </q-select>
                    </div>

                    <div class="col-12 col-md-6">
                      <div class="q-pa-md bg-amber-1 rounded-borders">
                        <q-toggle
                          v-model="form.estado"
                          label="Usuario Activo"
                          color="positive"
                          left-label
                          size="lg"
                        />
                        <div class="text-caption text-grey-7 q-mt-xs">
                          {{ form.estado ? 'El usuario puede acceder al sistema' : 'El usuario no puede acceder al sistema' }}
                        </div>
                      </div>
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </q-form>
          </q-tab-panel>

          <!-- Panel Estudiante -->
          <q-tab-panel name="estudiante" class="q-pa-lg">
            <q-form @submit.prevent="onSubmit" class="q-gutter-md">
              <!-- Card de Información Personal -->
              <q-card flat bordered>
                <q-card-section class="bg-blue-grey-1">
                  <div class="text-h6 text-weight-medium">
                    <q-icon name="person" class="q-mr-sm" />
                    Información Personal
                  </div>
                </q-card-section>
                <q-separator />
                <q-card-section class="q-pa-lg">
                  <div class="row q-col-gutter-md">
                    <div class="col-12 col-md-6">
                      <q-input
                        v-model="form.usuario"
                        label="Carnet de Estudiante *"
                        outlined
                        :rules="[
                          val => !!val || 'El carnet es requerido',
                          val => /^\d+$/.test(val) || 'Solo números'
                        ]"
                        hint="Ejemplo: 20180123"
                        maxlength="15"
                      >
                        <template v-slot:prepend>
                          <q-icon name="badge" color="primary" />
                        </template>
                      </q-input>
                    </div>

                    <div class="col-12 col-md-6">
                      <q-input
                        v-model="form.nombres"
                        label="Nombres *"
                        outlined
                        :rules="[
                          val => !!val || 'Los nombres son requeridos',
                          val => !(/[0-9@#$%^&*()_+\-=\[\]{};':\\|,.<>\/?]/).test(val) || 'No se permiten números ni caracteres especiales'
                        ]"
                        @update:model-value="convertToUpperCase('nombres')"
                      >
                        <template v-slot:prepend>
                          <q-icon name="person_outline" color="primary" />
                        </template>
                      </q-input>
                    </div>

                    <div class="col-12 col-md-6">
                      <q-input
                        v-model="form.apellidos"
                        label="Apellidos *"
                        outlined
                        :rules="[
                          val => !!val || 'Los apellidos son requeridos',
                          val => !(/[0-9@#$%^&*()_+\-=\[\]{};':\\|,.<>\/?]/).test(val) || 'No se permiten números ni caracteres especiales'
                        ]"
                        @update:model-value="convertToUpperCase('apellidos')"
                      >
                        <template v-slot:prepend>
                          <q-icon name="person_outline" color="primary" />
                        </template>
                      </q-input>
                    </div>
                  </div>
                </q-card-section>
              </q-card>

              <!-- Card de Documento SUS (Opcional) -->
              <q-card flat bordered>
                <q-card-section class="bg-orange-1">
                  <div class="text-h6 text-weight-medium">
                    <q-icon name="upload_file" class="q-mr-sm" />
                    Documento del SUS
                  </div>
                  <div class="text-caption text-grey-7 q-mt-xs">
                    Para estudiantes de odontología es necesario subir el documento SUS
                  </div>
                </q-card-section>

                <q-separator />

                <q-card-section class="q-pa-lg">
                  <div class="text-caption text-grey-7 q-mb-md">
                    Sube el documento escaneado del SUS (formato: PDF, JPG, PNG - máx. 5MB)
                  </div>

                  <!-- Vista previa si existe archivo -->
                  <div v-if="form.susFile || form.susFileUrl" class="q-mb-md">
                    <q-card flat bordered class="bg-blue-grey-1">
                      <q-card-section class="row items-center">
                        <q-icon
                          :name="getFileIcon(form.susFile?.name || form.susFileUrl)"
                          size="48px"
                          :color="getFileColor(form.susFile?.name || form.susFileUrl)"
                        />
                        <div class="col q-ml-md">
                          <div class="text-weight-medium">
                            {{ form.susFile?.name || 'Documento SUS cargado' }}
                          </div>
                          <div class="text-caption text-grey-7">
                            {{ form.susFile ? formatFileSize(form.susFile.size) : 'Ver archivo' }}
                          </div>
                        </div>
                        <q-btn
                          flat
                          round
                          dense
                          icon="close"
                          color="negative"
                          @click="removeSusFile"
                        >
                          <q-tooltip>Eliminar archivo</q-tooltip>
                        </q-btn>
                      </q-card-section>
                    </q-card>
                  </div>

                  <!-- Área de carga -->
                  <div
                    v-else
                    class="upload-area q-pa-xl text-center rounded-borders cursor-pointer"
                    :class="{ 'upload-area-dragover': isDragging }"
                    @click="$refs.susFileInput.click()"
                    @dragover.prevent="isDragging = true"
                    @dragleave.prevent="isDragging = false"
                    @drop.prevent="onFileDrop"
                  >
                    <q-icon name="cloud_upload" size="64px" color="grey-5" />
                    <div class="text-h6 text-grey-7 q-mt-md">
                      Arrastra el documento SUS aquí o haz clic para seleccionar
                    </div>
                    <div class="text-caption text-grey-6 q-mt-sm">
                      Formatos permitidos: PDF, JPG, PNG (máx. 5MB)
                    </div>
                  </div>

                  <!-- Input oculto -->
                  <input
                    ref="susFileInput"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    @change="onFileSelect"
                    style="display: none"
                  />
                </q-card-section>
              </q-card>

              <!-- Card de Acceso al Sistema -->
              <q-card flat bordered>
                <q-card-section class="bg-blue-grey-1">
                  <div class="text-h6 text-weight-medium">
                    <q-icon name="lock" class="q-mr-sm" />
                    Acceso al Sistema
                  </div>
                </q-card-section>
                <q-separator />
                <q-card-section class="q-pa-lg">
                  <div class="row q-col-gutter-md">
                    <div class="col-12 col-md-6">
                      <q-input
                        v-if="!isEditMode"
                        v-model="form.password"
                        label="Contraseña *"
                        :type="showPassword ? 'text' : 'password'"
                        outlined
                        autocomplete="new-password"
                        :rules="[
                          val => !isEditMode && !!val || 'La contraseña es requerida',
                          val => !val || val.length >= 6 || 'Mínimo 6 caracteres'
                        ]"
                        hint="Por defecto se usa el carnet como contraseña inicial"
                        readonly
                      >
                        <template v-slot:prepend>
                          <q-icon name="vpn_key" color="primary" />
                        </template>
                        <template v-slot:append>
                          <q-icon
                            :name="showPassword ? 'visibility_off' : 'visibility'"
                            class="cursor-pointer"
                            @click="showPassword = !showPassword"
                          />
                        </template>
                      </q-input>
                      <div v-else class="text-grey-7 q-pa-md bg-blue-grey-1 rounded-borders">
                        <q-icon name="info" color="blue" size="20px" class="q-mr-sm" />
                        La contraseña no se puede editar desde aquí
                      </div>
                    </div>

                    <div class="col-12 col-md-6">
                      <q-select
                        v-model="form.rol_id"
                        :options="rolOptions"
                        label="Rol *"
                        outlined
                        emit-value
                        map-options
                        :rules="[val => !!val || 'El rol es requerido']"
                      >
                        <template v-slot:prepend>
                          <q-icon name="admin_panel_settings" color="primary" />
                        </template>
                      </q-select>
                    </div>

                    <div class="col-12 col-md-6">
                      <div class="q-pa-md bg-amber-1 rounded-borders">
                        <q-toggle
                          v-model="form.estado"
                          label="Usuario Activo"
                          color="positive"
                          left-label
                          size="lg"
                        />
                        <div class="text-caption text-grey-7 q-mt-xs">
                          {{ form.estado ? 'El usuario puede acceder al sistema' : 'El usuario no puede acceder al sistema' }}
                        </div>
                      </div>
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </q-form>
          </q-tab-panel>

        </q-tab-panels>
      </q-card-section>

      <!-- Footer fijo con botones -->
      <q-separator />
      <q-card-actions class="bg-white q-pa-lg shadow-up-2">
        <div class="row full-width q-gutter-md justify-end">
          <q-btn
            flat
            label="Cancelar"
            color="grey-7"
            @click="onCancel"
            icon="close"
            size="md"
            class="q-px-xl"
          />
          <q-btn
            unelevated
            :label="isEditMode ? 'Actualizar Usuario' : 'Crear Usuario'"
            color="primary"
            @click="onSubmit"
            :loading="saving"
            :icon="isEditMode ? 'save' : 'person_add'"
            size="md"
            class="q-px-xl"
          />
        </div>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'boot/axios'

export default {
  name: 'CrearUsuarioForm',

  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    editUser: {
      type: Object,
      default: null
    }
  },

  emits: ['update:modelValue', 'save'],

  setup(props, { emit }) {
    const $q = useQuasar()

    // Estados
    const showDialog = ref(props.modelValue)
    const activeTab = ref('responsable')
    const saving = ref(false)
    const showPassword = ref(false)
    const isDragging = ref(false)
    const susFileInput = ref(null)

    // Computed
    const isEditMode = computed(() => !!props.editUser)

    // Formulario
    const form = ref({
      nombres: '',
      apellidos: '',
      usuario: '', // Será CI para docentes o Código para estudiantes
      password: '', // Por defecto será igual al usuario
      susFile: null, // Archivo del SUS
      susFileUrl: null, // URL si ya existe
      estado: true, // 1 = activo
      rol_id: 2, // 1 = Admin, 2 = Responsable, 3 = Encuestador
      created_at: null,
      updated_at: null
    })

    // Convertir texto a mayúsculas
    const convertToUpperCase = (field) => {
      if (form.value[field]) {
        form.value[field] = form.value[field].toUpperCase();
      }
    }

    // Watch para el usuario - actualiza password si cambia
    watch(() => form.value.usuario, (newVal) => {
      if (!isEditMode.value && newVal) {
        form.value.password = newVal
      }
    })

    // Watch para el tab activo - actualiza rol_id
    watch(() => activeTab.value, (newVal) => {
      if (newVal === 'responsable') {
        form.value.rol_id = 2 // Responsable/Docente
      } else if (newVal === 'estudiante') {
        form.value.rol_id = 3 // Encuestador
      }
    })

    // Opciones
    const rolOptions = [
      { label: 'Responsable', value: 2 },
      { label: 'Encuestador', value: 3 }
    ]

    // Watch para sincronizar el dialog
    watch(() => props.modelValue, (val) => {
      showDialog.value = val
    })

    watch(showDialog, (val) => {
      emit('update:modelValue', val)
      if (!val) {
        resetForm()
      }
    })

    // Watch para cargar datos en edición
    watch(() => props.editUser, (user) => {
      if (user) {
        loadUserData(user)
      }
    }, { immediate: true })

    // Funciones para archivos
    const getFileIcon = (filename) => {
      if (!filename) return 'description'
      const ext = filename.split('.').pop().toLowerCase()
      if (ext === 'pdf') return 'picture_as_pdf'
      if (['jpg', 'jpeg', 'png'].includes(ext)) return 'image'
      return 'description'
    }

    const getFileColor = (filename) => {
      if (!filename) return 'grey'
      const ext = filename.split('.').pop().toLowerCase()
      if (ext === 'pdf') return 'red'
      if (['jpg', 'jpeg', 'png'].includes(ext)) return 'blue'
      return 'grey'
    }

    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
    }

    const validateFile = (file) => {
      const maxSize = 5 * 1024 * 1024 // 5MB
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']

      if (!allowedTypes.includes(file.type)) {
        $q.notify({
          type: 'negative',
          message: 'Formato de archivo no permitido. Solo PDF, JPG o PNG.',
          position: 'top'
        })
        return false
      }

      if (file.size > maxSize) {
        $q.notify({
          type: 'negative',
          message: 'El archivo es muy grande. Máximo 5MB.',
          position: 'top'
        })
        return false
      }

      return true
    }

    const onFileSelect = (event) => {
      const file = event.target.files[0]
      if (file && validateFile(file)) {
        form.value.susFile = file
        $q.notify({
          type: 'positive',
          message: 'Documento SUS cargado correctamente',
          position: 'top'
        })
      }
    }

    const onFileDrop = (event) => {
      isDragging.value = false
      const file = event.dataTransfer.files[0]
      if (file && validateFile(file)) {
        form.value.susFile = file
        $q.notify({
          type: 'positive',
          message: 'Documento SUS cargado correctamente',
          position: 'top'
        })
      }
    }

    const removeSusFile = () => {
      form.value.susFile = null
      form.value.susFileUrl = null
      if (susFileInput.value) {
        susFileInput.value.value = ''
      }
      $q.notify({
        type: 'info',
        message: 'Documento SUS eliminado',
        position: 'top'
      })
    }

    // Cargar datos de usuario para edición
    const loadUserData = (user) => {
      if (!user) return

      form.value = {
        nombres: user.nombres || '',
        apellidos: user.apellidos || '',
        usuario: user.usuario || '',
        password: '',
        susFile: null,
        susFileUrl: user.sus || null,
        estado: user.estado === 1,
        rol_id: user.rol_id || 2,
        created_at: user.created_at || null,
        updated_at: new Date().toISOString()
      }

      // Determinar la pestaña activa según el rol
      activeTab.value = user.rol_id === 2 ? 'responsable' : 'estudiante'
    }

    // Resetear formulario
    const resetForm = () => {
      form.value = {
        nombres: '',
        apellidos: '',
        usuario: '',
        password: '',
        susFile: null,
        susFileUrl: null,
        estado: true,
        rol_id: activeTab.value === 'responsable' ? 2 : 3,
        created_at: null,
        updated_at: null
      }
      showPassword.value = false
    }

    // Validar formulario
    const validateForm = () => {
      if (!form.value.usuario.trim()) {
        $q.notify({
          type: 'negative',
          message: 'El código de usuario es requerido',
          position: 'top'
        })
        return false
      }

      if (!form.value.nombres.trim() || !form.value.apellidos.trim()) {
        $q.notify({
          type: 'negative',
          message: 'Los nombres y apellidos son requeridos',
          position: 'top'
        })
        return false
      }

      if (!isEditMode.value && !form.value.password) {
        $q.notify({
          type: 'negative',
          message: 'La contraseña es requerida',
          position: 'top'
        })
        return false
      }

      // Ahora solo mostramos advertencia si es estudiante de odontología
      if (activeTab.value === 'estudiante' && !form.value.susFile && !form.value.susFileUrl) {
        $q.notify({
          type: 'warning',
          message: 'Recuerda que los estudiantes de odontología necesitan el documento SUS',
          position: 'top'
        })
        // No retornamos false para que no sea obligatorio
      }

      if (!form.value.rol_id) {
        $q.notify({
          type: 'negative',
          message: 'El rol del usuario es requerido',
          position: 'top'
        })
        return false
      }

      return true
    }

    // Guardar usuario
    const onSubmit = async () => {
  if (!validateForm()) return

  saving.value = true

  try {
    // Preparar datos para enviar al backend
    const formData = new FormData()

    // Añadir campos principales
    formData.append('nombres', form.value.nombres)
    formData.append('apellidos', form.value.apellidos)
    formData.append('usuario', form.value.usuario)
    // Solo añadir password si es nuevo usuario o si se está cambiando
    if (!isEditMode.value && form.value.password) {
      formData.append('password', form.value.password)
    }
    formData.append('rol_id', form.value.rol_id)
    formData.append('estado', form.value.estado ? 1 : 0)

    // Añadir archivo SUS si existe
    if (form.value.susFile) {
      formData.append('sus_file', form.value.susFile)
    }

    let response

    if (isEditMode.value) {
      // Para update, usar PUT en lugar de POST con _method=PUT
      formData.append('_method', 'PUT')

      // Actualizar usuario existente
      response = await api.post(`/api/usuarios/${props.editUser.id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
    } else {
      // Crear nuevo usuario
      response = await api.post('/api/usuarios', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
    }

    // Emitir evento con los datos guardados
    if (response && response.data) {
      emit('save', response.data.data)

      $q.notify({
        type: 'positive',
        message: isEditMode.value ? 'Usuario actualizado exitosamente' : 'Usuario creado exitosamente',
        position: 'top'
      })

      showDialog.value = false
    }

  } catch (error) {
    console.error('Error al guardar:', error)
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'Error al guardar el usuario',
      position: 'top'
    })
  } finally {
    saving.value = false
  }
}

    // Cancelar
    const onCancel = () => {
      const hasChanges = form.value.usuario || form.value.nombres || form.value.apellidos ||
                          form.value.password || form.value.susFile

      if (hasChanges) {
        $q.dialog({
          title: 'Confirmar',
          message: '¿Estás seguro de cancelar? Se perderán los cambios no guardados.',
          cancel: {
            label: 'No',
            flat: true,
            color: 'grey-7'
          },
          ok: {
            label: 'Sí, cancelar',
            color: 'negative',
            unelevated: true
          },
          persistent: true
        }).onOk(() => {
          showDialog.value = false
        })
      } else {
        showDialog.value = false
      }
    }

    return {
      // Estados
      showDialog,
      activeTab,
      saving,
      showPassword,
      isDragging,
      susFileInput,
      isEditMode,

      // Formulario
      form,

      // Opciones
      rolOptions,

      // Funciones
      onSubmit,
      onCancel,
      onFileSelect,
      onFileDrop,
      removeSusFile,
      getFileIcon,
      getFileColor,
      formatFileSize,
      convertToUpperCase
    }
  }
}
</script>

<style lang="scss" scoped>
.bg-gradient-primary {
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
}

.upload-area {
  border: 2px dashed #ccc;
  background-color: #fafafa;
  transition: all 0.3s ease;

  &:hover {
    border-color: #1976d2;
    background-color: #f0f7ff;
  }

  &.upload-area-dragover {
    border-color: #1976d2;
    background-color: #e3f2fd;
    transform: scale(1.02);
  }
}

.border-dashed {
  border: 2px dashed #e0e0e0 !important;
}

.shadow-up-2 {
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.1);
}

.cursor-pointer {
  cursor: pointer;
}

/* Estilos responsive adicionales */
@media (max-width: 600px) {
  .q-dialog__inner--maximized > div {
    max-width: 100vw !important;
  }

  .q-card-section {
    padding: 16px !important;
  }

  .q-tabs {
    font-size: 12px;
  }

  .upload-area {
    padding: 20px !important;
  }

  .upload-area .q-icon {
    font-size: 42px !important;
  }

  .upload-area .text-h6 {
    font-size: 16px;
  }
}
</style>
