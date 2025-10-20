<template>
  <q-page padding>
    <div class="q-pa-md">
      <!-- Estado de carga -->
      <div v-if="loading" class="flex flex-center q-pa-xl">
        <div class="column items-center">
          <q-spinner-dots size="80px" color="primary" />
          <div class="text-h6 q-mt-md">Cargando detalles del envío...</div>
        </div>
      </div>

      <!-- Estado de error -->
      <div v-else-if="error" class="flex flex-center q-pa-xl">
        <div class="column items-center">
          <q-icon name="error_outline" size="80px" color="negative" />
          <div class="text-h6 q-mt-md">{{ error }}</div>
          <q-btn color="primary" label="Volver" class="q-mt-lg" @click="$router.push('/encuestadores/envios')" />
        </div>
      </div>

      <!-- Contenido del envío -->
      <div v-else-if="envio && envio.id" class="row q-col-gutter-md">
        <div class="col-12 col-md-8 offset-md-2">
          <!-- Información general del envío -->
          <q-card class="detail-card q-mb-md">
            <q-card-section class="bg-primary text-white">
              <div class="row items-center justify-between">
                <div>
                  <div class="text-h5">{{ envio.encuesta?.titulo || 'Envío de encuesta' }}</div>
                  <div class="text-subtitle2">
                    <q-icon name="event" class="q-mr-xs" />
                    <span>Enviado: {{ formatDateTime(envio.created_at) }}</span>
                  </div>
                </div>
                <div>
                  <q-btn flat round icon="arrow_back" color="white" @click="$router.go(-1)" />
                </div>
              </div>
            </q-card-section>

            <q-separator />

            <q-card-section class="bg-blue-1">
              <div class="row q-col-gutter-md">
                <div class="col-12 col-md-6">
                  <div class="text-subtitle2 text-weight-medium">Información del envío:</div>
                  <q-list dense>
                    <q-item>
                      <q-item-section avatar>
                        <q-icon name="numbers" color="primary" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label>ID de Envío</q-item-label>
                        <q-item-label caption>{{ envio.id }}</q-item-label>
                      </q-item-section>
                    </q-item>

                    <q-item>
                      <q-item-section avatar>
                        <q-icon name="assignment_ind" color="primary" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label>Aplicador</q-item-label>
                        <q-item-label caption>
                          {{ getNombreAplicador(envio) }}
                        </q-item-label>
                      </q-item-section>
                    </q-item>

                    <q-item v-if="envio.lat && envio.lng">
                      <q-item-section avatar>
                        <q-icon name="location_on" color="primary" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label>Coordenadas</q-item-label>
                        <q-item-label caption>{{ formatLatLng(envio.lat, envio.lng) }}</q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </div>

                <div class="col-12 col-md-6">
                  <div class="text-subtitle2 text-weight-medium">Resumen:</div>
                  <q-list dense>
                    <q-item>
                      <q-item-section avatar>
                        <q-icon name="help" color="primary" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label>Preguntas</q-item-label>
                        <q-item-label caption>{{ getTotalPreguntas() }} preguntas</q-item-label>
                      </q-item-section>
                    </q-item>

                    <q-item>
                      <q-item-section avatar>
                        <q-icon name="question_answer" color="primary" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label>Respondidas</q-item-label>
                        <q-item-label caption>{{ envio.respuestas?.length || 0 }} respuestas</q-item-label>
                      </q-item-section>
                    </q-item>

                    <q-item>
                      <q-item-section avatar>
                        <q-icon name="check_circle" color="primary" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label>Completitud</q-item-label>
                        <q-item-label caption>
                          {{ calcularCompletitud() }}% completado
                        </q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </div>
              </div>
            </q-card-section>
          </q-card>

          <!-- Mapa de ubicación -->
          <q-card v-if="envio.lat && envio.lng" class="detail-card q-mb-md">
            <q-card-section class="q-pb-none">
              <div class="text-subtitle1 text-weight-medium">
                <q-icon name="map" class="q-mr-xs" />
                Ubicación del envío
              </div>
            </q-card-section>

            <q-card-section>
              <div id="map-detail" style="height: 300px; border-radius: 8px;" ref="mapContainer"></div>
            </q-card-section>
          </q-card>

          <!-- Respuestas por sección -->
          <q-card class="detail-card">
            <q-card-section class="q-pb-none">
              <div class="text-subtitle1 text-weight-medium">
                <q-icon name="question_answer" class="q-mr-xs" />
                Respuestas enviadas
              </div>
            </q-card-section>

            <q-card-section>
              <template v-for="(seccion, seccionIndex) in envio.encuesta?.secciones || []" :key="seccion.id">
                <div class="seccion-container" :class="seccionIndex % 2 === 0 ? '' : 'bg-grey-1'">
                  <div class="text-h6 q-mb-md">{{ seccionIndex + 1 }}. {{ seccion.titulo }}</div>

                  <!-- Preguntas de la sección -->
                  <div v-for="(pregunta, preguntaIndex) in seccion.preguntas" :key="pregunta.id" class="pregunta-container q-mb-lg">
                    <div class="row items-center q-mb-sm">
                      <div class="text-subtitle2">
                        {{ seccionIndex + 1 }}.{{ preguntaIndex + 1 }}. {{ pregunta.enunciado }}
                      </div>
                      <q-badge v-if="pregunta.obligatoria" color="negative" class="q-ml-sm">
                        Obligatoria
                      </q-badge>
                    </div>

                    <!-- Respuesta -->
                    <div class="q-pl-md q-mt-sm">
                      <q-card flat bordered class="respuesta-card">
                        <q-card-section>
                          <div class="text-subtitle2">Respuesta:</div>
                          <div class="respuesta-contenido q-mt-sm">
                            {{ getRespuestaFormateada(pregunta.id) }}
                          </div>
                        </q-card-section>
                      </q-card>
                    </div>
                  </div>
                </div>

                <q-separator v-if="seccionIndex < (envio.encuesta?.secciones.length - 1)" />
              </template>
            </q-card-section>

            <q-separator />

            <!-- Acciones al pie -->
            <q-card-actions align="right" class="bg-grey-1">
              <q-btn outline color="primary" icon="print" label="Imprimir" @click="imprimirDetalles" class="q-mr-sm" />
              <q-btn color="primary" icon="keyboard_backspace" label="Volver" @click="$router.go(-1)" />
            </q-card-actions>
          </q-card>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { api } from 'src/boot/axios'
import { date } from 'quasar'
import { useAuthStore } from 'src/stores/auth.store'

// Variables y servicios
const route = useRoute()
const auth = useAuthStore()

// Referencias
const mapContainer = ref(null)
let map = null

// Estados
const loading = ref(true)
const error = ref(null)
const envio = ref(null)

// Cargar detalle del envío
async function cargarEnvio() {
  const envioId = route.params.id
  if (!envioId) {
    error.value = 'No se especificó ID de envío'
    loading.value = false
    return
  }

  loading.value = true
  error.value = null

  try {
    // Cargar datos del envío
    const response = await api.get(`/envios/${envioId}`)
    envio.value = response.data

    // Si no hay datos de envío
    if (!envio.value || !envio.value.id) {
      throw new Error('No se encontraron datos del envío')
    }

    // Inicializar mapa si hay coordenadas
    nextTick(() => {
      if (envio.value.lat && envio.value.lng && mapContainer.value) {
        inicializarMapa()
      }
    })
  } catch (err) {
    console.error('Error al cargar envío:', err)
    error.value = err.response?.data?.message || 'No se pudo cargar el detalle del envío'
  } finally {
    loading.value = false
  }
}

// Inicializar mapa
function inicializarMapa() {
  if (!envio.value.lat || !envio.value.lng || !mapContainer.value) return

  // Importar Leaflet de forma dinámica
  import('leaflet').then(L => {
    // Crear mapa centrado en la ubicación del envío
    map = L.map(mapContainer.value).setView([envio.value.lat, envio.value.lng], 15)

    // Añadir capa de mapa base (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map)

    // Añadir marcador en la posición del envío
    L.marker([envio.value.lat, envio.value.lng]).addTo(map)
      .bindPopup('Ubicación del envío')
      .openPopup()

    // Deshabilitar interacciones para vista de solo lectura
    map.dragging.disable()
    map.touchZoom.disable()
    map.doubleClickZoom.disable()
    map.scrollWheelZoom.disable()
    map.boxZoom.disable()
    map.keyboard.disable()
    if (map.tap) map.tap.disable()
  }).catch(error => {
    console.error('Error al cargar Leaflet:', error)
  })
}

// Obtener respuesta formateada
function getRespuestaFormateada(preguntaId) {
  // Buscar la respuesta para esta pregunta
  const respuesta = envio.value.respuestas?.find(r => r.pregunta_id === preguntaId)
  if (!respuesta) return 'No contestada'

  // Buscar la pregunta para saber su tipo
  let pregunta = null
  for (const seccion of envio.value.encuesta?.secciones || []) {
    pregunta = seccion.preguntas.find(p => p.id === preguntaId)
    if (pregunta) break
  }

  if (!pregunta) return 'Formato desconocido'

  // Formatear según el tipo de pregunta
  switch (pregunta.tipo) {
    case 'text':
      return respuesta.valor_texto || 'Sin respuesta'

    case 'number':
      return respuesta.valor_num !== null ? respuesta.valor_num.toString() : 'Sin respuesta'

    case 'scale':
      return `Valoración: ${respuesta.valor_escala} (escala ${pregunta.min}-${pregunta.max})`

    case 'date':
      return respuesta.valor_texto || 'Sin respuesta'

    case 'single':
    case 'multi':
      // Para respuestas de selección, mostrar las opciones elegidas
      if (respuesta.opciones && respuesta.opciones.length) {
        return respuesta.opciones
          .map(o => o.texto || `Opción #${o.id}`)
          .join(', ')
      }
      return 'Sin opción seleccionada'

    default:
      return 'Formato no reconocido'
  }
}

// Obtener nombre del aplicador
function getNombreAplicador(envio) {
  if (envio.aplicador_id && auth.user && envio.aplicador_id === auth.user.id) {
    return 'Tú'
  }

  if (envio.aplicador) {
    return `${envio.aplicador.nombres || ''} ${envio.aplicador.apellidos || ''}`.trim() || 'Usuario'
  }

  return 'No especificado'
}

// Formatear fecha y hora
function formatDateTime(dateStr) {
  if (!dateStr) return 'No especificada'
  return date.formatDate(dateStr, 'DD/MM/YYYY HH:mm')
}

// Formatear coordenadas
function formatLatLng(lat, lng) {
  if (!lat || !lng) return 'No disponible'
  return `${parseFloat(lat).toFixed(6)}, ${parseFloat(lng).toFixed(6)}`
}

// Calcular total de preguntas en la encuesta
function getTotalPreguntas() {
  let total = 0
  for (const seccion of envio.value.encuesta?.secciones || []) {
    total += seccion.preguntas?.length || 0
  }
  return total
}

// Calcular porcentaje de completitud
function calcularCompletitud() {
  const totalPreguntas = getTotalPreguntas()
  if (totalPreguntas === 0) return 0

  const totalRespuestas = envio.value.respuestas?.length || 0
  return Math.round((totalRespuestas / totalPreguntas) * 100)
}

// Imprimir detalles
function imprimirDetalles() {
  window.print()
}

// Limpiar mapa al desmontar
function limpiarMapa() {
  if (map) {
    map.remove()
    map = null
  }
}

// Ciclo de vida del componente
onMounted(() => {
  cargarEnvio()

  return () => {
    limpiarMapa()
  }
})
</script>

<style scoped>
.detail-card {
  border-radius: 8px;
  overflow: hidden;
}

.seccion-container {
  padding: 20px;
  margin-bottom: 16px;
}

.pregunta-container {
  margin-bottom: 16px;
}

.respuesta-card {
  background-color: rgba(255, 255, 255, 0.7);
}

.respuesta-contenido {
  font-size: 1.1em;
}

/* Estilos para impresión */
@media print {
  .q-page-container {
    padding: 0 !important;
  }

  .q-btn {
    display: none !important;
  }

  .detail-card {
    box-shadow: none !important;
    border: 1px solid #ddd;
  }

  .bg-primary, .bg-blue-1, .bg-grey-1 {
    background-color: white !important;
    color: black !important;
  }

  .text-white {
    color: black !important;
  }
}
</style>
