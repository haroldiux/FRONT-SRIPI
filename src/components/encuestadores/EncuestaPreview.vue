<template>
  <q-dialog
    v-model="internalOpen"
    maximized
    transition-show="fade"
    transition-hide="fade"
    @hide="handleClose"
  >
    <q-card class="encuesta-preview-card" data-aos="zoom-in" data-aos-duration="400">
      <!-- Header -->
      <q-card-section class="bg-purple text-white dialog-header-section">
        <div class="row items-center">
          <div class="text-h6 flex items-center">
            <q-icon name="visibility" class="q-mr-sm" />
            Vista de Encuestador
            <q-badge outline color="white" class="q-ml-md" v-if="encuesta.id">
              ID: {{ encuesta.id }}
            </q-badge>
          </div>
          <q-space />
          <q-btn flat round dense icon="close" @click="closePreview" class="mode-toggle-btn">
            <q-tooltip>Cerrar</q-tooltip>
          </q-btn>
        </div>
      </q-card-section>

      <!-- Loading State -->
      <q-card-section v-if="loading" class="text-center q-pa-lg">
        <q-spinner color="teal" size="50px" />
        <div class="text-h6 q-mt-md text-teal">Cargando encuesta...</div>
        <div class="text-caption text-grey q-mt-sm">Por favor espere mientras se carga la información</div>
      </q-card-section>

      <!-- Error State -->
      <q-card-section v-else-if="error" class="text-center q-pa-lg">
        <q-icon name="error_outline" color="negative" size="60px" />
        <div class="text-h6 q-mt-md">{{ error }}</div>
        <q-btn unelevated color="teal" class="q-mt-md" @click="loadEncuestaData">
          <q-icon name="refresh" class="q-mr-xs" />
          Reintentar
        </q-btn>
      </q-card-section>

      <!-- Content -->
      <template v-else-if="encuesta.id">
        <!-- Sección de previsualización de encuesta con fondo de color para asegurar visibilidad -->
        <q-card-section class="bg-teal text-white q-py-lg preview-title-section">
          <div class="row items-center justify-between">
            <div class="text-h5 text-weight-bold">
              {{ encuesta.titulo || 'Sin título' }}
            </div>
            <div>
              <q-chip color="white" text-color="teal" outline>
                <q-icon name="event" class="q-mr-xs" />
                Creada: {{ formatDate(encuesta.fechaInicio) }}
              </q-chip>
              <q-chip :color="encuesta.activa ? 'positive' : 'grey'" text-color="white">
                <q-icon :name="encuesta.activa ? 'check_circle' : 'cancel'" class="q-mr-xs" />
                {{ encuesta.activa ? 'Activa' : 'Inactiva' }}
              </q-chip>
            </div>
          </div>
          <p class="q-mt-sm q-mb-none text-body1" v-if="encuesta.descripcion">
            {{ encuesta.descripcion }}
          </p>
          <p class="q-mt-sm q-mb-none text-body1" v-else>
            <i>Sin descripción</i>
          </p>
          <div class="text-caption q-mt-sm" v-if="encuesta.fechaInicio">
            <q-icon name="event" size="xs" class="q-mr-xs" />
            Disponible desde: {{ formatDate(encuesta.fechaInicio) }}
            <span v-if="encuesta.fechaFinal"> hasta {{ formatDate(encuesta.fechaFinal) }}</span>
          </div>
        </q-card-section>

        <!-- Contenido con scroll -->
        <q-card-section class="scroll-area" style="height: calc(100vh - 250px); overflow: auto;">
          <div class="encuestador-view">
            <div class="preview-container">
              <q-card class="preview-card" bordered data-aos="fade-up">
                <!-- Secciones y Preguntas -->
                <q-card-section
                  v-for="(seccion, i) in encuesta.secciones"
                  :key="seccion.id"
                  class="preview-section"
                  data-aos="fade-up"
                  :data-aos-delay="100 * i"
                >
                  <div class="text-h6 q-mb-md section-title">
                    <q-icon name="bookmark" color="teal" size="xs" class="q-mr-xs" />
                    {{ i + 1 }}. {{ seccion.titulo }}
                  </div>
                  <p v-if="seccion.descripcion" class="q-mb-lg text-grey-8">{{ seccion.descripcion }}</p>

                  <div
                    v-for="(pregunta, pregIndex) in seccion.preguntas"
                    :key="pregunta.id"
                    class="preview-question q-mb-lg"
                    data-aos="fade-up"
                    :data-aos-delay="50 * pregIndex"
                  >
                    <div class="row items-center q-mb-sm">
                      <div class="text-subtitle1 question-text">
                        <span class="question-number">{{ i + 1 }}.{{ pregIndex + 1 }}.</span>
                        {{ pregunta.enunciado }}
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
                        class="custom-input"
                      />

                      <!-- Texto largo -->
                      <q-input
                        v-else-if="pregunta.tipo === 'textarea'"
                        type="textarea"
                        outlined
                        autogrow
                        placeholder="Escriba su respuesta aquí"
                        v-model="respuestas[getQuestionKey(i, pregIndex)]"
                        class="custom-input"
                      />

                      <!-- Número -->
                      <q-input
                        v-else-if="pregunta.tipo === 'number'"
                        type="number"
                        outlined
                        dense
                        placeholder="0"
                        v-model="respuestas[getQuestionKey(i, pregIndex)]"
                        class="custom-input"
                      />

                      <!-- Opciones simples (radio) -->
                      <div v-else-if="pregunta.tipo === 'single'" class="q-mt-sm">
                        <q-option-group
                          v-model="respuestas[getQuestionKey(i, pregIndex)]"
                          :options="pregunta.opciones.map(opt => ({ label: opt.texto, value: opt.id }))"
                          type="radio"
                          color="teal"
                          class="custom-option-group"
                        />
                      </div>

                      <!-- Opciones múltiples (checkbox) -->
                      <div v-else-if="pregunta.tipo === 'multi'" class="q-mt-sm">
                        <q-option-group
                          v-model="respuestasMulti[getQuestionKey(i, pregIndex)]"
                          :options="pregunta.opciones.map(opt => ({ label: opt.texto, value: opt.id }))"
                          type="checkbox"
                          color="teal"
                          class="custom-option-group"
                        />
                      </div>

                      <!-- Escala -->
                      <div v-else-if="pregunta.tipo === 'scale'" class="q-mt-md">
                        <div class="row justify-between q-mb-xs scale-labels">
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
                          color="teal"
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
                          class="custom-input"
                        >
                          <template v-slot:append>
                            <q-icon name="event" class="cursor-pointer">
                              <q-popup-proxy transition-show="scale" transition-hide="scale">
                                <q-date
                                  v-model="respuestas[getQuestionKey(i, pregIndex)]"
                                  mask="DD/MM/YYYY"
                                  color="teal"
                                >
                                  <div class="row justify-end">
                                    <q-btn v-close-popup flat label="Cerrar" color="teal" />
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

                <q-separator />

                <q-card-section class="preview-footer">
                  <q-btn unelevated color="teal" label="Enviar Respuestas" class="q-mr-sm action-btn" icon="send" @click="simularEnvio" />
                  <q-btn outline color="grey-7" label="Borrar Todo" class="action-btn" icon="delete_sweep" @click="limpiarRespuestas" />
                </q-card-section>
              </q-card>
            </div>
          </div>
        </q-card-section>

        <!-- Footer con opciones -->
        <q-separator />
        <q-card-section class="bg-grey-2 footer-actions">
          <div class="row justify-between items-center">
            <div>
              <q-btn outline color="purple" icon="edit" label="Editar" @click="editarEncuesta" class="q-mr-md action-btn">
                <q-tooltip>Editar esta encuesta</q-tooltip>
              </q-btn>
              <q-btn outline color="purple" icon="print" label="Imprimir" @click="imprimirEncuesta" class="q-mr-md action-btn">
                <q-tooltip>Imprimir encuesta</q-tooltip>
              </q-btn>
              <q-btn outline color="purple" icon="share" label="Compartir" @click="compartirEncuesta" class="action-btn">
                <q-tooltip>Compartir encuesta</q-tooltip>
              </q-btn>
            </div>
            <div>
              <q-btn color="teal" label="Cerrar Vista Previa" @click="closePreview" class="action-btn" />
            </div>
          </div>
        </q-card-section>
      </template>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
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
// Objeto separado para manejar respuestas de tipo múltiple (array)
const respuestasMulti = ref({})

// Inicialización de AOS
onMounted(() => {
  if (window.AOS) {
    window.AOS.init({
      duration: 800,
      easing: 'ease-out-cubic',
      once: false
    })
  }
})

// Sincronizar con v-model del padre
watch(() => props.modelValue, (newVal) => {
  internalOpen.value = newVal
  if (newVal && props.encuestaId) {
    loadEncuestaData()
  }

  // Refrescar animaciones cuando se abre el diálogo
  if (newVal && window.AOS) {
    setTimeout(() => {
      window.AOS.refresh()
    }, 200)
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
    console.log('Datos de encuesta recibidos:', response.data)

    // Asegurarse de que tenga la estructura correcta y convertir valores null o undefined
    encuesta.value = {
      id: response.data.id,
      titulo: response.data.titulo || 'Sin título',
      descripcion: response.data.descripcion || '',
      fechaInicio: response.data.fechaInicio || response.data.fecha_inicio || '',
      fechaFinal: response.data.fechaFinal || response.data.fecha_final || '',
      activa: response.data.activa || false,
      secciones: response.data.secciones || []
    }

    // Inicializar respuestas vacías
    respuestas.value = {}
    respuestasMulti.value = {}

    // Inicializar arrays para las respuestas múltiples
    if (encuesta.value.secciones && encuesta.value.secciones.length > 0) {
      encuesta.value.secciones.forEach((seccion, secIdx) => {
        if (seccion.preguntas && seccion.preguntas.length > 0) {
          seccion.preguntas.forEach((pregunta, pregIdx) => {
            if (pregunta.tipo === 'multi') {
              respuestasMulti.value[getQuestionKey(secIdx, pregIdx)] = []
            }
          });
        }
      });
    }

    console.log('Encuesta procesada:', encuesta.value)

    // Verificar si el título está visible
    console.log('Título de la encuesta:', encuesta.value.titulo)
    console.log('¿El título es una cadena vacía?', encuesta.value.titulo === '')
    console.log('¿El título es null?', encuesta.value.titulo === null)
    console.log('¿El título es undefined?', encuesta.value.titulo === undefined)

  } catch (err) {
    console.error('Error al cargar encuesta:', err)
    error.value = 'No se pudo cargar la encuesta'

    $q.notify({
      type: 'negative',
      message: 'Error al cargar la encuesta',
      position: 'top',
      color: 'red-6',
      icon: 'error',
      timeout: 3000
    })
  } finally {
    loading.value = false

    // Refrescar animaciones después de cargar
    if (window.AOS) {
      setTimeout(() => {
        window.AOS.refresh()
      }, 200)
    }
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
  } catch {
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
  // Combinar respuestas normales y múltiples
  const todasRespuestas = { ...respuestas.value, ...respuestasMulti.value }

  $q.notify({
    type: 'info',
    message: 'Esta es solo una vista previa. Las respuestas no se guardarán.',
    position: 'top',
    color: 'teal',
    icon: 'info',
    timeout: 3000
  })

  console.log('Respuestas simuladas:', todasRespuestas)
}

function limpiarRespuestas() {
  respuestas.value = {}
  respuestasMulti.value = {}

  // Reinicializar arrays para respuestas múltiples
  if (encuesta.value.secciones) {
    encuesta.value.secciones.forEach((seccion, secIdx) => {
      if (seccion.preguntas) {
        seccion.preguntas.forEach((pregunta, pregIdx) => {
          if (pregunta.tipo === 'multi') {
            respuestasMulti.value[getQuestionKey(secIdx, pregIdx)] = []
          }
        });
      }
    });
  }

  $q.notify({
    type: 'positive',
    message: 'Respuestas borradas',
    position: 'top',
    color: 'teal',
    icon: 'delete_sweep',
    timeout: 2000
  })
}

function imprimirEncuesta() {
  window.print()
}

function compartirEncuesta() {
  $q.notify({
    type: 'info',
    message: 'Función de compartir en desarrollo',
    position: 'top',
    color: 'purple',
    icon: 'share',
    timeout: 2000
  })
}
</script>

<style scoped>
/* Paleta de colores */
:root {
  --purple: #663399;
  --teal: #009999;
  --light-teal: #00AAAA;
  --white: #FFFFFF;
  --light-gray: #f5f7fa;
  --border-color: #e5e7eb;
}

/* Estilos generales */
.encuesta-preview-card {
  background-color: #f9fafc;
}

/* Header */
.dialog-header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
}

.preview-title-section {
  background: linear-gradient(135deg, var(--purple) 0%, var(--teal) 100%);
  padding: 24px;
  border-radius: 0;
}

.bg-purple {
  background-color: var(--purple);
}

.bg-teal {
  background-color: var(--teal);
}

.bg-teal-1 {
  background-color: rgba(0, 153, 153, 0.1);
}

.mode-toggle-btn {
  transition: transform 0.3s ease;
}

.mode-toggle-btn:hover {
  transform: scale(1.1);
}

/* Contenedor de previsualización */
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
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.preview-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.bg-gradient {
  background: linear-gradient(135deg, var(--purple) 0%, var(--teal) 100%);
  color: white;
}

.preview-section {
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
  transition: background-color 0.3s ease;
}

.preview-section:hover {
  background-color: #fafafa;
}

.section-title {
  color: var(--purple);
  font-weight: 600;
  position: relative;
  padding-bottom: 8px;
}

.section-title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 60px;
  height: 3px;
  background-color: var(--teal);
  border-radius: 3px;
}

.question-text {
  font-weight: 500;
  line-height: 1.4;
}

.question-number {
  color: var(--teal);
  font-weight: 600;
}

.preview-question {
  padding: 12px 0;
  transition: transform 0.3s ease;
}

.preview-question:hover {
  transform: translateX(5px);
}

.scale-labels {
  color: var(--purple);
  font-weight: 500;
}

.preview-footer {
  background-color: #f5f7fa;
  padding: 20px;
  text-align: center;
}

.footer-actions {
  background: linear-gradient(to right, rgba(102, 51, 153, 0.05), rgba(0, 153, 153, 0.05));
}

/* Inputs personalizados */
.custom-input .q-field__control {
  background-color: #f9fafb;
  transition: background-color 0.2s ease;
}

.custom-input .q-field__control:hover {
  background-color: white;
}

.custom-input .q-field--focused .q-field__control {
  background-color: white;
  border-color: var(--teal);
}

.custom-option-group {
  transition: opacity 0.3s ease;
}

/* Botones de acción */
.action-btn {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border-radius: 8px;
}

.action-btn:hover:not([disabled]) {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* Estilo para los sliders */
.q-slider__track-container {
  background: rgba(102, 51, 153, 0.1);
}

.q-slider__pin-value-marker {
  background: var(--teal);
  color: white;
  font-weight: bold;
}

.q-slider__selection {
  background: var(--teal);
}

.q-slider__thumb {
  background: var(--teal);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.q-slider:hover .q-slider__thumb {
  transform: scale(1.2);
  box-shadow: 0 0 0 8px rgba(0, 153, 153, 0.2);
}

/* Responsive */
@media (max-width: 768px) {
  .preview-container {
    padding: 8px;
  }

  .preview-section {
    padding: 16px;
  }

  .preview-title-section {
    padding: 16px;
  }
}

/* Estilos para impresión */
@media print {
  .encuesta-preview-card {
    background-color: white !important;
  }

  .scroll-area {
    height: auto !important;
    overflow: visible !important;
  }

  .bg-purple, .bg-teal, .bg-grey-2, .bg-teal-1, .preview-title-section {
    background: white !important;
    background-color: white !important;
    color: black !important;
    box-shadow: none !important;
    background-image: none !important;
  }

  .preview-card {
    box-shadow: none !important;
    transform: none !important;
  }

  .footer-actions, .dialog-header-section {
    display: none !important;
  }

  .preview-footer {
    display: none !important;
  }

  .section-title::after {
    display: none !important;
  }

  * {
    color: black !important;
  }
}

/* Animaciones AOS personalizadas */
[data-aos="zoom-in-subtle"] {
  transform: scale(0.95);
  opacity: 0;
  transition-property: transform, opacity;
}

[data-aos="zoom-in-subtle"].aos-animate {
  transform: scale(1);
  opacity: 1;
}

[data-aos="slide-up-subtle"] {
  transform: translateY(20px);
  opacity: 0;
  transition-property: transform, opacity;
}

[data-aos="slide-up-subtle"].aos-animate {
  transform: translateY(0);
  opacity: 1;
}
</style>
