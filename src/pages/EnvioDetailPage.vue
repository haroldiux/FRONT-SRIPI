<template>
  <q-page padding class="envio-detail-page">
    <!-- Estado de carga -->
    <div v-if="loading" class="flex flex-center q-pa-xl">
      <div class="column items-center animate-pulse">
        <q-spinner-dots size="80px" color="primary" />
        <div class="text-h6 q-mt-md text-primary">Cargando detalles del envío...</div>
      </div>
    </div>

    <!-- Estado de error -->
    <div v-else-if="error" class="flex flex-center q-pa-xl">
      <div class="column items-center animate-bounce">
        <q-icon name="error_outline" size="80px" color="negative" />
        <div class="text-h6 q-mt-md text-negative">{{ error }}</div>
        <q-btn unelevated color="primary" label="Volver" class="q-mt-lg" @click="$router.push('/encuestadores/envios')" />
      </div>
    </div>

    <!-- Contenido del envío -->
    <div v-else-if="envio && envio.id" class="row q-col-gutter-md fade-in">
      <div class="col-12 col-md-10 offset-md-1 col-lg-8 offset-lg-2">
        <!-- Información general del envío -->
        <q-card class="detail-card q-mb-md">
          <!-- Cabecera con degradado -->
          <q-card-section class="bg-primary text-white header-section">
            <div class="row items-center justify-between">
              <div class="col-9">
                <div class="text-h5 header-title">{{ envio.encuesta?.titulo || 'Detalle de envío' }}</div>
                <div class="text-subtitle2 q-mt-xs header-subtitle">
                  <q-icon name="event" class="q-mr-xs" />
                  <span>{{ formatDateTime(envio.created_at) }}</span>
                </div>
              </div>
              <div class="col-3 text-right">
                <q-btn flat round icon="arrow_back" color="white" @click="$router.go(-1)" class="back-btn">
                  <q-tooltip>Volver</q-tooltip>
                </q-btn>
              </div>
            </div>
          </q-card-section>

          <q-separator />

          <!-- Información del envío mejorada -->
          <q-card-section class="info-section">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <div class="text-subtitle2 text-weight-medium q-mb-sm section-title">
                  <q-icon name="info" color="primary" size="sm" class="q-mr-xs" />
                  Información del envío:
                </div>
                <q-list dense class="info-list">
                  <!-- Aplicador -->
                  <q-item class="info-item slide-in" :style="{ animationDelay: '0.1s' }">
                    <q-item-section avatar>
                      <q-avatar color="primary" text-color="white" icon="person" size="sm" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>Aplicador</q-item-label>
                      <q-item-label caption class="text-weight-medium">
                        {{ getNombreAplicador(envio) }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>

                  <!-- Ubicación -->
                  <q-item class="info-item slide-in" v-if="envio.lat && envio.lng" :style="{ animationDelay: '0.2s' }">
                    <q-item-section avatar>
                      <q-avatar color="secondary" text-color="white" icon="location_on" size="sm" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>Coordenadas</q-item-label>
                      <q-item-label caption class="text-weight-medium">{{ formatLatLng(envio.lat, envio.lng) }}</q-item-label>
                    </q-item-section>
                  </q-item>

                  <!-- Fecha -->
                  <q-item class="info-item slide-in" :style="{ animationDelay: '0.3s' }">
                    <q-item-section avatar>
                      <q-avatar color="accent" text-color="white" icon="calendar_today" size="sm" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>Fecha y hora</q-item-label>
                      <q-item-label caption class="text-weight-medium">{{ formatDateTime(envio.created_at) }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </div>

              <div class="col-12 col-md-6">
                <div class="text-subtitle2 text-weight-medium q-mb-sm section-title">
                  <q-icon name="summarize" color="primary" size="sm" class="q-mr-xs" />
                  Resumen:
                </div>
                <div class="stats-container slide-in" :style="{ animationDelay: '0.4s' }">
                  <div class="stat-item">
                    <q-circular-progress :value="calcularCompletitud()" size="70px" :color="getCompletitudColor()" class="q-ma-sm"
                      show-value font-size="12px" track-color="grey-3">
                      {{ calcularCompletitud() }}%
                    </q-circular-progress>
                    <div class="text-center text-subtitle2 text-weight-medium">Completitud</div>
                  </div>

                  <q-separator vertical />

                  <div class="stats-details">
                    <div class="row items-center q-mb-md">
                      <q-icon name="help" color="primary" size="sm" class="q-mr-sm" />
                      <div class="text-subtitle2 text-weight-medium">{{ getTotalPreguntas() }} preguntas</div>
                    </div>
                    <div class="row items-center">
                      <q-icon name="check_circle" :color="getCompletitudColor()" size="sm" class="q-mr-sm" />
                      <div class="text-subtitle2 text-weight-medium">{{ envio.respuestas?.length || 0 }} respuestas</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- Mapa de ubicación mejorado con animación -->
        <q-card v-if="envio.lat && envio.lng" class="detail-card q-mb-md map-card fade-in-up" :style="{ animationDelay: '0.5s' }">
          <q-card-section class="map-header">
            <div class="text-subtitle1 text-weight-medium">
              <q-icon name="map" class="q-mr-xs" color="secondary" />
              Ubicación del envío
            </div>
          </q-card-section>

          <q-card-section class="map-content">
            <div class="map-container">
              <div id="map-detail" style="width: 100%; height: 400px; border-radius: 12px; position: relative;" ref="mapContainer"></div>
              <div class="map-overlay">
                <div class="map-coordinates">
                  <q-icon name="location_on" color="white" size="sm" class="q-mr-xs" />
                  {{ formatLatLng(envio.lat, envio.lng) }}
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- Respuestas por sección -->
        <q-card class="detail-card fade-in-up" :style="{ animationDelay: '0.6s' }">
          <q-card-section class="responses-header">
            <div class="text-subtitle1 text-weight-medium">
              <q-icon name="question_answer" class="q-mr-xs" color="primary" />
              Respuestas enviadas
            </div>
          </q-card-section>

          <q-separator />

          <q-card-section class="responses-content">
            <template v-for="(seccion, seccionIndex) in envio.encuesta?.secciones || []" :key="seccion.id">
              <div class="seccion-container" :class="seccionIndex % 2 === 0 ? 'seccion-par' : 'seccion-impar'">
                <div class="text-h6 q-mb-md section-title">
                  <span class="seccion-numero">{{ seccionIndex + 1 }}</span>
                  <span class="seccion-titulo">{{ seccion.titulo }}</span>
                </div>

                <!-- Preguntas de la sección -->
                <div v-for="(pregunta, preguntaIndex) in seccion.preguntas" :key="pregunta.id" class="pregunta-container q-mb-lg fade-in-up"
                  :style="{ animationDelay: `${0.7 + (seccionIndex * 0.1) + (preguntaIndex * 0.05)}s` }">
                  <div class="row items-center q-mb-sm">
                    <div class="pregunta-header">
                      <div class="pregunta-numero">{{ seccionIndex + 1 }}.{{ preguntaIndex + 1 }}</div>
                      <div class="pregunta-texto">{{ pregunta.enunciado }}</div>
                    </div>
                    <q-badge v-if="pregunta.obligatoria" color="negative" class="q-ml-sm obligatoria-badge">
                      Obligatoria
                    </q-badge>
                  </div>

                  <!-- Respuesta -->
                  <div class="q-pl-md q-mt-sm">
                    <q-card flat bordered class="respuesta-card"
                      :class="{ 'respuesta-vacia': getRespuestaFormateada(pregunta.id) === 'No contestada' }">
                      <q-card-section>
                        <div class="text-subtitle2 text-weight-medium text-secondary">Respuesta:</div>
                        <div class="respuesta-contenido q-mt-sm">
                          <q-icon v-if="getRespuestaFormateada(pregunta.id) !== 'No contestada'"
                            name="check" color="positive" size="sm" class="q-mr-xs" />
                          <q-icon v-else name="remove" color="grey-7" size="sm" class="q-mr-xs" />
                          {{ getRespuestaFormateada(pregunta.id) }}
                        </div>
                      </q-card-section>
                    </q-card>
                  </div>
                </div>
              </div>

              <q-separator v-if="seccionIndex < (envio.encuesta?.secciones.length - 1)" class="seccion-separator" />
            </template>
          </q-card-section>

          <q-separator />

          <!-- Acciones al pie -->
          <q-card-actions align="right" class="action-buttons">
            <q-btn unelevated color="primary" icon="keyboard_backspace" label="Volver" @click="$router.go(-1)" class="action-btn back-btn" />
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

            // Añadir capa de mapa base (OpenStreetMap con estilo personalizado)
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              maxZoom: 19,
              attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
              crossOrigin: true
            }).addTo(map)

            // Añadir marcador personalizado en la posición del envío
            const customIcon = L.divIcon({
              html: `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36">
                  <path fill="#663399" d="M12,2C8.13,2,5,5.13,5,9c0,5.25,7,13,7,13s7-7.75,7-13C19,5.13,15.87,2,12,2z" />
                  <circle cx="12" cy="9" r="3" fill="#009999" />
                </svg>
              `,
              className: 'custom-marker-icon',
              iconSize: [36, 36],
              iconAnchor: [18, 36],
              popupAnchor: [0, -36]
            });

            // Añadir marcador con efecto de animación
            const marker = L.marker([envio.value.lat, envio.value.lng], {
              icon: customIcon
            }).addTo(map);

            // Añadir popup informativo
            marker.bindPopup(`
              <div class="popup-content">
                <h5 class="popup-title">Ubicación del envío</h5>
                <p class="popup-coords">Lat: ${parseFloat(envio.value.lat).toFixed(6)}</p>
                <p class="popup-coords">Lng: ${parseFloat(envio.value.lng).toFixed(6)}</p>
              </div>
            `).openPopup();

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

// Obtener color según el porcentaje de completitud
function getCompletitudColor() {
  const porcentaje = calcularCompletitud()
  if (porcentaje >= 90) return 'positive'
  if (porcentaje >= 70) return 'secondary'
  if (porcentaje >= 40) return 'accent'
  return 'negative'
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

<style lang="scss">
/* Variables de colores */
:root {
  --color-primary: #663399;
  --color-secondary: #009999;
  --color-accent: #00AAAA;
  --color-background: #FFFFFF;
  --color-light-bg: #F5F7FA;
  --color-border: #E2E8F0;
  --color-text: #2D3748;
  --color-text-light: #718096;
  --color-success: #38A169;
  --color-warning: #ECC94B;
  --color-danger: #E53E3E;
  --card-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

/* Estilos generales de la página */
.envio-detail-page {
  background-color: #f5f7fa;
  background-image:
    radial-gradient(at top left, rgba(102, 51, 153, 0.03) 0%, transparent 50%),
    radial-gradient(at bottom right, rgba(0, 153, 153, 0.03) 0%, transparent 50%);
  min-height: 100vh;
  padding-top: 1.5rem;
  padding-bottom: 3rem;
}

/* Tarjetas principales */
.detail-card {
  border-radius: 16px !important;
  overflow: hidden;
  box-shadow: var(--card-shadow) !important;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border: none !important;
  margin-bottom: 1.5rem;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15) !important;
  }
}

/* Cabecera de la tarjeta con degradado */
.header-section {
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary)) !important;
  padding: 1.5rem !important;
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at top right, rgba(255, 255, 255, 0.1), transparent 70%);
    pointer-events: none;
  }

  .header-title {
    font-weight: 600;
    margin-bottom: 4px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .header-subtitle {
    opacity: 0.9;
    display: flex;
    align-items: center;
  }

  .back-btn {
    transition: all 0.2s ease;

    &:hover {
      background-color: rgba(255, 255, 255, 0.2) !important;
      transform: scale(1.1);
    }
  }
}

/* Sección de información */
.info-section {
  background-color: rgba(255, 255, 255, 0.8);
  padding: 1.5rem !important;

  .section-title {
    color: var(--color-primary);
    font-weight: 600;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
  }
}

.info-list {
  background-color: #ffffff;
  border-radius: 12px;
  padding: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.info-item {
  padding: 0.75rem;
  border-radius: 8px;
  transition: all 0.3s ease;

  &:hover {
    background-color: rgba(102, 51, 153, 0.05);
    transform: translateX(4px);
  }
}

/* Estadísticas */
.stats-container {
  background-color: #ffffff;
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  align-items: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 1rem;

  .q-circular-progress {
    transition: all 0.3s ease;

    &:hover {
      transform: scale(1.1);
    }
  }
}

.stats-details {
  padding: 0 1rem;
  flex-grow: 1;
}

/* Mapa */
.map-card {
  overflow: hidden;
  position: relative;
}

.map-header {
  padding: 1rem 1.5rem;
  background-color: #ffffff;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.map-content {
  padding: 0 !important;
}

.map-container {
  position: relative;
  height: 400px;
  width: 100%;
  overflow: hidden;
  border-radius: 0 0 16px 16px;
}

.map-overlay {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 1000;
}

.map-coordinates {
  background: rgba(0, 153, 153, 0.8);
  color: #ffffff;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.custom-marker-icon {
  background: none !important;

  svg {
    filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.3));
    transform-origin: center bottom;
    animation: pulse 2s infinite;
  }
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

/* Secciones de respuestas */
.responses-header {
  padding: 1rem 1.5rem;
  background-color: #ffffff;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.responses-content {
  padding: 0 !important;
}

.seccion-container {
  padding: 2rem;
  transition: all 0.3s ease;

  &:hover {
    background-color: rgba(0, 153, 153, 0.03);
  }
}

.seccion-par {
  background-color: #ffffff;
}

.seccion-impar {
  background-color: rgba(102, 51, 153, 0.03);
}

.seccion-separator {
  margin: 0 2rem;
}

.section-title {
  display: flex;
  align-items: center;
  color: var(--color-primary);
  margin-bottom: 1.5rem;
  position: relative;
  padding-bottom: 0.75rem;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 60px;
    height: 3px;
    background: linear-gradient(to right, var(--color-primary), var(--color-secondary));
    border-radius: 2px;
  }
}

.seccion-numero {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  color: white;
  border-radius: 50%;
  margin-right: 12px;
  font-size: 0.9rem;
  font-weight: 600;
}

.seccion-titulo {
  font-weight: 600;
}

/* Preguntas */
.pregunta-container {
  background-color: #ffffff;
  border-radius: 12px;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  border-left: 3px solid transparent;

  &:hover {
    border-left: 3px solid var(--color-secondary);
    transform: translateX(4px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  }
}

.pregunta-header {
  display: flex;
  align-items: center;
  margin-bottom: 0.75rem;
  width: 100%;
}

.pregunta-numero {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  background-color: var(--color-secondary);
  color: white;
  border-radius: 6px;
  margin-right: 10px;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0 8px;
}

.pregunta-texto {
  font-weight: 500;
  color: var(--color-text);
  flex: 1;
}

.obligatoria-badge {
  background-color: #E53E3E !important;
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 0.7rem;
  animation: pulse-badge 2s infinite;
}

@keyframes pulse-badge {
  0% { opacity: 0.8; }
  50% { opacity: 1; }
  100% { opacity: 0.8; }
}

/* Respuestas */
.respuesta-card {
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.8);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
  }

  &.respuesta-vacia {
    background-color: rgba(0, 0, 0, 0.03);
  }
}

.respuesta-contenido {
  background-color: rgba(245, 247, 250, 0.7);
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-weight: 500;
  display: flex;
  align-items: center;
}

/* Botones de acción */
.action-buttons {
  background-color: rgba(102, 51, 153, 0.03);
  padding: 1.25rem !important;
}

.action-btn {
  transition: all 0.3s ease;
  border-radius: 8px;
  padding-left: 1.5rem;
  padding-right: 1.5rem;
  font-weight: 500;

  &.back-btn {
    background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
    box-shadow: 0 4px 12px rgba(102, 51, 153, 0.3);

    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 6px 16px rgba(102, 51, 153, 0.4);
    }
  }

  &.print-btn {
    border: 2px solid var(--color-accent);

    &:hover {
      background-color: rgba(0, 170, 170, 0.1);
    }
  }
}

/* Animaciones */
.animate-pulse {
  animation: pulse 2s infinite;
}

.animate-bounce {
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.fade-in {
  animation: fadeIn 0.8s ease-out forwards;
}

.fade-in-up {
  animation: fadeInUp 0.8s ease-out forwards;
}

.slide-in {
  animation: slideIn 0.6s ease-out forwards;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideIn {
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
}

/* Popup del mapa */
.popup-content {
  padding: 0.5rem;
  text-align: center;
}

.popup-title {
  margin: 0 0 0.5rem 0;
  color: var(--color-primary);
  font-weight: 600;
  font-size: 1rem;
}

.popup-coords {
  margin: 0.25rem 0;
  font-size: 0.9rem;
  color: var(--color-text);
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
    border: 1px solid #ddd !important;
    margin-bottom: 1rem !important;
  }

  .header-section {
    background: #fff !important;
    color: #000 !important;
    border-bottom: 2px solid var(--color-primary);
  }

  .text-white {
    color: black !important;
  }

  .map-card,
  .map-container,
  #map-detail {
    height: 300px !important;
    page-break-inside: avoid;
  }

  .pregunta-container {
    page-break-inside: avoid;
    border-bottom: 1px dashed rgba(0, 0, 0, 0.2);
    box-shadow: none !important;
  }

  .obligatoria-badge {
    border: 1px solid #E53E3E;
    color: #E53E3E !important;
    background-color: transparent !important;
  }

  /* Ocultar animaciones */
  *, *::before, *::after {
    animation: none !important;
    transition: none !important;
    transform: none !important;
  }
}

/* Ajustes responsivos */
@media (max-width: 767px) {
  .envio-detail-page {
    padding: 0.5rem;
  }

  .detail-card {
    border-radius: 12px !important;
    margin-bottom: 1rem;
  }

  .header-section {
    padding: 1rem !important;
  }

  .info-section,
  .map-header,
  .responses-header,
  .seccion-container {
    padding: 1rem !important;
  }

  .map-container,
  #map-detail {
    height: 300px !important;
  }

  .seccion-numero {
    width: 28px;
    height: 28px;
    font-size: 0.8rem;
  }

  .pregunta-container {
    padding: 1rem;
    margin-bottom: 1rem;
  }

  .stats-container {
    flex-direction: column;
    align-items: flex-start;
  }

  .stat-item {
    margin-bottom: 1rem;
    width: 100%;
    flex-direction: row;
    justify-content: center;
  }

  .q-separator.vertical {
    display: none;
  }

  .stats-details {
    width: 100%;
  }
}
</style>
