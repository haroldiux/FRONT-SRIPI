<template>
  <q-dialog
    v-model="internalOpen"
    maximized
    transition-show="fade"
    transition-hide="fade"
    @hide="handleClose"
  >
    <q-card class="encuesta-preview-card">
      <!-- Header -->
      <q-card-section class="bg-primary text-white">
        <div class="row items-center">
          <div class="text-h6">
            <q-icon name="visibility" class="q-mr-sm" />
            Vista de Encuestador
          </div>
          <q-space />
          <q-btn flat round dense icon="close" @click="closePreview" />
        </div>
      </q-card-section>

      <!-- Loading State -->
      <q-card-section v-if="loading" class="text-center q-pa-lg">
        <q-spinner-dots color="primary" size="50px" />
        <div class="q-mt-md">Cargando encuesta...</div>
      </q-card-section>

      <!-- Error State -->
      <q-card-section v-else-if="error" class="text-center q-pa-lg">
        <q-icon name="error_outline" color="negative" size="60px" />
        <div class="text-h6 q-mt-md">{{ error }}</div>
        <q-btn color="primary" label="Reintentar" class="q-mt-md" @click="loadEncuestaData" />
      </q-card-section>

      <!-- Content -->
      <template v-else-if="encuesta.id">
        <q-card-section class="bg-blue-1 q-py-sm">
          <div class="row items-center justify-between">
            <div class="text-subtitle1 text-weight-medium">
              Previsualización de: {{ encuesta.titulo }}
            </div>
            <div>
              <q-chip color="primary" text-color="white" outline>
                <q-icon name="event" class="q-mr-xs" />
                Creada: {{ formatDate(encuesta.fechaInicio) }}
              </q-chip>
              <q-chip :color="encuesta.activa ? 'positive' : 'grey'" text-color="white" outline>
                {{ encuesta.activa ? 'Activa' : 'Inactiva' }}
              </q-chip>
            </div>
          </div>
        </q-card-section>

        <!-- Contenido con scroll -->
        <q-card-section class="scroll-area" style="height: calc(100vh - 170px); overflow: auto;">
          <div class="encuestador-view">
            <div class="preview-container">
              <q-card class="preview-card">
                <q-card-section class="preview-header">
                  <div class="text-h5 q-mb-xs">{{ encuesta.titulo }}</div>
                  <p class="q-ma-none text-body1">{{ encuesta.descripcion }}</p>
                </q-card-section>

                <!-- Secciones y Preguntas -->
                <q-card-section
                  v-for="(seccion, i) in encuesta.secciones"
                  :key="seccion.id"
                  class="preview-section"
                >
                  <div class="text-h6 q-mb-md">{{ i + 1 }}. {{ seccion.titulo }}</div>
                  <p v-if="seccion.descripcion" class="q-mb-lg text-grey-8">{{ seccion.descripcion }}</p>

                  <div
                    v-for="(pregunta, pregIndex) in seccion.preguntas"
                    :key="pregunta.id"
                    class="preview-question q-mb-lg"
                  >
                    <div class="row items-center q-mb-sm">
                      <div class="text-subtitle1">
                        {{ i + 1 }}.{{ pregIndex + 1 }}. {{ pregunta.enunciado }}
                      </div>
                      <q-badge v-if="pregunta.obligatoria" color="negative" class="q-ml-sm">
                        Obligatoria
                      </q-badge>
                    </div>

                    <!-- Componente según el tipo de pregunta -->
                    <div class="q-pl-md q-mt-sm">
                      <!-- Texto corto -->
                      <q-input
                        v-if="pregunta.tipo === 'text'"
                        outlined
                        dense
                        placeholder="Escriba su respuesta aquí"
                        v-model="respuestas[getQuestionKey(i, pregIndex)]"
                      />

                      <!-- Texto largo -->
                      <q-input
                        v-else-if="pregunta.tipo === 'textarea'"
                        type="textarea"
                        outlined
                        autogrow
                        placeholder="Escriba su respuesta aquí"
                        v-model="respuestas[getQuestionKey(i, pregIndex)]"
                      />

                      <!-- Número -->
                      <q-input
                        v-else-if="pregunta.tipo === 'number'"
                        type="number"
                        outlined
                        dense
                        placeholder="0"
                        v-model="respuestas[getQuestionKey(i, pregIndex)]"
                      />

                      <!-- Opciones simples (radio) -->
                      <div v-else-if="pregunta.tipo === 'single'" class="q-mt-sm">
                        <q-option-group
                          v-model="respuestas[getQuestionKey(i, pregIndex)]"
                          :options="pregunta.opciones.map(opt => ({ label: opt.texto, value: opt.id }))"
                          type="radio"
                          color="primary"
                        />
                      </div>

                      <!-- Opciones múltiples (checkbox) -->
                      <div v-else-if="pregunta.tipo === 'multi'" class="q-mt-sm">
                        <q-option-group
                          v-model="respuestas[getQuestionKey(i, pregIndex)]"
                          :options="pregunta.opciones.map(opt => ({ label: opt.texto, value: opt.id }))"
                          type="checkbox"
                          color="primary"
                        />
                      </div>

                      <!-- Escala -->
                      <div v-else-if="pregunta.tipo === 'scale'" class="q-mt-md">
                        <div class="row justify-between q-mb-xs">
                          <div class="text-caption">{{ pregunta.min || 0 }}</div>
                          <div class="text-caption">{{ pregunta.max || 10 }}</div>
                        </div>
                        <q-slider
                          v-model="respuestas[getQuestionKey(i, pregIndex)]"
                          :min="pregunta.min || 0"
                          :max="pregunta.max || 10"
                          :step="1"
                          label
                          markers
                          color="primary"
                        />
                      </div>

                      <!-- Fecha -->
                      <div v-else-if="pregunta.tipo === 'date'" class="q-mt-sm">
                        <q-input
                          outlined
                          dense
                          placeholder="dd/mm/aaaa"
                          mask="##/##/####"
                          v-model="respuestas[getQuestionKey(i, pregIndex)]"
                        >
                          <template v-slot:append>
                            <q-icon name="event" class="cursor-pointer">
                              <q-popup-proxy transition-show="scale" transition-hide="scale">
                                <q-date
                                  v-model="respuestas[getQuestionKey(i, pregIndex)]"
                                  mask="DD/MM/YYYY"
                                >
                                  <div class="row justify-end">
                                    <q-btn v-close-popup flat label="Cerrar" color="primary" />
                                  </div>
                                </q-date>
                              </q-popup-proxy>
                            </q-icon>
                          </template>
                        </q-input>
                      </div>
                    </div>
                  </div>
                </q-card-section>

                <q-card-section class="preview-footer">
                  <q-btn unelevated color="primary" label="Enviar Respuestas" class="q-mr-sm" @click="simularEnvio" />
                  <q-btn outline color="grey-7" label="Borrar Todo" @click="limpiarRespuestas" />
                </q-card-section>
              </q-card>
            </div>
          </div>
        </q-card-section>

        <!-- Footer con opciones -->
        <q-card-section class="bg-grey-2">
          <div class="row justify-between items-center">
            <div>
              <q-btn outline color="primary" icon="edit" label="Editar" @click="editarEncuesta" class="q-mr-md" />
              <q-btn outline color="primary" icon="print" label="Imprimir" @click="imprimirEncuesta" class="q-mr-md" />
              <q-btn outline color="primary" icon="share" label="Compartir" @click="compartirEncuesta" />
            </div>
            <div>
              <q-btn color="primary" label="Cerrar Vista Previa" @click="closePreview" />
            </div>
          </div>
        </q-card-section>
      </template>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { api } from 'src/boot/axios'
import { useQuasar } from 'quasar'

const $q = useQuasar()

// Props y eventos
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

const emit = defineEmits(['update:modelValue', 'edit', 'close'])

// Estado local
const internalOpen = ref(false)
const encuesta = ref({
  id: null,
  titulo: '',
  descripcion: '',
  fechaInicio: '',
  activa: false,
  secciones: []
})
const loading = ref(false)
const error = ref(null)
const respuestas = ref({})

// Sincronizar con v-model del padre
watch(() => props.modelValue, (newVal) => {
  internalOpen.value = newVal
  if (newVal && props.encuestaId) {
    loadEncuestaData()
  }
}, { immediate: true })

// Sincronizar cambios internos con el padre
watch(internalOpen, (newVal) => {
  emit('update:modelValue', newVal)
})

// Cargar datos de la encuesta
async function loadEncuestaData() {
  if (!props.encuestaId) {
    error.value = 'No se especificó ID de encuesta'
    return
  }

  loading.value = true
  error.value = null

  try {
    const response = await api.get(`/encuestas/${props.encuestaId}`)

    // Asegurarse de que tenga la estructura correcta
    encuesta.value = {
      id: response.data.id,
      titulo: response.data.titulo || '',
      descripcion: response.data.descripcion || '',
      fechaInicio: response.data.fechaInicio || response.data.fecha_inicio || '',
      fechaFinal: response.data.fechaFinal || response.data.fecha_final || '',
      activa: response.data.activa || false,
      secciones: response.data.secciones || []
    }

    // Inicializar respuestas vacías
    respuestas.value = {}

  } catch (err) {
    console.error('Error al cargar encuesta:', err)
    error.value = 'No se pudo cargar la encuesta'

    $q.notify({
      type: 'negative',
      message: 'Error al cargar la encuesta',
      position: 'top'
    })
  } finally {
    loading.value = false
  }
}

// Funciones auxiliares
function getQuestionKey(seccionIndex, preguntaIndex) {
  return `s${seccionIndex}_p${preguntaIndex}`
}

function formatDate(dateString) {
  if (!dateString) return 'N/A'

  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  } catch  {
    return dateString
  }
}

function closePreview() {
  internalOpen.value = false
  emit('close')
}

function handleClose() {
  emit('close')
}

function editarEncuesta() {
  emit('edit', encuesta.value.id)
  closePreview()
}

function simularEnvio() {
  $q.notify({
    type: 'info',
    message: 'Esta es solo una vista previa. Las respuestas no se guardarán.',
    position: 'top'
  })
}

function limpiarRespuestas() {
  respuestas.value = {}
  $q.notify({
    type: 'positive',
    message: 'Respuestas borradas',
    position: 'top'
  })
}

function imprimirEncuesta() {
  window.print()
}

function compartirEncuesta() {
  $q.notify({
    type: 'info',
    message: 'Función de compartir en desarrollo',
    position: 'top'
  })
}
</script>

<style scoped>
.encuesta-preview-card {
  background-color: #f5f7fa;
}

.preview-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 16px;
}

.preview-card {
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  background-color: white;
}

.preview-header {
  background-color: #f5f7fa;
  border-bottom: 1px solid #e5e7eb;
  padding: 20px;
}

.preview-section {
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
  background-color: white;
}

.preview-question {
  padding: 12px 0;
}

.preview-footer {
  background-color: #f5f7fa;
  padding: 16px;
  text-align: center;
}

@media print {
  .encuesta-preview-card {
    background-color: white !important;
  }

  .scroll-area {
    height: auto !important;
    overflow: visible !important;
  }

  .bg-primary, .bg-grey-2, .bg-blue-1 {
    background-color: white !important;
    color: black !important;
  }

  .preview-card {
    box-shadow: none !important;
  }
}
</style>
