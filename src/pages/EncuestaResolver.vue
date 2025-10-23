<template>
  <q-page padding class="encuesta-page">
    <!-- Estado de carga -->
    <div v-if="loading" class="flex flex-center q-pa-xl">
      <div class="column items-center loading-container" data-aos="fade-up" data-aos-duration="800">
        <q-spinner-dots size="80px" color="purple" />
        <div class="text-h5 text-purple q-mt-md">Cargando encuesta...</div>
        <div class="loading-progress">
          <div class="loading-bar"></div>
        </div>
      </div>
    </div>

    <!-- Estado de error -->
    <div v-else-if="error" class="flex flex-center q-pa-xl">
      <div class="column items-center error-container" data-aos="fade-up" data-aos-duration="800">
        <q-icon name="error_outline" size="80px" color="negative" />
        <div class="text-h5 text-weight-bold text-purple q-mt-md">{{ error }}</div>
        <p class="text-center q-mt-md text-grey-8">Ocurrió un problema al intentar cargar la encuesta. Por favor intente nuevamente.</p>
        <q-btn
          color="teal"
          label="Reintentar"
          class="q-mt-lg retry-btn"
          icon="refresh"
          @click="cargarEncuesta"
        />
      </div>
    </div>

    <!-- Formulario de encuesta -->
    <div v-else-if="encuesta && encuesta.id">
      <div class="row q-col-gutter-lg">
        <div class="col-12 col-lg-8 offset-lg-2">
          <q-card flat bordered class="encuesta-card" data-aos="fade-up" data-aos-duration="1000">
            <!-- Cabecera -->
            <q-card-section class="header-section">
              <div class="text-h4 text-white text-weight-bold">{{ encuesta.titulo }}</div>
              <div class="text-subtitle1 text-white opacity-8 q-mt-sm" v-if="encuesta.descripcion">{{ encuesta.descripcion }}</div>
              <div class="text-caption text-white q-mt-sm deadline" v-if="encuesta.fechaFinal">
                <q-icon name="event" size="18px" class="q-mr-xs" />
                Disponible hasta: {{ formatDate(encuesta.fechaFinal) }}
              </div>
            </q-card-section>

            <!-- Información de progreso -->
            <q-card-section class="progress-section" data-aos="fade-right" data-aos-duration="600" data-aos-delay="200">
              <div class="row items-center q-col-gutter-lg">
                <div class="col-12 col-sm-8">
                  <div class="text-h6 text-purple">
                    <q-icon name="fact_check" class="q-mr-xs" />
                    Progreso de envíos
                  </div>
                  <div class="text-body1 q-mt-sm">
                    Has completado <q-badge color="purple" class="badge-custom q-mr-xs">{{ totalEnvios }}</q-badge>
                    de <q-badge color="teal" class="badge-custom">{{ objetivo }}</q-badge> encuestas asignadas
                  </div>
                </div>
                <div class="col-12 col-sm-4 text-center">
                  <q-circular-progress
                    :value="progreso * 100"
                    size="80px"
                    :color="getProgresoColor()"
                    class="progress-circle shadow-3"
                    show-value
                    font-size="16px"
                    track-color="grey-3"
                    :thickness="0.2"
                  >
                    <div class="text-weight-bold">{{ Math.round(progreso * 100) }}%</div>
                  </q-circular-progress>
                </div>
              </div>

              <!-- Barra de progreso horizontal -->
              <div class="progress-bar-container q-mt-md">
                <div class="progress-bar-bg">
                  <div class="progress-bar-fill" :style="`width: ${Math.round(progreso * 100)}%`" :class="getProgresoColor()"></div>
                </div>
              </div>
            </q-card-section>

            <q-separator />

            <!-- Contenido de la encuesta -->
            <q-form ref="encuestaForm" @submit="confirmarEnvio">
              <!-- Secciones y preguntas -->
              <template v-for="(seccion, seccionIndex) in encuesta.secciones" :key="seccion.id">
                <q-card-section
                  :class="seccionIndex % 2 === 0 ? 'seccion-par' : 'seccion-impar'"
                  class="seccion-container"
                  data-aos="fade-up"
                  :data-aos-delay="seccionIndex * 100"
                  data-aos-duration="800"
                >
                  <div class="seccion-header">
                    <div class="text-h5 text-weight-bold section-title">{{ seccionIndex + 1 }}. {{ seccion.titulo }}</div>
                    <div class="section-badge q-ml-sm" :class="seccionIndex % 2 === 0 ? 'bg-purple' : 'bg-teal'">Sección {{ seccionIndex + 1 }}</div>
                  </div>

                  <p v-if="seccion.descripcion" class="q-mb-lg section-description">{{ seccion.descripcion }}</p>

                  <!-- Preguntas de la sección -->
                  <div
                    v-for="(pregunta, preguntaIndex) in seccion.preguntas"
                    :key="pregunta.id"
                    class="pregunta-container q-mb-xl"
                    data-aos="fade-right"
                    :data-aos-delay="preguntaIndex * 80 + 100"
                    data-aos-duration="600"
                  >
                    <div class="row items-center q-mb-sm question-header">
                      <div class="text-subtitle1 question-text">
                        <span class="question-number">{{ seccionIndex + 1 }}.{{ preguntaIndex + 1 }}.</span> {{ pregunta.enunciado }}
                      </div>
                      <q-badge v-if="pregunta.obligatoria" color="negative" class="q-ml-sm required-badge">
                        <q-icon name="priority_high" size="12px" class="q-mr-xs" /> Obligatoria
                      </q-badge>
                    </div>

                    <!-- Campo para respuesta según tipo -->
                    <div class="q-pl-md q-mt-sm answer-container">
                      <!-- Texto corto -->
                      <q-input
                        v-if="pregunta.tipo === 'text'"
                        outlined
                        dense
                        placeholder="Escriba su respuesta aquí"
                        v-model="respuestas[pregunta.id]"
                        class="custom-input"
                        :rules="pregunta.obligatoria ? [val => !!val || 'Este campo es obligatorio'] : []"
                      >
                        <template v-slot:prepend>
                          <q-icon name="short_text" color="purple" />
                        </template>
                        <template v-slot:append>
                          <q-icon name="check_circle" color="teal" v-if="respuestas[pregunta.id]" />
                        </template>
                      </q-input>

                      <!-- Texto largo -->
                      <q-input
                        v-else-if="pregunta.tipo === 'textarea'"
                        type="textarea"
                        outlined
                        autogrow
                        placeholder="Escriba su respuesta aquí"
                        v-model="respuestas[pregunta.id]"
                        class="custom-input"
                        :rules="pregunta.obligatoria ? [val => !!val || 'Este campo es obligatorio'] : []"
                        counter
                      >
                        <template v-slot:prepend>
                          <q-icon name="notes" color="purple" />
                        </template>
                        <template v-slot:append>
                          <q-icon name="check_circle" color="teal" v-if="respuestas[pregunta.id]" />
                        </template>
                      </q-input>

                      <!-- Número -->
                      <q-input
                        v-else-if="pregunta.tipo === 'number'"
                        type="number"
                        outlined
                        dense
                        placeholder="0"
                        v-model.number="respuestas[pregunta.id]"
                        class="custom-input"
                        :rules="pregunta.obligatoria ? [val => val !== null && val !== undefined && val !== '' || 'Este campo es obligatorio'] : []"
                      >
                        <template v-slot:prepend>
                          <q-icon name="numbers" color="purple" />
                        </template>
                        <template v-slot:append>
                          <q-icon name="check_circle" color="teal" v-if="respuestas[pregunta.id] !== null && respuestas[pregunta.id] !== undefined && respuestas[pregunta.id] !== ''" />
                        </template>
                      </q-input>

                      <!-- Opciones simples (radio) -->
                      <div v-else-if="pregunta.tipo === 'single'" class="q-mt-sm option-container">
                        <q-option-group
                          v-model="respuestas[pregunta.id]"
                          :options="pregunta.opciones.map(opt => ({ label: opt.texto, value: opt.id }))"
                          type="radio"
                          color="teal"
                          class="custom-radio"
                          :rules="pregunta.obligatoria ? [val => !!val || 'Debe seleccionar una opción'] : []"
                        />
                      </div>

                      <!-- Opciones múltiples (checkbox) -->
                      <div v-else-if="pregunta.tipo === 'multi'" class="q-mt-sm option-container">
                        <q-option-group
                          v-model="respuestas[pregunta.id]"
                          :options="pregunta.opciones.map(opt => ({ label: opt.texto, value: opt.id }))"
                          type="checkbox"
                          color="purple"
                          class="custom-checkbox"
                          :rules="pregunta.obligatoria ? [val => val && val.length > 0 || 'Debe seleccionar al menos una opción'] : []"
                        />
                      </div>

                      <!-- Escala -->
                      <div v-else-if="pregunta.tipo === 'scale'" class="scale-container">
                        <div class="scale-labels">
                          <div class="scale-min">{{ pregunta.min }}</div>
                          <div class="scale-max">{{ pregunta.max }}</div>
                        </div>
                        <div class="scale-value-display">
                          <span class="text-h6 text-purple">{{ respuestas[pregunta.id] }}</span>
                        </div>
                        <q-slider
                          v-model="respuestas[pregunta.id]"
                          :min="pregunta.min"
                          :max="pregunta.max"
                          :step="1"
                          label
                          markers
                          color="teal"
                          class="custom-slider"
                        />
                      </div>

                      <!-- Fecha -->
                      <div v-else-if="pregunta.tipo === 'date'" class="q-mt-sm">
                        <q-input
                          outlined
                          dense
                          placeholder="dd/mm/aaaa"
                          mask="##/##/####"
                          class="custom-input date-input"
                          v-model="respuestas[pregunta.id]"
                          :rules="pregunta.obligatoria ? [val => !!val || 'Este campo es obligatorio'] : []"
                        >
                          <template v-slot:prepend>
                            <q-icon name="event" color="purple" />
                          </template>
                          <template v-slot:append>
                            <q-icon name="event" class="cursor-pointer">
                              <q-popup-proxy transition-show="scale" transition-hide="scale" class="date-popup">
                                <q-date
                                  v-model="respuestas[pregunta.id]"
                                  mask="DD/MM/YYYY"
                                  color="teal"
                                  today-btn
                                >
                                  <div class="row justify-end q-pa-sm">
                                    <q-btn v-close-popup flat label="Seleccionar" color="teal" />
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
              <q-card-section class="location-section" data-aos="fade-up" data-aos-duration="800">
                <div class="location-header">
                  <div class="text-h5 text-weight-bold location-title">
                    <q-icon name="location_on" class="q-mr-sm" />
                    Ubicación
                  </div>
                  <div class="location-status" v-if="coordenadas.lat && coordenadas.lng">
                    <q-chip color="positive" text-color="white" icon="check_circle">
                      Ubicación capturada
                    </q-chip>
                  </div>
                </div>

                <p class="text-grey-8 q-mb-md location-description">
                  Para completar la encuesta, es necesario registrar la ubicación actual.
                  <span class="text-negative" v-if="!coordenadas.lat || !coordenadas.lng"> (Pendiente)</span>
                </p>

                <!-- Mapa con ubicación actual -->
                <div class="map-container q-mb-md" :class="{'map-with-location': coordenadas.lat && coordenadas.lng}">
                  <div id="map" style="width: 100%; height: 350px; border-radius: 12px;" ref="mapContainer"></div>
                </div>

                <!-- Botón de calibrar ubicación -->
                <div class="row justify-center q-mt-lg">
                  <q-btn
                    color="teal"
                    icon="gps_fixed"
                    label="CALIBRAR UBICACIÓN"
                    @click="obtenerUbicacionActual"
                    :loading="cargandoUbicacion"
                    class="calibrate-btn"
                    size="lg"
                  />
                </div>

                <!-- Coordenadas (solo para debug) -->
                <div class="coordinates-display q-mt-md" v-if="coordenadas.lat && coordenadas.lng">
                  <div class="text-subtitle1 text-teal">Coordenadas capturadas:</div>
                  <div class="row q-col-gutter-md q-mt-xs">
                    <div class="col-6">
                      <q-input dense outlined readonly label="Latitud" v-model="coordenadas.lat" class="coordinate-input">
                        <template v-slot:prepend>
                          <q-icon name="north" color="teal" />
                        </template>
                      </q-input>
                    </div>
                    <div class="col-6">
                      <q-input dense outlined readonly label="Longitud" v-model="coordenadas.lng" class="coordinate-input">
                        <template v-slot:prepend>
                          <q-icon name="east" color="teal" />
                        </template>
                      </q-input>
                    </div>
                  </div>
                </div>
              </q-card-section>

              <q-separator />

              <!-- Botones de acción -->
              <q-card-actions class="action-buttons q-pa-lg">
                <q-btn
                  label="LIMPIAR RESPUESTAS"
                  outline
                  color="purple"
                  @click="confirmarLimpiar"
                  class="q-mr-sm clear-btn"
                  icon="delete_sweep"
                />
                <q-btn
                  label="GUARDAR Y ENVIAR"
                  type="submit"
                  color="teal"
                  :loading="guardando"
                  :disable="!coordenadas.lat || !coordenadas.lng"
                  class="submit-btn"
                  icon-right="send"
                />
              </q-card-actions>
            </q-form>
          </q-card>
        </div>
      </div>
    </div>

    <!-- Estado completado -->
    <div v-else-if="completado" class="flex flex-center q-pa-xl">
      <div class="column items-center success-container" data-aos="zoom-in" data-aos-duration="800">
        <div class="success-icon">
          <q-icon name="check_circle" size="80px" color="positive" />
          <div class="success-confetti"></div>
        </div>
        <div class="text-h4 text-purple text-weight-bold q-mt-lg">¡Gracias por completar la encuesta!</div>
        <p class="text-subtitle1 text-center q-mt-md q-mb-xl">
          Tus respuestas han sido guardadas exitosamente y contribuirán significativamente a nuestro estudio.
        </p>
        <div class="row q-gutter-md q-mt-md">
          <q-btn color="teal" label="Realizar otra encuesta" to="/encuestadores" class="action-btn" icon="list_alt" />
          <q-btn outline color="purple" label="Ver mis envíos" to="/encuestadores/envios" class="action-btn" icon="history" />
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from 'src/boot/axios'
import { useQuasar, date } from 'quasar'
import { useAuthStore } from 'src/stores/auth.store'
import 'leaflet/dist/leaflet.css'
import AOS from 'aos'

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

// Inicializar AOS (si está disponible)
const initAOS = () => {
  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 800,
      once: false,
      mirror: true,
      offset: 50
    });
  }
};

// Refrescar AOS
const refreshAOS = () => {
  if (typeof AOS !== 'undefined') {
    setTimeout(() => {
      AOS.refresh();
    }, 200);
  }
};

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
      refreshAOS(); // Refrescar AOS después de cargar todo
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
          classes: 'notification-custom',
          icon: 'location_on',
          multiLine: true,
          html: true,
          caption: 'Las coordenadas han sido guardadas con precisión'
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
          classes: 'notification-custom',
          icon: 'error',
          multiLine: true,
          actions: [
            { label: 'Reintentar', color: 'white', handler: () => obtenerUbicacionActual() }
          ]
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
      classes: 'notification-custom',
      icon: 'error'
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
      color: 'negative',
      unelevated: true
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
      classes: 'notification-custom',
      icon: 'delete_sweep'
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
      classes: 'notification-custom',
      icon: 'gps_off'
    })
    return
  }

  // Confirmar envío con diálogo mejorado
  $q.dialog({
    title: 'Confirmar envío',
    message: '¿Está seguro que desea enviar esta encuesta? Una vez enviada, no podrá modificar sus respuestas.',
    html: true,
    ok: {
      label: 'Sí, enviar',
      color: 'teal',
      unelevated: true,
      icon: 'send'
    },
    cancel: {
      label: 'Cancelar',
      flat: true,
      color: 'grey-7'
    },
    persistent: true,
    class: 'confirm-dialog'
  }).onOk(async () => {
    try {
      guardando.value = true

      // Mostrar spinner personalizado
      $q.loading.show({
        message: 'Enviando encuesta...',
        spinnerColor: 'teal',
        spinnerSize: 80,
        messageColor: 'purple',
        backgroundColor: 'rgba(255, 255, 255, 0.9)'
      })

      // Preparar datos para envío
      const datos = prepararDatosParaEnvio()

      // Enviar datos al servidor
      await api.post('/envios', datos)

      guardando.value = false
      $q.loading.hide()

      // Notificación de éxito mejorada
      $q.notify({
        type: 'positive',
        message: 'Encuesta enviada correctamente',
        position: 'top',
        progress: true,
        timeout: 2000,
        classes: 'notification-custom success-notification',
        icon: 'check_circle'
      })

      // Incrementar contador de envíos
      totalEnvios.value++

      // Mostrar animación de completado antes de redireccionar
      completado.value = true

      // Refrescar AOS para la animación de completado
      nextTick(() => {
        refreshAOS()
      })

      // Redireccionar después de una breve espera para mostrar la animación
      setTimeout(() => {
        router.push('/encuestadores')
      }, 3000)

    } catch (err) {
      guardando.value = false
      $q.loading.hide()
      console.error('Error al guardar respuestas:', err)

      // Mostrar mensaje de error específico si viene del servidor
      const mensaje = err.response?.data?.message || 'Error al enviar la encuesta'

      $q.notify({
        type: 'negative',
        message: mensaje,
        position: 'top',
        progress: true,
        timeout: 3000,
        classes: 'notification-custom error-notification',
        icon: 'error'
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
            classes: 'notification-custom validation-error',
            icon: 'error_outline'
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
  if (progreso.value >= 0.3) return 'teal'
  return 'negative'
}

// Ciclo de vida del componente
onMounted(() => {
  // Inicializar AOS
  initAOS()

  // Cargar encuesta
  cargarEncuesta()

  // Configurar tema para Quasar
  $q.dark.set(false)
})
</script>

<style lang="scss">
// Definición de variables de colores
:root {
  --purple: #663399;
  --teal: #009999;
  --light-teal: #00AAAA;
  --white: #FFFFFF;
}

// Sobrescribir clases de Quasar con nuestros colores personalizados
.q-page {
  background-color: #f5f7fa;
  min-height: 100vh;
}

.text-purple {
  color: var(--purple) !important;
}

.text-teal {
  color: var(--teal) !important;
}

.bg-purple {
  background-color: var(--purple) !important;
}

.bg-teal {
  background-color: var(--teal) !important;
}

// Estilos generales de la página
.encuesta-page {
  padding-top: 20px;
  padding-bottom: 40px;
  background: linear-gradient(135deg, #f5f7fa 0%, #f0f2f5 100%);
}

// Contenedor de carga
.loading-container {
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  animation: fadeIn 0.6s ease-out;
  width: 300px;

  .loading-progress {
    width: 200px;
    height: 4px;
    background-color: rgba(102, 51, 153, 0.1);
    border-radius: 2px;
    margin-top: 20px;
    overflow: hidden;

    .loading-bar {
      width: 30%;
      height: 100%;
      background: linear-gradient(90deg, var(--purple), var(--teal));
      border-radius: 2px;
      animation: loading 1.5s infinite ease-in-out;
    }
  }
}

@keyframes loading {
  0% {
    width: 0%;
    margin-left: 0%;
  }
  50% {
    width: 30%;
    margin-left: 70%;
  }
  100% {
    width: 0%;
    margin-left: 0%;
  }
}

// Contenedor de error
.error-container {
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 500px;

  .retry-btn {
    background: linear-gradient(135deg, var(--teal), var(--light-teal)) !important;
    border-radius: 8px;
    box-shadow: 0 4px 10px rgba(0, 153, 153, 0.3);
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 14px rgba(0, 153, 153, 0.4);
    }
  }
}

// Estilos para la tarjeta principal
.encuesta-card {
  border-radius: 16px !important;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12) !important;
  transition: all 0.4s cubic-bezier(0.19, 1, 0.22, 1);
  border: none !important;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15) !important;
  }
}

// Cabecera
.header-section {
  background: linear-gradient(135deg, var(--purple) 0%, var(--teal) 100%) !important;
  padding: 30px !important;
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

  .deadline {
    background: rgba(0, 0, 0, 0.1);
    display: inline-block;
    padding: 4px 12px;
    border-radius: 20px;
    margin-top: 12px !important;
    border-left: 3px solid rgba(255, 255, 255, 0.4);
  }
}

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

// Sección de progreso
.progress-section {
  background: linear-gradient(to right, rgba(102, 51, 153, 0.05), rgba(0, 153, 153, 0.05)) !important;
  border-left: 4px solid var(--teal);
  padding: 24px !important;

  .badge-custom {
    font-size: 16px;
    border-radius: 6px;
    padding: 4px 8px;
    font-weight: bold;
  }

  .progress-circle {
    transition: all 0.3s ease;

    &:hover {
      transform: scale(1.05);
    }
  }

  .progress-bar-container {
    margin-top: 16px;

    .progress-bar-bg {
      width: 100%;
      height: 8px;
      background-color: rgba(0, 0, 0, 0.1);
      border-radius: 4px;
      overflow: hidden;

      .progress-bar-fill {
        height: 100%;
        border-radius: 4px;
        transition: width 0.8s cubic-bezier(0.19, 1, 0.22, 1);

        &.positive {
          background: linear-gradient(90deg, var(--teal), #21ba45);
        }

        &.secondary {
          background: linear-gradient(90deg, var(--teal), var(--light-teal));
        }

        &.teal {
          background: linear-gradient(90deg, var(--purple), var(--teal));
        }

        &.negative {
          background: linear-gradient(90deg, #c10015, var(--purple));
        }
      }
    }
  }
}

// Secciones
.seccion-par {
  background-color: var(--white);
  border-left: 4px solid var(--purple);
}

.seccion-impar {
  background-color: rgba(102, 51, 153, 0.05);
  border-left: 4px solid var(--teal);
}

.seccion-container {
  padding: 30px !important;
  transition: all 0.3s ease;

  &:hover {
    background-color: rgba(0, 170, 170, 0.03);
  }

  .seccion-header {
    display: flex;
    align-items: center;
    margin-bottom: 20px;

    .section-badge {
      font-size: 12px;
      padding: 3px 10px;
      border-radius: 30px;
      color: white;
      font-weight: 500;
    }
  }
}

// Títulos y descripciones de sección
.section-title {
  color: var(--purple);
  position: relative;
}

.section-description {
  color: #666;
  font-style: italic;
  border-left: 3px solid rgba(102, 51, 153, 0.2);
  padding-left: 12px;
  margin-left: 5px;
  font-size: 16px;
}

// Preguntas
.pregunta-container {
  padding: 20px;
  margin-bottom: 30px !important;
  border-radius: 12px;
  background-color: rgba(255, 255, 255, 0.8);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  border-left: 3px solid rgba(0, 153, 153, 0.3);

  &:hover {
    transform: translateX(5px);
    background-color: rgba(255, 255, 255, 1);
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
    border-left: 3px solid var(--teal);
  }
}

.question-header {
  margin-bottom: 15px;
  padding-bottom: 8px;
  border-bottom: 1px dashed rgba(102, 51, 153, 0.2);
}

.question-text {
  font-weight: 500;
  color: var(--purple);
  font-size: 18px;

  .question-number {
    color: var(--teal);
    font-weight: 700;
  }
}

.required-badge {
  background-color: #ff5252 !important;
  font-size: 0.7rem;
  padding: 3px 8px;
  border-radius: 6px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 0.8; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
  100% { opacity: 0.8; transform: scale(1); }
}

// Contenedores de respuesta
.answer-container {
  padding: 16px 0;
}

// Inputs personalizados
.custom-input {
  transition: all 0.3s ease;

  .q-field__control {
    background-color: rgba(255, 255, 255, 0.9);
    border: 1px solid rgba(0, 153, 153, 0.2);
    border-radius: 10px;
  }

  &.q-field--focused {
    .q-field__control {
      border-color: var(--purple);
      box-shadow: 0 0 0 3px rgba(102, 51, 153, 0.15);
      transform: translateY(-2px);
    }
  }
}

.date-input {
  .q-field__control {
    border-color: rgba(102, 51, 153, 0.3);
  }
}

.date-popup {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

// Contenedor de opciones
.option-container {
  padding: 10px;
  background-color: rgba(255, 255, 255, 0.6);
  border-radius: 10px;

  .custom-radio, .custom-checkbox {
    .q-radio__inner, .q-checkbox__inner {
      transition: all 0.2s ease;

      &:hover {
        transform: scale(1.05);
      }
    }

    .q-radio__label, .q-checkbox__label {
      font-size: 16px;
      padding: 8px 0;
    }
  }
}

// Sliders personalizados
.scale-container {
  padding: 20px;
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: 12px;
  margin-top: 16px;
  border: 1px solid rgba(0, 153, 153, 0.1);

  .scale-labels {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    font-weight: 500;

    .scale-min {
      color: var(--purple);
    }

    .scale-max {
      color: var(--teal);
    }
  }

  .scale-value-display {
    text-align: center;
    margin-bottom: 16px;
    min-height: 30px;
  }

  .custom-slider {
    height: 40px;

    .q-slider__track-container {
      height: 8px;
      background: rgba(102, 51, 153, 0.1);
      border-radius: 4px;
    }

    .q-slider__selection {
      background: linear-gradient(90deg, var(--purple), var(--teal));
      border-radius: 4px;
    }

    .q-slider__thumb {
      background: var(--teal);
      width: 22px;
      height: 22px;
      box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
      transition: transform 0.2s ease, box-shadow 0.2s ease;

      &:hover {
        transform: scale(1.2);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
      }
    }

    .q-slider__pin-value-marker {
      background: var(--purple);
      color: white;
      font-weight: bold;
    }
  }
}

// Sección de ubicación
.location-section {
  background: linear-gradient(to right, rgba(102, 51, 153, 0.03), rgba(0, 153, 153, 0.05));
  padding: 30px !important;
  border-radius: 0;

  .location-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .location-title {
    color: var(--purple);
    display: flex;
    align-items: center;

    .q-icon {
      color: var(--teal);
    }
  }

  .location-description {
    color: #555;
    margin-left: 32px;
    font-size: 16px;
  }

  .map-container {
    border: 1px solid rgba(0, 153, 153, 0.2);
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
    transition: all 0.4s ease;

    &:hover {
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.12);
    }

    &.map-with-location {
      border: 2px solid var(--teal);
      box-shadow: 0 6px 16px rgba(0, 153, 153, 0.15);
    }
  }

  .coordinates-display {
    background-color: rgba(255, 255, 255, 0.8);
    border-radius: 10px;
    padding: 16px;
    border-left: 3px solid var(--teal);

    .coordinate-input {
      .q-field__control {
        background-color: white;
      }
    }
  }
}

// Estilo personalizado para el marcador SVG
.custom-marker-icon {
  background: none !important;
  transition: all 0.3s ease;

  svg {
    filter: drop-shadow(0 5px 8px rgba(0, 0, 0, 0.4));
    transform-origin: bottom center;
    animation: markerBounce 2s infinite ease-in-out;
  }
}

@keyframes markerBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

// Botón de calibrar
.calibrate-btn {
  background: linear-gradient(135deg, var(--teal), var(--light-teal)) !important;
  border-radius: 28px;
  font-weight: 500;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
  box-shadow: 0 5px 15px rgba(0, 153, 153, 0.3);
  width: 300px;
  height: 56px;

  .q-btn__content {
    font-size: 16px;
  }

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(0, 153, 153, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
}

// Botones de acción
.action-buttons {
  background: linear-gradient(to right, rgba(102, 51, 153, 0.03), rgba(0, 153, 153, 0.05));
  padding: 24px !important;
  border-bottom-left-radius: 16px;
  border-bottom-right-radius: 16px;
  display: flex;
  justify-content: space-between;
}

.clear-btn {
  border: 2px solid var(--purple);
  border-radius: 10px;
  transition: all 0.3s ease;
  padding: 0 24px;
  height: 48px;

  &:hover {
    background-color: rgba(102, 51, 153, 0.1);
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(102, 51, 153, 0.2);
  }
}

.submit-btn {
  background: linear-gradient(135deg, var(--teal), var(--light-teal)) !important;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 153, 153, 0.3);
  transition: all 0.3s ease;
  padding: 0 32px;
  height: 48px;

  &:hover:not(:disabled) {
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(0, 153, 153, 0.4);
  }

  &:active:not(:disabled) {
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    background: rgba(0, 0, 0, 0.2) !important;

    &::after {
      content: '(Calibre ubicación)';
      font-size: 12px;
      margin-left: 8px;
      opacity: 0.8;
    }
  }
}

// Estado de éxito
.success-container {
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 50px 40px;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.12);
  max-width: 600px;
  animation: fadeIn 0.5s ease-out;
  border-top: 5px solid var(--teal);

  .success-icon {
    position: relative;
    display: inline-block;

    .success-confetti {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image:
        radial-gradient(circle, var(--purple) 2px, transparent 2px),
        radial-gradient(circle, var(--teal) 3px, transparent 3px),
        radial-gradient(circle, var(--light-teal) 1px, transparent 1px);
      background-size: 30px 30px, 40px 40px, 25px 25px;
      animation: rotate 10s linear infinite;
      opacity: 0.6;
    }
  }
}

@keyframes rotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

.action-btn {
  border-radius: 10px;
  transition: all 0.3s ease;
  padding: 0 24px;
  height: 45px;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  }
}

// Diálogos personalizados
.custom-dialog, .confirm-dialog {
  .q-dialog__inner > div {
    border-radius: 20px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 5px;
      background: linear-gradient(90deg, var(--purple), var(--teal));
    }
  }
}

// Notificaciones personalizadas
.notification-custom {
  border-radius: 10px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  margin: 8px;
  border-left: 4px solid transparent;

  &.bg-positive {
    border-left-color: var(--teal);
  }

  &.bg-negative {
    border-left-color: #c10015;
  }

  &.bg-info {
    border-left-color: var(--purple);
  }

  &.success-notification::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 40px;
    background-image:
      radial-gradient(circle, rgba(255,255,255,0.2) 2px, transparent 2px);
    background-size: 15px 15px;
  }

  &.error-notification {
    animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
  }

  &.validation-error {
    opacity: 0.9;
  }
}

@keyframes shake {
  10%, 90% { transform: translateX(-1px); }
  20%, 80% { transform: translateX(2px); }
  30%, 50%, 70% { transform: translateX(-3px); }
  40%, 60% { transform: translateX(3px); }
}

// Ajustes para dispositivos móviles
@media (max-width: 600px) {
  .encuesta-card {
    margin: 0 -12px;
    border-radius: 0 !important;
  }

  .header-section {
    padding: 20px !important;
  }

  .seccion-container {
    padding: 20px !important;
  }

  .pregunta-container {
    padding: 16px;
    margin-bottom: 20px !important;
  }

  .action-buttons {
    flex-direction: column-reverse;
    gap: 12px;

    .clear-btn, .submit-btn {
      width: 100%;
      margin: 0;
    }
  }

  .calibrate-btn {
    width: 100%;
  }

  .map-container {
    height: 250px !important;
  }

  .success-container {
    padding: 30px 20px;
  }
}
</style>
