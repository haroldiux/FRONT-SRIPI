<template>
  <q-page padding>
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
            <q-card-section class="bg-primary text-white">
              <div class="text-h5">{{ encuesta.titulo }}</div>
              <div class="text-subtitle2" v-if="encuesta.descripcion">{{ encuesta.descripcion }}</div>
              <div class="text-caption q-mt-sm" v-if="encuesta.fechaFinal">
                Disponible hasta: {{ formatDate(encuesta.fechaFinal) }}
              </div>
            </q-card-section>

            <q-separator />

            <!-- Información de progreso -->
            <q-card-section class="bg-blue-1">
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
                <q-card-section :class="seccionIndex % 2 === 0 ? '' : 'bg-grey-1'" class="seccion-container">
                  <div class="text-h6 q-mb-md">{{ seccionIndex + 1 }}. {{ seccion.titulo }}</div>
                  <p v-if="seccion.descripcion" class="q-mb-lg text-grey-8">{{ seccion.descripcion }}</p>

                  <!-- Preguntas de la sección -->
                  <div v-for="(pregunta, preguntaIndex) in seccion.preguntas" :key="pregunta.id"
                    class="pregunta-container q-mb-lg">
                    <div class="row items-center q-mb-sm">
                      <div class="text-subtitle1">
                        {{ seccionIndex + 1 }}.{{ preguntaIndex + 1 }}. {{ pregunta.enunciado }}
                      </div>
                      <q-badge v-if="pregunta.obligatoria" color="negative" class="q-ml-sm">
                        Obligatoria
                      </q-badge>
                    </div>

                    <!-- Campo para respuesta según tipo -->
                    <div class="q-pl-md q-mt-sm">
                      <!-- Texto corto -->
                      <q-input v-if="pregunta.tipo === 'text'" outlined dense placeholder="Escriba su respuesta aquí"
                        v-model="respuestas[pregunta.id]"
                        :rules="pregunta.obligatoria ? [val => !!val || 'Este campo es obligatorio'] : []" />

                      <!-- Texto largo -->
                      <q-input v-else-if="pregunta.tipo === 'textarea'" type="textarea" outlined autogrow
                        placeholder="Escriba su respuesta aquí" v-model="respuestas[pregunta.id]"
                        :rules="pregunta.obligatoria ? [val => !!val || 'Este campo es obligatorio'] : []" />

                      <!-- Número -->
                      <q-input v-else-if="pregunta.tipo === 'number'" type="number" outlined dense placeholder="0"
                        v-model.number="respuestas[pregunta.id]"
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
                      <div v-else-if="pregunta.tipo === 'scale'" class="q-mt-md">
                        <div class="row justify-between q-mb-xs">
                          <div class="text-caption">{{ pregunta.min }}</div>
                          <div class="text-caption">{{ pregunta.max }}</div>
                        </div>
                        <q-slider v-model="respuestas[pregunta.id]" :min="pregunta.min" :max="pregunta.max" :step="1"
                          label markers color="primary" />
                      </div>

                      <!-- Fecha -->
                      <div v-else-if="pregunta.tipo === 'date'" class="q-mt-sm">
                        <q-input outlined dense placeholder="dd/mm/aaaa" mask="##/##/####"
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
              <q-card-section class="bg-blue-1 location-section">
                <div class="text-h6 q-mb-sm">
                  <q-icon name="location_on" class="q-mr-xs" />
                  Ubicación
                </div>
                <p class="text-grey-8 q-mb-md">Para completar la encuesta, es necesario registrar la ubicación actual.</p>

                <!-- Mapa con ubicación actual -->
                <div class="map-container q-mb-md">
                  <div id="map" style="width: 100%; height: 300px; border-radius: 8px;" ref="mapContainer"></div>
                </div>

                <!-- Botón de calibrar ubicación -->
                <div class="row justify-center q-mt-md">
                  <q-btn
                    color="primary"
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
              <q-card-actions align="right" class="bg-grey-1 q-pa-md">
                <q-btn
                  label="LIMPIAR RESPUESTAS"
                  outline
                  color="grey-7"
                  @click="confirmarLimpiar"
                  class="q-mr-sm"
                />
                <q-btn
                  label="GUARDAR Y ENVIAR"
                  type="submit"
                  color="primary"
                  :loading="guardando"
                  :disable="!coordenadas.lat || !coordenadas.lng"
                />
              </q-card-actions>
            </q-form>
          </q-card>
        </div>
      </div>
    </div>

    <!-- Estado completado -->
    <div v-else-if="completado" class="flex flex-center q-pa-xl">
      <div class="column items-center">
        <q-icon name="check_circle" size="80px" color="positive" />
        <div class="text-h6 q-mt-md">¡Gracias por completar la encuesta!</div>
        <p class="text-center q-mt-md">
          Tus respuestas han sido guardadas exitosamente.
        </p>
        <div class="q-gutter-md q-mt-lg">
          <q-btn color="primary" label="Realizar otra encuesta" to="/encuestadores" />
          <q-btn outline color="primary" label="Ver mis envíos" to="/encuestadores/envios" />
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
// Modificar la función cargarEncuesta para no llamar a obtenerUbicacionActual automáticamente
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
    map = L.map(mapContainer.value).setView([-17.3895, -66.1568], 15)

    // Añadir capa de mapa base (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map)

    // Deshabilitar interacciones para que el usuario no pueda manipular manualmente
    map.dragging.disable()
    map.touchZoom.disable()
    map.doubleClickZoom.disable()
    map.scrollWheelZoom.disable()
    map.boxZoom.disable()
    map.keyboard.disable()
    if (map.tap) map.tap.disable()
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

        // Notificar al usuario
        $q.notify({
          type: 'positive',
          message: 'Ubicación actualizada correctamente',
          position: 'top'
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
          position: 'top'
        })
      },
      options
    )
  } else {
    cargandoUbicacion.value = false
    $q.notify({
      type: 'negative',
      message: 'Su navegador no soporta geolocalización',
      position: 'top'
    })
  }
}

// Actualizar mapa con la ubicación
function actualizarMapa(lat, lng) {
  if (!map) return

  import('leaflet').then(L => {
    // Actualizar vista del mapa
    map.setView([lat, lng], 16)

    // Actualizar o crear marcador
    if (marker) {
      marker.setLatLng([lat, lng])
    } else {
      marker = L.marker([lat, lng]).addTo(map)
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
      flat: true
    },
    ok: {
      label: 'Sí, limpiar todo',
      color: 'negative'
    },
    persistent: true
  }).onOk(() => {
    inicializarRespuestas()
    $q.notify({
      type: 'info',
      message: 'Todas las respuestas han sido borradas',
      position: 'top'
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
      position: 'top'
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
      flat: true
    },
    persistent: true
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
        position: 'top'
      })

      // Incrementar contador de envíos
      totalEnvios.value++

      // Redireccionar a la página de encuestas asignadas
      router.push('/encuestadores')
    } catch (err) {
      guardando.value = false
      console.error('Error al guardar respuestas:', err)

      // Mostrar mensaje de error específico si viene del servidor
      const mensaje = err.response?.data?.message || 'Error al enviar la encuesta'

      $q.notify({
        type: 'negative',
        message: mensaje,
        position: 'top'
      })

      // Si hay errores de validación específicos, mostrarlos
      if (err.response?.data?.errors) {
        const errors = err.response.data.errors
        Object.keys(errors).forEach(key => {
          $q.notify({
            type: 'negative',
            message: errors[key][0],
            position: 'top',
            timeout: 3000
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
  if (progreso.value >= 0.7) return 'accent'
  if (progreso.value >= 0.3) return 'primary'
  return 'negative'
}

// Ciclo de vida del componente
onMounted(() => {
  cargarEncuesta()
})
</script>

<style lang="scss" scoped>
.encuesta-card {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.seccion-container {
  padding: 24px;
}

.pregunta-container {
  padding-bottom: 16px;
  border-bottom: 1px dashed #eee;
}

.pregunta-container:last-child {
  border-bottom: none;
}

.location-section {
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.map-container {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.calibrate-btn {
  width: 250px;
  height: 48px;
  border-radius: 24px;
  font-weight: 500;
  letter-spacing: 0.5px;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  &:active {
    transform: translateY(0);
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
}
</style>
