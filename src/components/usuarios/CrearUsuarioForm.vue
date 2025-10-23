<template>
  <q-dialog v-model="showDialog" persistent transition-show="slide-up" transition-hide="slide-down" maximized
    class="create-user-dialog">
    <q-card class="bg-grey-1">
      <!-- Header fijo con gradiente de la nueva paleta -->
      <q-card-section class="bg-gradient-custom text-white q-pa-lg header-section" data-aos="fade-down"
        data-aos-duration="600">
        <div class="row items-center">
          <q-icon :name="isEditMode ? 'edit' : 'person_add'" size="32px" class="q-mr-md animated-icon" />
          <div class="col">
            <div class="text-h5 text-weight-bold">
              {{ isEditMode ? 'Editar Usuario' : 'Crear Nuevo Usuario' }}
            </div>
            <div class="text-subtitle2 text-grey-3">
              {{ isEditMode ? 'Modifica la información del usuario' : 'Completa el formulario para registrar un nuevo usuario' }}
            </div>
          </div>
          <q-btn flat round dense icon="close" @click="onCancel" size="md" class="close-btn" />
        </div>
      </q-card-section>

      <!-- Pestañas con nuevos colores -->
      <q-tabs v-model="activeTab" dense class="bg-white text-grey-8 shadow-2 tabs-custom" active-color="purple"
        indicator-color="teal" align="justify" data-aos="fade-down" data-aos-duration="500" data-aos-delay="100">
        <q-tab name="responsable" icon="school" label="Responsable (Docente)" class="tab-item" />
        <q-tab name="estudiante" icon="science" label="Estudiante" class="tab-item" />
      </q-tabs>

      <q-separator />

      <!-- Contenido con scroll -->
      <q-card-section class="q-pa-none content-section" style="height: calc(100vh - 240px); overflow-y: auto;">
        <q-tab-panels v-model="activeTab" animated class="bg-transparent" transition-prev="slide-right"
          transition-next="slide-left">

          <!-- Panel Responsable (Docente) -->
          <q-tab-panel name="responsable" class="q-pa-lg">
            <q-form @submit.prevent="onSubmit" class="q-gutter-md">
              <!-- Card de Información Personal -->
              <q-card flat bordered class="card-container" data-aos="fade-up" data-aos-duration="600">
                <q-card-section class="bg-purple-light">
                  <div class="text-h6 text-weight-medium text-white">
                    <q-icon name="person" class="q-mr-sm" />
                    Información Personal
                  </div>
                </q-card-section>
                <q-separator />
                <q-card-section class="q-pa-lg">
                  <div class="row q-col-gutter-md">
                    <div class="col-12 col-md-6" data-aos="fade-right" data-aos-duration="500" data-aos-delay="100">
                      <q-input v-model="form.usuario" label="Carnet de Identidad (CI) *" outlined class="input-custom"
                        :rules="[
                          val => !!val || 'El CI es requerido',
                          val => /^\d+$/.test(val) || 'Solo números'
                        ]" hint="Ejemplo: 12345678" maxlength="15">
                        <template v-slot:prepend>
                          <q-icon name="badge" color="teal" />
                        </template>
                      </q-input>
                    </div>

                    <div class="col-12 col-md-6" data-aos="fade-right" data-aos-duration="500" data-aos-delay="150">
                      <q-input v-model="form.nombres" label="Nombres *" outlined class="input-custom" :rules="[
                        val => !!val || 'Los nombres son requeridos',
                        val => !(/[0-9@#$%^&*()_+\-=\[\]{};':\\|,.<>\/?]/).test(val) || 'No se permiten números ni caracteres especiales'
                        ]"
                        @update:model-value="convertToUpperCase('nombres')">
                        <template v-slot:prepend>
                          <q-icon name="person_outline" color="teal" />
                        </template>
                      </q-input>
                    </div>

                    <div class="col-12 col-md-6" data-aos="fade-right" data-aos-duration="500" data-aos-delay="200">
                      <q-input v-model="form.apellidos" label="Apellidos *" outlined class="input-custom" :rules="[
                        val => !!val || 'Los apellidos son requeridos',
                        val => !(/[0-9@#$%^&*()_+=\[\]{};':\\|,.<>\/?]/).test(val) || 'No se permiten números ni caracteres especiales']" @update:model-value="convertToUpperCase('apellidos')">
                      </q-input>
                    </div>
                  </div>
                </q-card-section>
              </q-card>

              <!-- Card de Acceso al Sistema -->
              <q-card flat bordered class="card-container" data-aos="fade-up" data-aos-duration="600"
                data-aos-delay="200">
                <q-card-section class="bg-teal-light">
                  <div class="text-h6 text-weight-medium text-white">
                    <q-icon name="lock" class="q-mr-sm" />
                    Acceso al Sistema
                  </div>
                </q-card-section>
                <q-separator />
                <q-card-section class="q-pa-lg">
                  <div class="row q-col-gutter-md">
                    <div class="col-12 col-md-6" data-aos="fade-right" data-aos-duration="500" data-aos-delay="250">
                      <q-input v-if="!isEditMode" v-model="form.password" label="Contraseña *"
                        :type="showPassword ? 'text' : 'password'" outlined autocomplete="new-password"
                        class="input-custom" :rules="[
                          val => !isEditMode && !!val || 'La contraseña es requerida',
                          val => !val || val.length >= 6 || 'Mínimo 6 caracteres']" hint="Por defecto se usa el CI como contraseña inicial" readonly>
                        <template v-slot:prepend>
                          <q-icon name="vpn_key" color="teal" />
                        </template>
                        <template v-slot:append>
                          <q-icon :name="showPassword ? 'visibility_off' : 'visibility'" class="cursor-pointer eye-icon"
                            @click="showPassword = !showPassword" />
                        </template>
                      </q-input>
                      <div v-else class="info-box bg-purple-light text-white rounded-borders q-pa-md">
                        <q-icon name="info" color="white" size="20px" class="q-mr-sm" />
                        La contraseña no se puede editar desde aquí
                      </div>
                    </div>

                    <div class="col-12 col-md-6" data-aos="fade-right" data-aos-duration="500" data-aos-delay="300">
                      <q-select v-model="form.rol_id" :options="rolOptions" label="Rol *" outlined emit-value
                        map-options class="input-custom" :rules="[val => !!val || 'El rol es requerido']">
                        <template v-slot:prepend>
                          <q-icon name="admin_panel_settings" color="teal" />
                        </template>
                      </q-select>
                    </div>

                    <div class="col-12 col-md-6" data-aos="fade-right" data-aos-duration="500" data-aos-delay="350">
                      <div class="toggle-box rounded-borders q-pa-md">
                        <q-toggle v-model="form.estado" label="Usuario Activo" color="teal" left-label size="lg"
                          class="toggle-custom" />
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
              <q-card flat bordered class="card-container" data-aos="fade-up" data-aos-duration="600">
                <q-card-section class="bg-purple-light">
                  <div class="text-h6 text-weight-medium text-white">
                    <q-icon name="person" class="q-mr-sm" />
                    Información Personal
                  </div>
                </q-card-section>
                <q-separator />
                <q-card-section class="q-pa-lg">
                  <div class="row q-col-gutter-md">
                    <div class="col-12 col-md-6" data-aos="fade-right" data-aos-duration="500" data-aos-delay="100">
                      <q-input v-model="form.usuario" label="Carnet de Estudiante *" outlined class="input-custom"
                        :rules="[
                          val => !!val || 'El carnet es requerido',
                          val => /^\d+$/.test(val) || 'Solo números'
                        ]" hint="Ejemplo: 20180123" maxlength="15">
                        <template v-slot:prepend>
                          <q-icon name="badge" color="teal" />
                        </template>
                      </q-input>
                    </div>

                    <div class="col-12 col-md-6" data-aos="fade-right" data-aos-duration="500" data-aos-delay="150">
                      <q-input v-model="form.nombres" label="Nombres *" outlined class="input-custom" :rules="[
                        val => !!val || 'Los nombres son requeridos',
                        val => !(/[0-9@#$%^&*()_+\-=\[\]{};':\\|,.<>\/?]/).test(val) || 'No se permiten números ni caracteres especiales'
                        ]" @update:model-value="convertToUpperCase('nombres')">
                        <template v-slot:prepend>
                          <q-icon name="person_outline" color="teal" />
                        </template>
                      </q-input>
                    </div>

                    <div class="col-12 col-md-6" data-aos="fade-right" data-aos-duration="500" data-aos-delay="200">
                      <q-input v-model="form.apellidos" label="Apellidos *" outlined class="input-custom"
                        :rules="[
                          val => !!val || 'Los apellidos son requeridos',
                          val => !(/[0-9@#$%^&*()_+\-=\[\]{};':\\|,.<>\/?]/).test(val) || 'No se permiten números ni caracteres especiales'
                        ]"
                        @update:model-value="convertToUpperCase('apellidos')">
                        <template v-slot:prepend>
                          <q-icon name="person_outline" color="teal" />
                        </template>
                      </q-input>
                    </div>
                  </div>
                </q-card-section>
              </q-card>

              <!-- Card de Documento SUS (Opcional) -->
              <q-card flat bordered class="card-container" data-aos="fade-up" data-aos-duration="600"
                data-aos-delay="100">
                <q-card-section class="bg-teal">
                  <div class="text-h6 text-weight-medium text-white">
                    <q-icon name="upload_file" class="q-mr-sm" />
                    Documento del SUS
                  </div>
                  <div class="text-caption text-white q-mt-xs">
                    Para estudiantes de odontología es necesario subir el documento SUS
                  </div>
                </q-card-section>

                <q-separator />

                <q-card-section class="q-pa-lg">
                  <div class="text-caption text-grey-7 q-mb-md">
                    Sube el documento escaneado del SUS (formato: PDF, JPG, PNG - máx. 5MB)
                  </div>

                  <!-- Vista previa si existe archivo -->
                  <div v-if="form.susFile || form.susFileUrl" class="q-mb-md" data-aos="fade-up"
                    data-aos-duration="400">
                    <q-card flat bordered class="bg-purple-light file-preview-card">
                      <q-card-section class="row items-center">
                        <q-icon :name="getFileIcon(form.susFile?.name || form.susFileUrl)" size="48px"
                          class="text-white file-icon" />
                        <div class="col q-ml-md">
                          <div class="text-weight-medium text-white">
                            {{ form.susFile?.name || 'Documento SUS cargado' }}
                          </div>
                          <div class="text-caption text-grey-3">
                            {{ form.susFile ? formatFileSize(form.susFile.size) : 'Ver archivo' }}
                          </div>
                        </div>
                        <q-btn flat round dense icon="close" color="white" @click="removeSusFile"
                          class="delete-file-btn">
                          <q-tooltip>Eliminar archivo</q-tooltip>
                        </q-btn>
                      </q-card-section>
                    </q-card>
                  </div>

                  <!-- Área de carga con animación -->
                  <div v-else class="upload-area q-pa-xl text-center rounded-borders cursor-pointer"
                    :class="{ 'upload-area-dragover': isDragging }" @click="$refs.susFileInput.click()"
                    @dragover.prevent="isDragging = true" @dragleave.prevent="isDragging = false"
                    @drop.prevent="onFileDrop" data-aos="fade-up" data-aos-duration="500">
                    <q-icon name="cloud_upload" size="64px" class="text-teal upload-icon" />
                    <div class="text-h6 text-purple q-mt-md">
                      Arrastra el documento SUS aquí o haz clic para seleccionar
                    </div>
                    <div class="text-caption text-grey-6 q-mt-sm">
                      Formatos permitidos: PDF, JPG, PNG (máx. 5MB)
                    </div>
                  </div>

                  <!-- Input oculto -->
                  <input ref="susFileInput" type="file" accept=".pdf,.jpg,.jpeg,.png" @change="onFileSelect"
                    style="display: none" />
                </q-card-section>
              </q-card>

              <!-- Card de Acceso al Sistema -->
              <q-card flat bordered class="card-container" data-aos="fade-up" data-aos-duration="600"
                data-aos-delay="200">
                <q-card-section class="bg-teal-light">
                  <div class="text-h6 text-weight-medium text-white">
                    <q-icon name="lock" class="q-mr-sm" />
                    Acceso al Sistema
                  </div>
                </q-card-section>
                <q-separator />
                <q-card-section class="q-pa-lg">
                  <div class="row q-col-gutter-md">
                    <div class="col-12 col-md-6" data-aos="fade-right" data-aos-duration="500" data-aos-delay="250">
                      <q-input v-if="!isEditMode" v-model="form.password" label="Contraseña *"
                        :type="showPassword ? 'text' : 'password'" outlined autocomplete="new-password"
                        class="input-custom" :rules="[
                          val => !isEditMode && !!val || 'La contraseña es requerida',
                          val => !val || val.length >= 6 || 'Mínimo 6 caracteres'
                        ]" hint="Por defecto se usa el carnet como contraseña inicial" readonly>
                        <template v-slot:prepend>
                          <q-icon name="vpn_key" color="teal" />
                        </template>
                        <template v-slot:append>
                          <q-icon :name="showPassword ? 'visibility_off' : 'visibility'" class="cursor-pointer eye-icon"
                            @click="showPassword = !showPassword" />
                        </template>
                      </q-input>
                      <div v-else class="info-box bg-purple-light text-white rounded-borders q-pa-md">
                        <q-icon name="info" color="white" size="20px" class="q-mr-sm" />
                        La contraseña no se puede editar desde aquí
                      </div>
                    </div>

                    <div class="col-12 col-md-6" data-aos="fade-right" data-aos-duration="500" data-aos-delay="300">
                      <q-select v-model="form.rol_id" :options="rolOptions" label="Rol *" outlined emit-value
                        map-options class="input-custom" :rules="[val => !!val || 'El rol es requerido']">
                        <template v-slot:prepend>
                          <q-icon name="admin_panel_settings" color="teal" />
                        </template>
                      </q-select>
                    </div>

                    <div class="col-12 col-md-6" data-aos="fade-right" data-aos-duration="500" data-aos-delay="350">
                      <div class="toggle-box rounded-borders q-pa-md">
                        <q-toggle v-model="form.estado" label="Usuario Activo" color="teal" left-label size="lg"
                          class="toggle-custom" />
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
      <q-card-actions class="bg-white q-pa-lg shadow-up-2 footer-actions">
        <div class="row full-width q-gutter-md justify-end">
          <q-btn flat label="Cancelar" color="grey-7" @click="onCancel" icon="close" size="md"
            class="q-px-xl cancel-btn" />
          <q-btn unelevated :label="isEditMode ? 'Actualizar Usuario' : 'Crear Usuario'" color="teal" @click="onSubmit"
            :loading="saving" :icon="isEditMode ? 'save' : 'person_add'" size="md" class="q-px-xl submit-btn" />
        </div>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'boot/axios'
import AOS from 'aos'

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

    // Refrescar AOS en cambios
    const refreshAOS = () => {
      if (typeof AOS !== 'undefined') {
        setTimeout(() => {
          AOS.refresh();
        }, 100);
      }
    };

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

    // Cargar datos de usuario para edición - DEFINIDO ANTES DEL WATCHER
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

      // Refrescar AOS después de cargar los datos
      refreshAOS();
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

      // Refrescar AOS cuando cambia el tab
      refreshAOS();
    })

    // Opciones
    const rolOptions = [
      { label: 'Responsable', value: 2 },
      { label: 'Encuestador', value: 3 }
    ]

    // Watch para sincronizar el dialog
    watch(() => props.modelValue, (val) => {
      showDialog.value = val
      if (val) {
        // Refrescar AOS cuando se muestra el diálogo
        setTimeout(refreshAOS, 100);
      }
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
          position: 'top',
          classes: 'notification-custom'
        })
        return false
      }

      if (file.size > maxSize) {
        $q.notify({
          type: 'negative',
          message: 'El archivo es muy grande. Máximo 5MB.',
          position: 'top',
          classes: 'notification-custom'
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
          position: 'top',
          classes: 'notification-custom'
        })
        refreshAOS(); // Refrescar AOS
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
          position: 'top',
          classes: 'notification-custom'
        })
        refreshAOS(); // Refrescar AOS después de cargar el archivo
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
        position: 'top',
        classes: 'notification-custom'
      })
      refreshAOS(); // Refrescar AOS después de eliminar el archivo
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
          position: 'top',
          classes: 'notification-custom'
        })
        return false
      }

      if (!form.value.nombres.trim() || !form.value.apellidos.trim()) {
        $q.notify({
          type: 'negative',
          message: 'Los nombres y apellidos son requeridos',
          position: 'top',
          classes: 'notification-custom'
        })
        return false
      }

      if (!isEditMode.value && !form.value.password) {
        $q.notify({
          type: 'negative',
          message: 'La contraseña es requerida',
          position: 'top',
          classes: 'notification-custom'
        })
        return false
      }

      // Ahora solo mostramos advertencia si es estudiante de odontología
      if (activeTab.value === 'estudiante' && !form.value.susFile && !form.value.susFileUrl) {
        $q.notify({
          type: 'warning',
          message: 'Recuerda que los estudiantes de odontología necesitan el documento SUS',
          position: 'top',
          classes: 'notification-custom'
        })
        // No retornamos false para que no sea obligatorio
      }

      if (!form.value.rol_id) {
        $q.notify({
          type: 'negative',
          message: 'El rol del usuario es requerido',
          position: 'top',
          classes: 'notification-custom'
        })
        return false
      }

      return true
    }

    // Guardar usuario con animación de carga
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
          response = await api.post(`/usuarios/${props.editUser.id}`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          })
        } else {
          // Crear nuevo usuario
          response = await api.post('/usuarios', formData, {
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
            position: 'top',
            classes: 'notification-custom'
          })

          showDialog.value = false
        }

      } catch (error) {
        console.error('Error al guardar:', error)
        $q.notify({
          type: 'negative',
          message: error.response?.data?.message || 'Error al guardar el usuario',
          position: 'top',
          classes: 'notification-custom'
        })
      } finally {
        saving.value = false
      }
    }

    // Cancelar con animación de confirmación
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
          persistent: true,
          class: 'dialog-custom'
        }).onOk(() => {
          showDialog.value = false
        })
      } else {
        showDialog.value = false
      }
    }

    // Inicialización al montar el componente
    onMounted(() => {
      // Inicializar AOS
      initAOS();
    });

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
      convertToUpperCase,
      loadUserData, // Añadido para asegurar que está disponible
      refreshAOS
    }
  }
}
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

.bg-purple-light {
  background-color: var(--purple) !important;
  opacity: 0.9;
}

.bg-teal {
  background-color: var(--teal) !important;
}

.bg-teal-light {
  background-color: var(--teal) !important;
  opacity: 0.9;
}

.text-purple {
  color: var(--purple) !important;
}

.text-teal {
  color: var(--teal) !important;
}

// Gradiente personalizado
.bg-gradient-custom {
  background: linear-gradient(135deg, var(--purple) 0%, var(--teal) 100%);
}

.create-user-dialog {
  .q-dialog__inner {
    &--maximized {
      backdrop-filter: blur(3px);
    }
  }
}

// Header con animación
.header-section {
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

  .animated-icon {
    transition: transform 0.3s ease;

    &:hover {
      transform: scale(1.2) rotate(10deg);
    }
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

// Pestañas personalizadas
.tabs-custom {
  .tab-item {
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 0;
      height: 2px;
      background-color: var(--teal);
      transition: width 0.3s ease;
    }

    &:hover::after {
      width: 100%;
    }
  }
}

// Tarjetas con animación
.card-container {
  transition: all 0.3s ease;
  border-radius: 8px;
  overflow: hidden;
  border-color: rgba(0, 153, 153, 0.2);
  margin-bottom: 20px;

  &:hover {
    box-shadow: 0 8px 15px rgba(0, 0, 0, 0.08) !important;
    transform: translateY(-2px);
  }
}

// Inputs personalizados
.input-custom {
  transition: all 0.3s;

  &:focus-within {
    transform: translateY(-2px);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.05);
  }

  .q-field__control {
    border-radius: 8px;

    &::before {
      border-color: rgba(0, 153, 153, 0.3);
    }
  }

  .q-field__label {
    color: var(--teal);
  }

  .eye-icon {
    opacity: 0.7;
    transition: all 0.3s;

    &:hover {
      opacity: 1;
      transform: scale(1.1);
    }
  }
}

// Toggle personalizado
.toggle-box {
  background-color: rgba(var(--purple), 0.05);
  border: 1px solid rgba(var(--purple), 0.1);
  transition: all 0.3s;

  &:hover {
    background-color: rgba(var(--purple), 0.08);
  }

  .toggle-custom {
    transition: all 0.5s;

    .q-toggle__inner {
      transition: all 0.3s;
    }
  }
}

// Área de carga mejorada
.upload-area {
  border: 2px dashed rgba(var(--teal), 0.3);
  background-color: rgba(var(--teal), 0.03);
  transition: all 0.3s ease;
  border-radius: 12px;

  &:hover {
    border-color: var(--teal);
    background-color: rgba(var(--teal), 0.05);
  }

  &.upload-area-dragover {
    border-color: var(--teal);
    background-color: rgba(var(--teal), 0.1);
    transform: scale(1.02);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
  }

  .upload-icon {
    transition: all 0.5s ease;
    animation: float 3s ease-in-out infinite;
  }
}

// Vista previa de archivos
.file-preview-card {
  transition: all 0.3s;
  border-radius: 8px;
  overflow: hidden;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  }

  .file-icon {
    animation: pulse 2s infinite ease-in-out;
  }

  .delete-file-btn {
    transition: all 0.3s;

    &:hover {
      background-color: rgba(255, 255, 255, 0.2);
      transform: rotate(90deg);
    }
  }
}

// Botones de acción
.footer-actions {
  .cancel-btn {
    transition: all 0.3s;

    &:hover {
      background-color: rgba(0, 0, 0, 0.05);
      transform: translateY(-2px);
    }
  }

  .submit-btn {
    transition: all 0.3s;
    box-shadow: 0 3px 5px rgba(0, 153, 153, 0.3);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 10px rgba(0, 153, 153, 0.4);
    }
  }
}

// Notificaciones personalizadas
.notification-custom {
  border-left: 4px solid var(--teal);
  font-weight: 500;
  animation: slideInRight 0.5s ease-out;
}

// Diálogos personalizados
.dialog-custom {
  .q-dialog__inner {
    &--maximized {
      backdrop-filter: blur(2px);
    }
  }

  .q-card {
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  }
}

// Info box
.info-box {
  transition: all 0.3s;

  &:hover {
    transform: translateY(-2px);
  }
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

@keyframes float {
  0% {
    transform: translateY(0px);
  }

  50% {
    transform: translateY(-10px);
  }

  100% {
    transform: translateY(0px);
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.1);
  }

  100% {
    transform: scale(1);
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

// Estilos responsivos
@media (max-width: 600px) {
  .q-dialog__inner--maximized>div {
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

  // Reducir animaciones en móviles
  .header-section::after {
    display: none;
  }

  .file-preview-card:hover {
    transform: none;
  }

  .card-container:hover {
    transform: none;
  }
}
</style>
