<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    persistent
    transition-show="scale"
    transition-hide="scale"
  >
    <q-card class="proyecto-dialog">
      <div class="dialog-header">
        <div class="text-h6">Crear Nuevo Proyecto</div>
        <q-btn icon="close" flat round dense v-close-popup @click="$emit('cancel')" />
      </div>

      <q-separator />

      <q-form ref="formRef" @submit="onSubmit" class="form-container">
        <!-- Título -->
        <div class="form-field">
          <label class="field-label">Título del Proyecto <span class="required">*</span></label>
          <q-input
            v-model="form.titulo"
            outlined
            dense
            :rules="[val => !!val || 'El título es requerido']"
            placeholder="Ingrese el título del proyecto"
            class="full-width"
          />
        </div>

        <!-- Descripción -->
        <div class="form-field">
          <label class="field-label">Descripción</label>
          <q-input
            v-model="form.descripcion"
            type="textarea"
            outlined
            dense
            rows="3"
            placeholder="Describa el objetivo del proyecto"
            class="full-width"
          />
        </div>

        <!-- Responsable (no editable) -->
        <div class="form-field">
          <label class="field-label">Responsable</label>
          <div class="responsable-field">
            <q-icon name="person" size="20px" color="primary" class="q-mr-sm" />
            <span class="responsable-nombre">{{ nombreUsuarioActual }}</span>
            <span class="asignado-badge"></span>
          </div>
        </div>

        <!-- Fechas en fila -->
        <div class="row q-col-gutter-md">
          <!-- Fecha de Inicio -->
          <div class="col-12 col-sm-6">
            <div class="form-field">
              <label class="field-label">Fecha de Inicio <span class="required">*</span></label>
              <q-input
                v-model="form.fecha_inicio"
                outlined
                dense
                :rules="[val => !!val || 'La fecha de inicio es requerida']"
                class="full-width"
              >
                <template v-slot:append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-date
                        v-model="form.fecha_inicio"
                        mask="YYYY-MM-DD"
                        today-btn
                        :options="fechaOptions"
                      >
                        <div class="row items-center justify-end">
                          <q-btn v-close-popup label="Cerrar" color="primary" flat />
                        </div>
                      </q-date>
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>
          </div>

          <!-- Fecha de Fin -->
          <div class="col-12 col-sm-6">
            <div class="form-field">
              <label class="field-label">Fecha de Fin</label>
              <q-input
                v-model="form.fecha_fin"
                outlined
                dense
                class="full-width"
              >
                <template v-slot:append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-date
                        v-model="form.fecha_fin"
                        mask="YYYY-MM-DD"
                        today-btn
                        :options="fechaOptions"
                      >
                        <div class="row items-center justify-end">
                          <q-btn v-close-popup label="Cerrar" color="primary" flat />
                        </div>
                      </q-date>
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>
          </div>
        </div>

        <!-- Estado del proyecto -->
        <div class="form-field">
          <label class="field-label">Estado del proyecto</label>
          <q-select
            v-model="form.estado"
            :options="estadoOptions"
            outlined
            dense
            emit-value
            map-options
            class="full-width"
          />
        </div>

        <!-- Botones de acción -->
        <div class="form-actions">
          <q-btn
            flat
            label="CANCELAR"
            class="cancel-btn"
            @click="$emit('cancel')"
          />
          <q-btn
            unelevated
            label="CREAR PROYECTO"
            type="submit"
            color="primary"
            :loading="submitting"
            class="submit-btn"
          />
        </div>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'src/boot/axios'
import { useAuthStore } from 'src/stores/auth.store'

defineProps({
  modelValue: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'save', 'cancel'])

const $q = useQuasar()
const formRef = ref(null)
const submitting = ref(false)
const auth = useAuthStore()

// Estado inicial del formulario
const form = ref({
  titulo: '',
  descripcion: '',
  fecha_inicio: '',
  fecha_fin: '',
  estado: 'inicio',
  responsable_id: null // Será configurado en onSubmit
})

// Función para limitar fechas a partir de hoy (zona horaria de Bolivia)
const fechaOptions = (date) => {
  // Obtener fecha actual en Bolivia (GMT-4)
  const now = new Date()
  // Ajustar a zona horaria de Bolivia (UTC-4)
  const offsetHours = -4
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000)
  const boliviaToday = new Date(utc + (3600000 * offsetHours))

  // Formatear la fecha de hoy a YYYY/MM/DD para comparar
  const today = new Date(boliviaToday.getFullYear(), boliviaToday.getMonth(), boliviaToday.getDate())

  // Convertir la fecha a comparar al mismo formato
  const dateToCompare = new Date(date.split('/')[0], parseInt(date.split('/')[1]) - 1, date.split('/')[2])

  // Permitir solo fechas desde hoy en adelante
  return dateToCompare >= today
}

// Opciones para el estado del proyecto
const estadoOptions = [
  { label: 'Inicio', value: 'inicio' },
  { label: 'En Curso', value: 'en curso' },
  { label: 'Concluido', value: 'concluido' },
  { label: 'Pausado', value: 'pausado' }
]

// ID del usuario actual (logueado)
const currentUserId = computed(() => {
  return auth.user?.id || null
})

// Nombre completo del usuario actual
const nombreUsuarioActual = computed(() => {
  if (auth.user) {
    return `${auth.user.nombres || ''} ${auth.user.apellidos || ''}`.trim() || 'Usuario no identificado'
  }
  return 'Usuario no identificado'
})

// Enviar formulario
// Enviar formulario
async function onSubmit() {
  try {
    const valid = await formRef.value.validate()
    if (!valid) return

    submitting.value = true

    // Asignar el ID del usuario logueado como responsable del proyecto
    const payload = {
      titulo: form.value.titulo.trim(),
      descripcion: form.value.descripcion?.trim() || null,
      fecha_inicio: form.value.fecha_inicio || null,
      fecha_fin: form.value.fecha_fin || null,
      estado: form.value.estado,
      responsable_id: currentUserId.value // Usar el ID del usuario actual
    }

    // Verificar que el ID del usuario sea válido antes de enviar
    if (!payload.responsable_id) {
      throw new Error('No se pudo determinar el ID del responsable del proyecto')
    }

    console.log('Enviando proyecto con datos:', payload)

    // Enviar solicitud a la API
    const response = await api.post('/proyectos', payload)
    const data = response.data.data || response.data

    // Notificar éxito
    $q.notify({
      type: 'positive',
      message: 'Proyecto creado exitosamente',
      position: 'top'
    })

    // Emitir evento con el proyecto guardado
    emit('save', data.id)

    // Resetear formulario y cerrar diálogo
    resetForm()
  } catch (error) {
    console.error('Error al guardar proyecto:', error)

    // Mostrar mensaje de error más específico basado en la respuesta del servidor
    let errorMessage = 'Error al guardar el proyecto'

    if (error.response?.data?.errors) {
      // Si hay errores de validación específicos
      const validationErrors = error.response.data.errors

      if (validationErrors.responsable_id) {
        errorMessage = 'Error: El responsable seleccionado no es válido. Por favor, contacte al administrador.'
      } else {
        // Obtener el primer mensaje de error
        const firstErrorField = Object.keys(validationErrors)[0]
        if (firstErrorField && validationErrors[firstErrorField][0]) {
          errorMessage = validationErrors[firstErrorField][0]
        }
      }
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message
    } else if (error.message) {
      errorMessage = error.message
    }

    $q.notify({
      color: 'negative',
      message: errorMessage,
      icon: 'error'
    })
  } finally {
    submitting.value = false
  }
}


// Resetear formulario a valores por defecto
function resetForm() {
  form.value = {
    titulo: '',
    descripcion: '',
    fecha_inicio: '',
    fecha_fin: '',
    estado: 'inicio',
    responsable_id: null
  }
  emit('update:modelValue', false)
}
</script>

<style lang="scss" scoped>
.proyecto-dialog {
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  max-width: 600px;
  width: 100%;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: linear-gradient(90deg, #1976d2, #2196f3);
  color: white;
}

.form-container {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-height: calc(90vh - 120px);
  overflow-y: auto;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-label {
  font-weight: 500;
  color: #374151;
  font-size: 14px;
}

.required {
  color: #e53935;
  font-weight: bold;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  margin-top: 8px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.cancel-btn {
  color: #64748b;
  font-weight: 500;
}

.submit-btn {
  background: linear-gradient(90deg, #1976d2, #2196f3);
  font-weight: 500;
  border-radius: 6px;
  padding: 8px 20px;

  &:hover {
    box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
  }
}

:deep(.q-field__control) {
  background-color: #f9fafb;

  &:hover {
    background-color: white;
  }
}

:deep(.q-field--focused .q-field__control) {
  background-color: white;
}

.responsable-field {
  display: flex;
  align-items: center;
  background-color: #f5f8ff;
  border: 1px solid #d1e4fe;
  border-radius: 8px;
  padding: 10px 16px;
  min-height: 40px;
}

.responsable-nombre {
  font-weight: 500;
  flex-grow: 1;
  color: #1976d2;
}

.asignado-badge {
  background-color: #e1f5fe;
  color: #0288d1;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 12px;
  font-weight: 500;
}
</style>
