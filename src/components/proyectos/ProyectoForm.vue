<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    persistent
    transition-show="fade"
    transition-hide="fade"
  >
    <q-card class="proyecto-dialog" data-aos="zoom-in" data-aos-duration="400">
      <div class="dialog-header">
        <div class="text-h6">Crear Nuevo Proyecto</div>
        <q-btn icon="close" flat round dense v-close-popup @click="$emit('cancel')" class="close-button" />
      </div>

      <q-separator />

      <q-form ref="formRef" @submit="onSubmit" class="form-container">
        <!-- Título -->
        <div class="form-field" data-aos="fade-up" data-aos-delay="100">
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
        <div class="form-field" data-aos="fade-up" data-aos-delay="150">
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
        <div class="form-field" data-aos="fade-up" data-aos-delay="200">
          <label class="field-label">Responsable</label>
          <div class="responsable-field">
            <q-icon name="person" size="20px" class="responsable-icon q-mr-sm" />
            <span class="responsable-nombre">{{ nombreUsuarioActual }}</span>
            <span class="asignado-badge">Asignado</span>
          </div>
        </div>

        <!-- Fechas en fila -->
        <div class="row q-col-gutter-md" data-aos="fade-up" data-aos-delay="250">
          <!-- Fecha de Inicio -->
          <div class="col-12 col-sm-6">
            <div class="form-field">
              <label class="field-label">Fecha de Inicio <span class="required">*</span></label>
              <q-input
                v-model="form.fecha_inicio"
                outlined
                dense
                :rules="[val => !!val || 'La fecha de inicio es requerida']"
                class="full-width date-input"
              >
                <template v-slot:append>
                  <q-icon name="event" class="cursor-pointer date-icon">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-date
                        v-model="form.fecha_inicio"
                        mask="YYYY-MM-DD"
                        today-btn
                        :options="fechaOptions"
                        class="custom-date-picker"
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
                class="full-width date-input"
              >
                <template v-slot:append>
                  <q-icon name="event" class="cursor-pointer date-icon">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-date
                        v-model="form.fecha_fin"
                        mask="YYYY-MM-DD"
                        today-btn
                        :options="fechaOptions"
                        class="custom-date-picker"
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
        <div class="form-field" data-aos="fade-up" data-aos-delay="300">
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
        <div class="form-actions" data-aos="fade-up" data-aos-delay="350">
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
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'src/boot/axios'
import { useAuthStore } from 'src/stores/auth.store'
import AOS from 'aos'

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

// Inicializar AOS si está disponible
onMounted(() => {
  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 600,
      easing: 'ease-out',
      once: true
    })
  }
})

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
// Variables de colores personalizados
$purple: #663399;
$teal: #009999;
$light-teal: #00AAAA;
$white: #FFFFFF;

// Configuración de colores para Quasar
:root {
  --q-primary: #{$purple};
  --q-secondary: #{$purple};
  --q-accent: #{$teal};
}

.proyecto-dialog {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba($purple, 0.2);
  max-width: 600px;
  width: 100%;
  border: 1px solid rgba($purple, 0.1);
  transform: translateY(0);
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 15px 50px rgba($purple, 0.25);
  }
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: linear-gradient(135deg, $purple 0%, $teal 100%);
  color: $white;
}

.close-button {
  opacity: 0.9;
  transition: all 0.2s ease;

  &:hover {
    opacity: 1;
    transform: rotate(90deg);
    background: rgba($white, 0.1);
  }
}

.form-container {
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 22px;
  max-height: calc(90vh - 120px);
  overflow-y: auto;
  background: $white;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba($purple, 0.05);
    border-radius: 10px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba($teal, 0.5);
    border-radius: 10px;

    &:hover {
      background: rgba($teal, 0.7);
    }
  }
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
  }
}

.field-label {
  font-weight: 600;
  color: $purple;
  font-size: 14px;
  letter-spacing: 0.02em;
}

.required {
  color: #ff4081;
  font-weight: bold;
  margin-left: 2px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  margin-top: 12px;
  padding-top: 20px;
  border-top: 1px solid rgba($purple, 0.1);
}

.cancel-btn {
  color: rgba($purple, 0.7);
  font-weight: 500;
  transition: all 0.3s ease;
  padding: 10px 20px;
  border-radius: 10px;

  &:hover {
    background: rgba($purple, 0.05);
    color: $purple;
    transform: translateX(-2px);
  }
}

.submit-btn {
  background: linear-gradient(135deg, $purple 0%, $teal 100%);
  font-weight: 600;
  border-radius: 10px;
  padding: 10px 24px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba($purple, 0.2);
  letter-spacing: 0.03em;

  &:hover {
    box-shadow: 0 6px 16px rgba($purple, 0.35);
    transform: translateY(-2px) translateX(2px);
  }

  &:active {
    transform: translateY(-1px);
    box-shadow: 0 3px 8px rgba($purple, 0.3);
  }
}

:deep(.q-field__control) {
  background-color: rgba($white, 0.8);
  border: 1px solid rgba($purple, 0.1);
  transition: all 0.3s ease;

  &:hover {
    background-color: $white;
    border-color: rgba($teal, 0.3);
    box-shadow: 0 2px 8px rgba($teal, 0.1);
  }
}

:deep(.q-field--focused .q-field__control) {
  background-color: $white;
  border-color: $teal;
  box-shadow: 0 2px 10px rgba($teal, 0.15);
}

.responsable-field {
  display: flex;
  align-items: center;
  background: linear-gradient(to right, rgba($purple, 0.05), rgba($teal, 0.05));
  border: 1px solid rgba($purple, 0.1);
  border-radius: 10px;
  padding: 12px 16px;
  min-height: 44px;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba($purple, 0.08);
    border-color: rgba($teal, 0.2);
  }
}

.responsable-icon {
  color: $purple;
}

.responsable-nombre {
  font-weight: 600;
  flex-grow: 1;
  color: $purple;
  font-size: 14px;
}

.asignado-badge {
  background: linear-gradient(135deg, rgba($purple, 0.2) 0%, rgba($teal, 0.2) 100%);
  color: $teal;
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 20px;
  font-weight: 600;
  letter-spacing: 0.02em;
  box-shadow: 0 2px 6px rgba($teal, 0.1);
}

.date-input {
  position: relative;
  transition: all 0.3s ease;

  &:hover {
    .date-icon {
      color: $teal;
    }
  }
}

.date-icon {
  color: rgba($purple, 0.7);
  transition: all 0.2s ease;
}

:deep(.custom-date-picker) {
  border-radius: 10px;
  box-shadow: 0 8px 30px rgba($purple, 0.15);
  overflow: hidden;

  .q-date__header {
    background: linear-gradient(135deg, $purple 0%, $teal 100%);
  }

  .q-date__today {
    color: $teal;
  }
}

@media (max-width: 600px) {
  .proyecto-dialog {
    width: 90%;
  }

  .form-container {
    padding: 20px;
    gap: 16px;
  }

  .form-actions {
    flex-direction: column-reverse;
    gap: 10px;
  }

  .submit-btn,
  .cancel-btn {
    width: 100%;
    padding: 12px;
  }
}
</style>
