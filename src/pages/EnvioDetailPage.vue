<template>
  <q-page padding class="envio-detail-page">
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
          <q-card-section class="bg-primary text-white header-section">
            <div class="row items-center justify-between">
              <div class="col-9">
                <div class="text-h5">{{ envio.encuesta?.titulo || 'Detalle de envío' }}</div>
                <div class="text-subtitle2 q-mt-xs">
                  <q-icon name="event" class="q-mr-xs" />
                  <span>{{ formatDateTime(envio.created_at) }}</span>
                </div>
              </div>
              <div class="col-3 text-right">
                <q-btn flat round icon="arrow_back" color="white" @click="$router.go(-1)" />
              </div>
            </div>
          </q-card-section>

          <q-separator />

          <!-- Información del envío mejorada -->
          <q-card-section class="bg-blue-1">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <div class="text-subtitle2 text-weight-medium q-mb-sm">Información del envío:</div>
                <q-list dense class="info-list">
                  <!-- Aplicador -->
                  <q-item class="info-item">
                    <q-item-section avatar>
                      <q-icon name="person" color="primary" size="sm" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>Aplicador</q-item-label>
                      <q-item-label caption>
                        {{ getNombreAplicador(envio) }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>

                  <!-- Ubicación -->
                  <q-item class="info-item" v-if="envio.lat && envio.lng">
                    <q-item-section avatar>
                      <q-icon name="location_on" color="primary" size="sm" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>Coordenadas</q-item-label>
                      <q-item-label caption>{{ formatLatLng(envio.lat, envio.lng) }}</q-item-label>
                    </q-item-section>
                  </q-item>

                  <!-- Fecha -->
                  <q-item class="info-item">
                    <q-item-section avatar>
                      <q-icon name="calendar_today" color="primary" size="sm" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>Fecha y hora</q-item-label>
                      <q-item-label caption>{{ formatDateTime(envio.created_at) }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </div>

              <div class="col-12 col-md-6">
                <div class="text-subtitle2 text-weight-medium q-mb-sm">Resumen:</div>
                <div class="stats-container">
                  <div class="stat-item">
                    <q-circular-progress :value="calcularCompletitud()" size="60px" color="positive" class="q-ma-sm"
                      show-value font-size="12px" track-color="grey-3">
                      {{ calcularCompletitud() }}%
                    </q-circular-progress>
                    <div class="text-center text-caption">Completitud</div>
                  </div>

                  <q-separator vertical />

                  <div class="stats-details">
                    <div class="row items-center q-mb-sm">
                      <q-icon name="help" color="primary" size="sm" class="q-mr-xs" />
                      <span class="text-subtitle2">{{ getTotalPreguntas() }} preguntas</span>
                    </div>
                    <div class="row items-center">
                      <q-icon name="check_circle" color="positive" size="sm" class="q-mr-xs" />
                      <span class="text-subtitle2">{{ envio.respuestas?.length || 0 }} respuestas</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- Mapa de ubicación mejorado -->
        <q-card v-if="envio.lat && envio.lng" class="detail-card q-mb-md map-card">
          <q-card-section class="q-pb-none">
            <div class="text-subtitle1 text-weight-medium">
              <q-icon name="map" class="q-mr-xs" />
              Ubicación del envío
            </div>
          </q-card-section>

          <q-card-section>
            <div class="map-container">
              <div id="map-detail" style="width: 100%; height: 400px; border-radius: 8px; border: 1px solid #e0e0e0; position: relative;" ref="mapContainer"></div>
            </div>
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
  </q-page>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { api } from 'src/boot/axios'
import { date } from 'quasar'
import { useAuthStore } from 'src/stores/auth.store'
import 'leaflet/dist/leaflet.css'

// Variables y servicios
const route = useRoute()
const auth = useAuthStore()

// Referencias
const mapContainer = ref(null)
let map = null
const mapInitialized = ref(false)

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

    // Inicializar mapa si hay coordenadas (solo si no está ya inicializado)
    nextTick(() => {
      if (envio.value.lat && envio.value.lng && mapContainer.value && !mapInitialized.value) {
        setTimeout(() => {
          inicializarMapa()
        }, 500)
      }
    })
  } catch (err) {
    console.error('Error al cargar envío:', err)
    error.value = err.response?.data?.message || 'No se pudo cargar el detalle del envío'
  } finally {
    loading.value = false
  }
}

// Inicializar mapa de manera más robusta
function inicializarMapa() {
  if (!envio.value.lat || !envio.value.lng || !mapContainer.value) {
    console.warn('Faltan datos para inicializar el mapa')
    return
  }

  // Verificar si el mapa ya está inicializado
  if (mapInitialized.value) {
    console.log('El mapa ya está inicializado')
    return
  }

  // Asegurar que el contenedor del mapa sea visible
  setTimeout(() => {
    try {
      // Limpiar cualquier mapa existente primero
      if (map) {
        try {
          map.off()
          map.remove()
        } catch (e) {
          console.warn('Error al limpiar mapa existente:', e)
        }
        map = null
      }

      // Limpiar el contenedor
      if (mapContainer.value && mapContainer.value.innerHTML) {
        mapContainer.value.innerHTML = ''
      }

      // Importar Leaflet de forma dinámica
      import('leaflet').then(L => {
        // Verificar si el componente aún está montado
        if (!mapContainer.value) {
          console.warn('El contenedor del mapa ya no existe')
          return
        }

        // Verificar si el contenedor es visible
        if (!mapContainer.value.clientHeight) {
          console.warn('El contenedor del mapa no está visible')
          return
        }

        // Crear la hoja de estilos si no existe
        if (!document.querySelector('link[href*="leaflet.css"]')) {
          const link = document.createElement('link')
          link.rel = 'stylesheet'
          link.href = 'https://unpkg.com/leaflet@1.9.3/dist/leaflet.css'
          document.head.appendChild(link)
        }

        // Esperar un poco para que los estilos se apliquen
        setTimeout(() => {
          try {
            // Crear mapa centrado en la ubicación del envío
            map = L.map(mapContainer.value, {
              attributionControl: true,
              zoomControl: true
            }).setView([envio.value.lat, envio.value.lng], 15)

            // Añadir capa de mapa base (OpenStreetMap)
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              maxZoom: 19,
              attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
              crossOrigin: true
            }).addTo(map)

            // Añadir marcador en la posición del envío
            L.marker([envio.value.lat, envio.value.lng]).addTo(map)
              .bindPopup('Ubicación del envío')
              .openPopup()

            // Invalidar tamaño después de un momento para asegurar que el mapa se renderice correctamente
            setTimeout(() => {
              if (map) {
                map.invalidateSize(true)
              }
              mapInitialized.value = true
            }, 500)
          } catch (mapError) {
            console.error('Error al crear el mapa:', mapError)
            mapInitialized.value = false
          }
        }, 300)
      }).catch(error => {
        console.error('Error al cargar Leaflet:', error)
        mapInitialized.value = false
      })
    } catch (error) {
      console.error('Error al inicializar el mapa:', error)
      mapInitialized.value = false
    }
  }, 500)
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
    try {
      map.off()
      map.remove()
    } catch (e) {
      console.warn('Error al limpiar mapa:', e)
    }
    map = null
  }
  mapInitialized.value = false
}

// Observar cambios en el envío para actualizar el mapa si cambia el ID
watch(() => envio.value, (newValue, oldValue) => {
  if (newValue && newValue.lat && newValue.lng &&
      (!oldValue || newValue.id !== oldValue.id)) {
    // Solo reiniciar el mapa si cambia el ID del envío
    mapInitialized.value = false
    limpiarMapa()

    nextTick(() => {
      inicializarMapa()
    })
  }
}, { deep: true })

// Ciclo de vida del componente
onMounted(() => {
  // Reiniciar la bandera cuando el componente se monte
  mapInitialized.value = false

  // Cargar envío
  cargarEnvio()

  // Función para manejar el redimensionamiento
  const handleResize = () => {
    if (map) {
      map.invalidateSize()
    }
  }

  // Observar cambios en el tamaño de la ventana
  window.addEventListener('resize', handleResize)

  // Limpiar al desmontar
  return () => {
    limpiarMapa()
    window.removeEventListener('resize', handleResize)
  }
})
</script>

<style lang="scss" scoped>
.envio-detail-page {
  background-color: #f8f9fa;
}

.detail-card {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 20px;
}

.header-section {
  background: linear-gradient(to right, #1976d2, #1a237e);
}

.info-list {
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
  padding: 8px;
}

.info-item {
  min-height: 40px;
}

.stats-container {
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
  padding: 12px;
  display: flex;
  align-items: center;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 16px;
}

.stats-details {
  padding: 0 16px;
  flex-grow: 1;
}

.map-container {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  overflow: hidden;
  height: 400px;
  position: relative;
}

.map-card {
  margin-top: 20px;
}

.seccion-container {
  padding: 24px;
  margin-bottom: 16px;
}

.pregunta-container {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px dashed rgba(0, 0, 0, 0.1);
}

.pregunta-container:last-child {
  border-bottom: none;
}

.respuesta-card {
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
}

.respuesta-contenido {
  font-size: 1.1em;
  padding: 8px;
  background-color: #f9f9f9;
  border-radius: 4px;
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

/* Responsive */
@media (max-width: 600px) {
  .stats-container {
    flex-direction: column;
  }

  .q-separator.vertical {
    display: none;
  }

  .stats-details {
    margin-top: 16px;
    text-align: center;
  }

  .seccion-container {
    padding: 16px;
  }
}
</style>
