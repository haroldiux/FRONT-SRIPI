<template>
  <q-page padding class="encuesta-page">
    <!-- Estado de carga -->
    <div v-if="loading" class="flex flex-center q-pa-xl">
      <div class="column items-center">
        <q-spinner-dots size="80px" color="primary" />
        <div class="text-h6 q-mt-md">Cargando encuesta...</div>
      </div>
    </div>

    <!-- Estado de error -->
    <div v-else-if="error" class="flex flex-center q-pa-xl">
      <div class="column items-center">
        <q-icon name="error_outline" size="80px" color="negative" />
        <div class="text-h6 q-mt-md">{{ error }}</div>
        <q-btn color="primary" label="Reintentar" class="q-mt-lg" @click="cargarEncuesta" />
      </div>
    </div>

    <!-- Formulario de encuesta -->
    <div v-else-if="encuesta && encuesta.id">
      <div class="row q-col-gutter-md">
        <div class="col-12 col-lg-8 offset-lg-2">
          <q-card flat bordered class="encuesta-card">
            <!-- Cabecera -->
            <q-card-section class="bg-primary text-white header-section">
              <div class="text-h5">{{ encuesta.titulo }}</div>
              <div class="text-subtitle2" v-if="encuesta.descripcion">{{ encuesta.descripcion }}</div>
              <div class="text-caption q-mt-sm" v-if="encuesta.fechaFinal">
                Disponible hasta: {{ formatDate(encuesta.fechaFinal) }}
              </div>
            </q-card-section>

            <q-separator />

            <!-- Información de progreso -->
            <q-card-section class="progress-section">
              <div class="row items-center q-col-gutter-md">
                <div class="col-12 col-sm-8">
                  <div class="text-subtitle1">
                    <q-icon name="fact_check" class="q-mr-xs" />
                    Progreso de envíos:
                  </div>
                  <div class="text-body2 q-mt-sm">
                    <q-badge color="primary" outline class="q-mr-sm">{{ totalEnvios }}</q-badge>
                    enviado{{ totalEnvios !== 1 ? 's' : '' }} de
                    <q-badge color="primary" outline class="q-mr-sm">{{ objetivo }}</q-badge>
                  </div>
                </div>
                <div class="col-12 col-sm-4 text-center">
                  <q-circular-progress :value="progreso * 100" size="60px" :color="getProgresoColor()" class="q-ma-md"
                    show-value font-size="12px" track-color="grey-3">
                    {{ Math.round(progreso * 100) }}%
                  </q-circular-progress>
                </div>
              </div>
            </q-card-section>

            <q-separator />

            <!-- Contenido de la encuesta -->
            <q-form ref="encuestaForm" @submit="confirmarEnvio">
              <!-- Secciones y preguntas -->
              <template v-for="(seccion, seccionIndex) in encuesta.secciones" :key="seccion.id">
                <q-card-section :class="seccionIndex % 2 === 0 ? 'seccion-par' : 'seccion-impar'" class="seccion-container">
                  <div class="text-h6 q-mb-md section-title">{{ seccionIndex + 1 }}. {{ seccion.titulo }}</div>
                  <p v-if="seccion.descripcion" class="q-mb-lg section-description">{{ seccion.descripcion }}</p>

                  <!-- Preguntas de la sección -->
                  <div v-for="(pregunta, preguntaIndex) in seccion.preguntas" :key="pregunta.id"
                    class="pregunta-container q-mb-lg">
                    <div class="row items-center q-mb-sm question-header">
                      <div class="text-subtitle1 question-text">
                        {{ seccionIndex + 1 }}.{{ preguntaIndex + 1 }}. {{ pregunta.enunciado }}
                      </div>
                      <q-badge v-if="pregunta.obligatoria" color="negative" class="q-ml-sm required-badge">
                        Obligatoria
                      </q-badge>
                    </div>

                    <!-- Campo para respuesta según tipo -->
                    <div class="q-pl-md q-mt-sm answer-container">
                      <!-- Texto corto -->
                      <q-input v-if="pregunta.tipo === 'text'" outlined dense placeholder="Escriba su respuesta aquí"
                        v-model="respuestas[pregunta.id]" class="custom-input"
                        :rules="pregunta.obligatoria ? [val => !!val || 'Este campo es obligatorio'] : []" />

                      <!-- Texto largo -->
                      <q-input v-else-if="pregunta.tipo === 'textarea'" type="textarea" outlined autogrow
                        placeholder="Escriba su respuesta aquí" v-model="respuestas[pregunta.id]" class="custom-input"
                        :rules="pregunta.obligatoria ? [val => !!val || 'Este campo es obligatorio'] : []" />

                      <!-- Número -->
                      <q-input v-else-if="pregunta.tipo === 'number'" type="number" outlined dense placeholder="0"
                        v-model.number="respuestas[pregunta.id]" class="custom-input"
                        :rules="pregunta.obligatoria ? [val => val !== null && val !== undefined && val !== '' || 'Este campo es obligatorio'] : []" />

                      <!-- Opciones simples (radio) -->
                      <div v-else-if="pregunta.tipo === 'single'" class="q-mt-sm">
                        <q-option-group v-model="respuestas[pregunta.id]"
                          :options="pregunta.opciones.map(opt => ({ label: opt.texto, value: opt.id }))" type="radio"
                          color="primary"
                          :rules="pregunta.obligatoria ? [val => !!val || 'Debe seleccionar una opción'] : []" />
                      </div>

                      <!-- Opciones múltiples (checkbox) -->
                      <div v-else-if="pregunta.tipo === 'multi'" class="q-mt-sm">
                        <q-option-group v-model="respuestas[pregunta.id]"
                          :options="pregunta.opciones.map(opt => ({ label: opt.texto, value: opt.id }))" type="checkbox"
                          color="primary"
                          :rules="pregunta.obligatoria ? [val => val && val.length > 0 || 'Debe seleccionar al menos una opción'] : []" />
                      </div>

                      <!-- Escala -->
                      <div v-else-if="pregunta.tipo === 'scale'" class="q-mt-md scale-container">
                        <div class="row justify-between q-mb-xs scale-labels">
                          <div class="text-caption">{{ pregunta.min }}</div>
                          <div class="text-caption">{{ pregunta.max }}</div>
                        </div>
                        <q-slider v-model="respuestas[pregunta.id]" :min="pregunta.min" :max="pregunta.max" :step="1"
                          label markers color="primary" class="custom-slider" />
                      </div>

                      <!-- Fecha -->
                      <div v-else-if="pregunta.tipo === 'date'" class="q-mt-sm">
                        <q-input outlined dense placeholder="dd/mm/aaaa" mask="##/##/####" class="custom-input"
                          v-model="respuestas[pregunta.id]"
                          :rules="pregunta.obligatoria ? [val => !!val || 'Este campo es obligatorio'] : []">
                          <template v-slot:append>
                            <q-icon name="event" class="cursor-pointer">
                              <q-popup-proxy transition-show="scale" transition-hide="scale">
                                <q-date v-model="respuestas[pregunta.id]" mask="DD/MM/YYYY">
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
                <q-separator v-if="seccionIndex < encuesta.secciones.length - 1" />
              </template>

              <!-- Sección de ubicación geográfica mejorada -->
              <q-card-section class="location-section">
                <div class="text-h6 q-mb-sm location-title">
                  <q-icon name="location_on" class="q-mr-xs" />
                  Ubicación
                </div>
                <p class="text-grey-8 q-mb-md location-description">Para completar la encuesta, es necesario registrar la ubicación actual.</p>

                <!-- Mapa con ubicación actual -->
                <div class="map-container q-mb-md">
                  <div id="map" style="width: 100%; height: 300px; border-radius: 8px;" ref="mapContainer"></div>
                </div>

                <!-- Botón de calibrar ubicación -->
                <div class="row justify-center q-mt-md">
                  <q-btn
                    color="secondary"
                    icon="gps_fixed"
                    label="CALIBRAR UBICACIÓN"
                    @click="obtenerUbicacionActual"
                    :loading="cargandoUbicacion"
                    class="calibrate-btn"
                  />
                </div>
              </q-card-section>

              <q-separator />

              <!-- Botones de acción -->
              <q-card-actions align="right" class="action-buttons q-pa-md">
                <q-btn
                  label="LIMPIAR RESPUESTAS"
                  outline
                  color="accent"
                  @click="confirmarLimpiar"
                  class="q-mr-sm clear-btn"
                />
                <q-btn
                  label="GUARDAR Y ENVIAR"
                  type="submit"
                  color="primary"
                  :loading="guardando"
                  :disable="!coordenadas.lat || !coordenadas.lng"
                  class="submit-btn"
                />
              </q-card-actions>
            </q-form>
          </q-card>
        </div>
      </div>
    </div>

    <!-- Estado completado -->
    <div v-else-if="completado" class="flex flex-center q-pa-xl">
      <div class="column items-center success-container">
        <q-icon name="check_circle" size="80px" color="positive" />
        <div class="text-h6 q-mt-md">¡Gracias por completar la encuesta!</div>
        <p class="text-center q-mt-md">
          Tus respuestas han sido guardadas exitosamente.
        </p>
        <div class="q-gutter-md q-mt-lg">
          <q-btn color="primary" label="Realizar otra encuesta" to="/encuestadores" class="action-btn" />
          <q-btn outline color="primary" label="Ver mis envíos" to="/encuestadores/envios" class="action-btn" />
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from 'src/boot/axios'
import { useQuasar, date } from 'quasar'
import { useAuthStore } from 'src/stores/auth.store'
import 'leaflet/dist/leaflet.css'

// Variables y constantes
const $q = useQuasar()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

// Referencias
const mapContainer = ref(null)
const encuestaForm = ref(null)
let map = null
let marker = null

// Estados
const loading = ref(true)
const error = ref(null)
const encuesta = ref(null)
const respuestas = ref({})
const coordenadas = ref({ lat: null, lng: null })
const cargandoUbicacion = ref(false)
const guardando = ref(false)
const completado = ref(false)
const asignacion = ref(null)
const totalEnvios = ref(0)
const objetivo = ref(0)

// Cálculos derivados
const progreso = computed(() => {
  if (!objetivo.value) return 0
  return Math.min(totalEnvios.value / objetivo.value, 1)
})

// Cargar encuesta por ID
async function cargarEncuesta() {
  const encuestaId = route.params.id
  if (!encuestaId) {
    error.value = 'No se especificó ID de encuesta'
    loading.value = false
    return
  }

  loading.value = true
  error.value = null

  try {
    // Cargar datos de la encuesta
    const responseEncuesta = await api.get(`/encuestas/${encuestaId}`)
    encuesta.value = responseEncuesta.data

    // Verificar si la encuesta está activa
    if (!encuesta.value.activa) {
      error.value = 'Esta encuesta no está activa actualmente'
      loading.value = false
      return
    }

    // Cargar asignación del usuario
    await cargarAsignacion(encuestaId)

    // Inicializar respuestas vacías
    inicializarRespuestas()

    // Cargar mapa después de que el DOM esté listo
    setTimeout(() => {
      inicializarMapa()
      // No llamamos a obtenerUbicacionActual() automáticamente
    }, 500)

  } catch (err) {
    console.error('Error al cargar encuesta:', err)
    error.value = 'No se pudo cargar la encuesta'
  } finally {
    loading.value = false
  }
}

// Cargar asignación para obtener el objetivo
async function cargarAsignacion(encuestaId) {
  try {
    const response = await api.get('/asignaciones', {
      params: {
        encuesta_id: encuestaId,
        usuario_id: auth.user.id
      }
    })

    // Verificar si hay asignación
    if (response.data.data && response.data.data.length > 0) {
      asignacion.value = response.data.data[0]
      objetivo.value = asignacion.value.objetivo || 1

      // Cargar envíos realizados
      const enviosResponse = await api.get('/envios', {
        params: {
          encuesta_id: encuestaId,
          aplicador_id: auth.user.id
        }
      })

      totalEnvios.value = enviosResponse.data.data.length || 0
    } else {
      throw new Error('No tienes asignada esta encuesta')
    }
  } catch (err) {
    console.error('Error al cargar asignación:', err)
    throw err
  }
}

// Inicializar respuestas vacías
function inicializarRespuestas() {
  respuestas.value = {}

  // Preparar objeto de respuestas con valores iniciales
  encuesta.value.secciones.forEach(seccion => {
    seccion.preguntas.forEach(pregunta => {
      switch (pregunta.tipo) {
        case 'single':
          respuestas.value[pregunta.id] = null
          break
        case 'multi':
          respuestas.value[pregunta.id] = []
          break
        case 'scale':
          respuestas.value[pregunta.id] = pregunta.min || 0
          break
        case 'number':
          respuestas.value[pregunta.id] = null
          break
        default:
          respuestas.value[pregunta.id] = ''
      }
    })
  })
}

// Inicializar mapa
function inicializarMapa() {
  if (!mapContainer.value) return

  // Importar Leaflet de forma dinámica para evitar problemas de SSR
  import('leaflet').then(L => {
    // Crear mapa centrado en Bolivia (por defecto)
    map = L.map(mapContainer.value, {
      zoomAnimation: true,
      fadeAnimation: true
    }).setView([-17.3895, -66.1568], 15)

    // Añadir capa de mapa base (OpenStreetMap) con estilo personalizado
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      className: 'custom-tiles'
    }).addTo(map)

    // Deshabilitar interacciones para que el usuario no pueda manipular manualmente
    map.dragging.disable()
    map.touchZoom.disable()
    map.doubleClickZoom.disable()
    map.scrollWheelZoom.disable()
    map.boxZoom.disable()
    map.keyboard.disable()
    if (map.tap) map.tap.disable()

    // Añadir una animación suave al cargar el mapa
    setTimeout(() => {
      map.invalidateSize()
    }, 100)
  })
}

// Obtener ubicación actual
function obtenerUbicacionActual() {
  cargandoUbicacion.value = true

  if (navigator.geolocation) {
    // Opciones para geolocalización de alta precisión
    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        // Guardar coordenadas (no visibles para el usuario pero necesarias para el envío)
        coordenadas.value = {
          lat: position.coords.latitude.toFixed(11),
          lng: position.coords.longitude.toFixed(11)
        }

        // Actualizar mapa
        actualizarMapa(position.coords.latitude, position.coords.longitude)
        cargandoUbicacion.value = false

        // Notificar al usuario con animación
        $q.notify({
          type: 'positive',
          message: 'Ubicación actualizada correctamente',
          position: 'top',
          progress: true,
          timeout: 2000,
          classes: 'notification-custom'
        })
      },
      error => {
        cargandoUbicacion.value = false
        console.error('Error al obtener ubicación:', error)

        let mensaje = 'Error al obtener ubicación'

        switch (error.code) {
          case error.PERMISSION_DENIED:
            mensaje = 'Debe permitir el acceso a su ubicación para continuar'
            break
          case error.POSITION_UNAVAILABLE:
            mensaje = 'La información de ubicación no está disponible'
            break
          case error.TIMEOUT:
            mensaje = 'La solicitud para obtener la ubicación ha expirado'
            break
        }

        $q.notify({
          type: 'negative',
          message: mensaje,
          position: 'top',
          progress: true,
          timeout: 3000,
          classes: 'notification-custom'
        })
      },
      options
    )
  } else {
    cargandoUbicacion.value = false
    $q.notify({
      type: 'negative',
      message: 'Su navegador no soporta geolocalización',
      position: 'top',
      progress: true,
      timeout: 3000,
      classes: 'notification-custom'
    })
  }
}

// Actualizar mapa con la ubicación usando un icono SVG personalizado
function actualizarMapa(lat, lng) {
  if (!map) return

  import('leaflet').then(L => {
    // Definir el icono personalizado usando SVG en línea
    const svgIcon = L.divIcon({
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

    // Actualizar vista del mapa con animación
    map.flyTo([lat, lng], 16, {
      animate: true,
      duration: 1
    });

    // Actualizar o crear marcador con efecto de animación
    if (marker) {
      marker.setLatLng([lat, lng]).setIcon(svgIcon);
    } else {
      marker = L.marker([lat, lng], {
        icon: svgIcon
      }).addTo(map);

      // Agregamos una animación de pulso al marcador
      const markerElement = marker._icon;
      if (markerElement) {
        markerElement.style.transition = 'transform 0.3s ease-out';
        markerElement.style.transform = 'scale(1.2)';

        setTimeout(() => {
          markerElement.style.transform = 'scale(1)';
        }, 300);
      }
    }
  })
}

// Confirmar limpieza de respuestas
function confirmarLimpiar() {
  $q.dialog({
    title: 'Limpiar respuestas',
    message: '¿Estás seguro de que deseas borrar todas las respuestas?',
    cancel: {
      label: 'Cancelar',
      flat: true,
      color: 'grey-7'
    },
    ok: {
      label: 'Sí, limpiar todo',
      color: 'negative'
    },
    persistent: true,
    class: 'custom-dialog'
  }).onOk(() => {
    inicializarRespuestas()
    $q.notify({
      type: 'info',
      message: 'Todas las respuestas han sido borradas',
      position: 'top',
      progress: true,
      timeout: 2000,
      classes: 'notification-custom'
    })
  })
}

// Confirmar envío de respuestas
function confirmarEnvio() {
  // Verificar si se tiene ubicación
  if (!coordenadas.value.lat || !coordenadas.value.lng) {
    $q.notify({
      type: 'negative',
      message: 'Debe calibrar su ubicación antes de enviar la encuesta',
      position: 'top',
      progress: true,
      timeout: 3000,
      classes: 'notification-custom'
    })
    return
  }

  // Confirmar envío
  $q.dialog({
    title: 'Confirmar envío',
    message: '¿Está seguro que desea enviar esta encuesta?',
    ok: {
      label: 'Sí, enviar',
      color: 'primary'
    },
    cancel: {
      label: 'Cancelar',
      flat: true,
      color: 'grey-7'
    },
    persistent: true,
    class: 'custom-dialog'
  }).onOk(async () => {
    try {
      guardando.value = true

      // Preparar datos para envío
      const datos = prepararDatosParaEnvio()

      // Enviar datos al servidor
      await api.post('/envios', datos)

      guardando.value = false

      $q.notify({
        type: 'positive',
        message: 'Encuesta enviada correctamente',
        position: 'top',
        progress: true,
        timeout: 2000,
        classes: 'notification-custom'
      })

      // Incrementar contador de envíos
      totalEnvios.value++

      // Mostrar animación de completado antes de redireccionar
      completado.value = true

      // Redireccionar después de una breve espera para mostrar la animación
      setTimeout(() => {
        router.push('/encuestadores')
      }, 2000)

    } catch (err) {
      guardando.value = false
      console.error('Error al guardar respuestas:', err)

      // Mostrar mensaje de error específico si viene del servidor
      const mensaje = err.response?.data?.message || 'Error al enviar la encuesta'

      $q.notify({
        type: 'negative',
        message: mensaje,
        position: 'top',
        progress: true,
        timeout: 3000,
        classes: 'notification-custom'
      })

      // Si hay errores de validación específicos, mostrarlos
      if (err.response?.data?.errors) {
        const errors = err.response.data.errors
        Object.keys(errors).forEach(key => {
          $q.notify({
            type: 'negative',
            message: errors[key][0],
            position: 'top',
            timeout: 3000,
            progress: true,
            classes: 'notification-custom'
          })
        })
      }
    }
  })
}

// Preparar datos para envío
function prepararDatosParaEnvio() {
  const preguntasPorTipo = {}

  // Agrupar preguntas por tipo
  encuesta.value.secciones.forEach(seccion => {
    seccion.preguntas.forEach(pregunta => {
      preguntasPorTipo[pregunta.id] = pregunta
    })
  })

  // Preparar objeto de respuestas formateadas para la API
  const respuestasFormateadas = []

  for (const [preguntaId, valor] of Object.entries(respuestas.value)) {
    if (valor === null || valor === undefined || valor === '') continue

    const pregunta = preguntasPorTipo[preguntaId]
    if (!pregunta) continue

    const respuestaObj = {
      pregunta_id: parseInt(preguntaId)
    }

    switch (pregunta.tipo) {
      case 'text':
      case 'textarea':
        respuestaObj.valor_texto = valor
        break
      case 'number':
        respuestaObj.valor_num = parseFloat(valor)
        break
      case 'scale':
        respuestaObj.valor_escala = parseInt(valor)
        break
      case 'date':
        respuestaObj.valor_texto = valor
        break
      case 'single':
        respuestaObj.opciones_ids = [parseInt(valor)]
        break
      case 'multi':
        respuestaObj.opciones_ids = valor.map(v => parseInt(v))
        break
    }

    respuestasFormateadas.push(respuestaObj)
  }

  return {
    encuesta_id: encuesta.value.id,
    aplicador_id: auth.user.id,
    lat: parseFloat(coordenadas.value.lat),
    lng: parseFloat(coordenadas.value.lng),
    respuestas: respuestasFormateadas
  }
}

// Funciones auxiliares
function formatDate(dateStr) {
  if (!dateStr) return 'No especificada'
  return date.formatDate(dateStr, 'DD/MM/YYYY')
}

function getProgresoColor() {
  if (progreso.value >= 1) return 'positive'
  if (progreso.value >= 0.7) return 'secondary'
  if (progreso.value >= 0.3) return 'primary'
  return 'negative'
}

// Ciclo de vida del componente
onMounted(() => {
  cargarEncuesta()

  // Configurar tema para Quasar
  $q.dark.set(false)
})
</script>

<style lang="scss">
// Definición de variables de colores
:root {
  --color-primary: #663399;
  --color-secondary: #009999;
  --color-accent: #00AAAA;
  --color-background: #FFFFFF;
  --color-text: #333333;
  --color-text-light: #666666;
  --color-border: #EEEEEE;
}

// Sobrescribir clases de Quasar con nuestros colores personalizados
.q-page {
  background-color: #f5f5f7;
}

.bg-primary {
  background-color: var(--color-primary) !important;
}

.text-primary {
  color: var(--color-primary) !important;
}

.bg-secondary {
  background-color: var(--color-secondary) !important;
}

.text-secondary {
  color: var(--color-secondary) !important;
}

.bg-accent {
  background-color: var(--color-accent) !important;
}

.text-accent {
  color: var(--color-accent) !important;
}

// Estilos generales de la página
.encuesta-page {
  min-height: 100vh;
  background-color: #f5f5f7;
  padding-top: 20px;
  padding-bottom: 40px;
}

// Estilos para la tarjeta principal
.encuesta-card {
  border-radius: 16px !important;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.15) !important;
  }
}

// Cabecera
// Cabecera
.header-section {
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary)) !important;
  padding: 24px !important;
}

// Sección de progreso
.progress-section {
  background-color: rgba(0, 153, 153, 0.1) !important;
  border-left: 4px solid var(--color-secondary);
  transition: all 0.3s ease;
}

// Secciones
.seccion-par {
  background-color: var(--color-background);
  border-left: 3px solid var(--color-primary);
}

.seccion-impar {
  background-color: rgba(102, 51, 153, 0.05);
  border-left: 3px solid var(--color-secondary);
}

.seccion-container {
  padding: 28px !important;
  transition: all 0.3s ease;

  &:hover {
    background-color: rgba(0, 170, 170, 0.05);
  }
}

// Títulos y descripciones de sección
.section-title {
  color: var(--color-primary);
  font-weight: 600;
  position: relative;
  padding-bottom: 8px;

  &:after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 40px;
    height: 3px;
    background-color: var(--color-accent);
  }
}

.section-description {
  color: var(--color-text-light);
  font-style: italic;
}

// Preguntas
.pregunta-container {
  padding: 16px;
  margin-bottom: 24px !important;
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.7);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  border-left: 2px solid transparent;

  &:hover {
    border-left: 2px solid var(--color-accent);
    transform: translateX(2px);
    background-color: rgba(255, 255, 255, 0.9);
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.08);
  }
}

.question-header {
  display: flex;
  align-items: center;
}

.question-text {
  font-weight: 500;
  color: var(--color-primary);
}

.required-badge {
  background-color: #ff5252 !important;
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 4px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 0.8; }
  50% { opacity: 1; }
  100% { opacity: 0.8; }
}

// Contenedores de respuesta
.answer-container {
  padding: 12px 0;
}

// Inputs personalizados
.custom-input {
  transition: all 0.3s ease;

  .q-field__control {
    background-color: rgba(255, 255, 255, 0.9);
    border: 1px solid rgba(0, 153, 153, 0.3);
    border-radius: 8px;
  }

  &.q-field--focused {
    .q-field__control {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 2px rgba(102, 51, 153, 0.2);
    }
  }
}

// Sliders personalizados
.scale-container {
  padding: 8px 12px;
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
}

.custom-slider {
  .q-slider__track-container {
    height: 6px;
    background: rgba(102, 51, 153, 0.1);
  }

  .q-slider__selection {
    background: linear-gradient(90deg, var(--color-secondary), var(--color-primary));
  }

  .q-slider__thumb {
    background: var(--color-primary);
    width: 18px;
    height: 18px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    transition: transform 0.2s ease;

    &:hover {
      transform: scale(1.2);
    }
  }
}

// Sección de ubicación
.location-section {
  background: linear-gradient(to right, rgba(102, 51, 153, 0.05), rgba(0, 153, 153, 0.05));
  padding: 28px !important;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.location-title {
  color: var(--color-primary);
  display: flex;
  align-items: center;

  .q-icon {
    color: var(--color-secondary);
  }
}

.location-description {
  color: var(--color-text);
  margin-left: 28px;
}

.map-container {
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
  }
}

// Estilo personalizado para el marcador SVG
.custom-marker-icon {
  background: none !important;
  transition: all 0.3s ease;

  svg {
    filter: drop-shadow(0 3px 5px rgba(0, 0, 0, 0.3));
  }
}

// Botón de calibrar
.calibrate-btn {
  background: linear-gradient(135deg, var(--color-secondary), var(--color-accent)) !important;
  width: 250px;
  height: 48px;
  border-radius: 24px;
  font-weight: 500;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 10px rgba(0, 153, 153, 0.3);

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 14px rgba(0, 153, 153, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
}

// Botones de acción
.action-buttons {
  background-color: rgba(102, 51, 153, 0.03);
  padding: 20px !important;
}

.clear-btn {
  border: 1px solid var(--color-accent);
  border-radius: 8px;
  transition: all 0.3s ease;

  &:hover {
    background-color: rgba(0, 153, 153, 0.1);
    transform: translateY(-2px);
  }
}

.submit-btn {
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary)) !important;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(102, 51, 153, 0.3);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 14px rgba(102, 51, 153, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
}

// Estado de éxito
.success-container {
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.action-btn {
  border-radius: 8px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  }
}

// Diálogos personalizados
.custom-dialog {
  border-radius: 16px;

  .q-card {
    border-radius: 16px;
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
  }

  .q-card__section {
    padding: 20px 24px;
  }

  .q-card__actions {
    padding: 16px 24px;
  }
}

// Notificaciones personalizadas
.notification-custom {
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

  &.bg-positive {
    background: linear-gradient(135deg, #21ba45, var(--color-secondary)) !important;
  }

  &.bg-negative {
    background: linear-gradient(135deg, #c10015, #ff5252) !important;
  }

  &.bg-info {
    background: linear-gradient(135deg, var(--color-primary), #1976d2) !important;
  }
}

// Ajustes para dispositivos móviles
@media (max-width: 600px) {
  .map-container {
    height: 250px;
  }

  .calibrate-btn {
    width: 100%;
  }

  .encuesta-card {
    margin: 0 -12px;
    border-radius: 0 !important;
  }

  .seccion-container {
    padding: 20px !important;
  }

  .pregunta-container {
    padding: 12px;
  }
}
</style>
