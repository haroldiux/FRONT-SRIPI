<template>
  <q-page class="proyecto-detail-page">
    <EncuestaPreview v-model="showEncuestaPreview" :encuesta-id="selectedEncuestaId" @edit="editarEncuesta"
      @close="showEncuestaPreview = false" />
    <!-- Header con fondo de degradado en la nueva paleta -->
    <div class="header-container" data-aos="fade-down" data-aos-duration="600">
      <div class="header-content">
        <div class="breadcrumb">
          <q-btn flat dense to="/proyectos" class="breadcrumb-btn">
            <q-icon name="arrow_back" size="18px" />
            <span class="q-ml-xs">Volver a Proyectos</span>
          </q-btn>
        </div>
        <div class="header-title-row">
          <div class="header-title">
            <h1>{{ proyecto.titulo }}</h1>
            <q-badge :color="getEstadoBadgeColor(proyecto.estado, proyecto)" class="estado-badge">
              {{ getEstadoLabel(proyecto.estado, proyecto) }}
            </q-badge>
          </div>
          <div class="header-actions">
            <q-btn unelevated color="accent" text-color="white" class="action-btn" icon-right="add"
              label="Nueva Encuesta" @click="nuevaEncuesta" />
            <q-btn unelevated color="accent" text-color="white" class="action-btn" icon-right="file_download"
              label="Exportar" @click="exportarDatos" />
          </div>
        </div>
      </div>
    </div>

    <!-- Estado de carga -->
    <div v-if="loading" class="full-page-loader" data-aos="fade-up">
      <q-spinner-dots color="primary" size="40px" />
      <div class="q-mt-sm text-subtitle1">Cargando información del proyecto...</div>
    </div>

    <!-- Error al cargar -->
    <div v-else-if="error" class="full-page-error" data-aos="fade-up">
      <q-icon name="error_outline" size="50px" color="negative" />
      <h5 class="q-mt-md q-mb-sm">Error al cargar el proyecto</h5>
      <p class="text-grey-8">{{ error }}</p>
      <q-btn color="primary" label="Reintentar" icon="refresh" class="q-mt-md retry-btn" @click="loadData" />
    </div>

    <!-- Contenido principal -->
    <div v-else class="page-content">
      <div class="content-grid">
        <!-- Panel de información principal -->
        <div class="info-panel" data-aos="fade-right" data-aos-delay="100">
          <!-- Tarjeta de información del proyecto -->
          <q-card flat bordered class="proyecto-info-card">
            <q-card-section class="proyecto-info-header">
              <div class="info-title">
                <q-icon name="info" />
                <span>Información del Proyecto</span>
              </div>
            </q-card-section>

            <q-separator />

            <q-card-section class="q-pa-md">
              <!-- Descripción -->
              <div class="info-section" v-if="proyecto.descripcion">
                <div class="info-label">Descripción</div>
                <div class="info-value description">{{ proyecto.descripcion }}</div>
              </div>

              <!-- Responsable -->
              <div class="info-section">
                <div class="info-label">
                  <q-icon name="person" size="18px" class="q-mr-xs" />
                  Responsable
                </div>
                <div class="info-value">{{ obtenerNombreResponsable(proyecto.responsable_id) }}</div>
              </div>

              <!-- Fechas -->
              <div class="dates-grid">
                <div class="info-section">
                  <div class="info-label">
                    <q-icon name="event" size="18px" class="q-mr-xs" />
                    Fecha de Inicio
                  </div>
                  <div class="info-value">{{ formatFecha(proyecto.fecha_inicio) }}</div>
                </div>

                <div class="info-section">
                  <div class="info-label">
                    <q-icon name="event" size="18px" class="q-mr-xs" />
                    Fecha de Fin
                  </div>
                  <div class="info-value">{{ formatFecha(proyecto.fecha_fin) || 'No definida' }}</div>
                </div>
              </div>

              <!-- Ubicación si existe -->
              <div class="info-section" v-if="proyecto.ubicacion">
                <div class="info-label">
                  <q-icon name="place" size="18px" class="q-mr-xs" />
                  Ubicación
                </div>
                <div class="info-value">{{ proyecto.ubicacion }}</div>
              </div>
            </q-card-section>
          </q-card>

          <!-- Tarjetas de indicadores clave -->
          <div class="stats-cards">
            <q-card flat bordered class="stat-card" data-aos="fade-up" data-aos-delay="150">
              <q-card-section class="stat-card-content">
                <div class="stat-card-value">{{ encuestas.length }}</div>
                <div class="stat-card-label">Encuestas</div>
                <div class="stat-card-subtext">{{ encuestasActivas }} activas</div>
                <q-icon name="assignment" class="stat-icon" />
              </q-card-section>
            </q-card>

            <q-card flat bordered class="stat-card" :class="getEstadoClass(proyecto.estado, proyecto)" data-aos="fade-up" data-aos-delay="200">
              <q-card-section class="stat-card-content">
                <div class="stat-card-value estado-value">{{ getEstadoLabel(proyecto.estado, proyecto) }}</div>
                <div class="stat-card-label">Estado</div>
                <div class="stat-card-subtext">Proyecto</div>
                <q-icon name="trending_up" class="stat-icon" />
              </q-card-section>
            </q-card>
          </div>
        </div>

        <!-- Panel de contenido principal con tabs -->
        <div class="content-panel" data-aos="fade-left" data-aos-delay="150">
          <q-card flat bordered class="tabs-card">
            <q-tabs v-model="tab" class="bg-white text-primary tabs-header" active-color="primary"
              indicator-color="accent" align="left" narrow-indicator dense>
              <q-tab name="encuestas" icon="description" label="Encuestas" />
              <q-tab name="analisis" icon="analytics" label="Análisis" />
              <q-tab name="geografico" icon="map" label="Geográfico" />
            </q-tabs>

            <q-separator />

            <q-tab-panels v-model="tab" animated class="bg-white">
              <!-- Panel de Encuestas -->
              <q-tab-panel name="encuestas" class="tab-panel">
                <div class="panel-header">
                  <div>
                    <h2 class="panel-title">Encuestas del Proyecto</h2>
                    <p class="panel-subtitle">Todas las encuestas asociadas a este proyecto de investigación</p>
                  </div>

                  <q-btn unelevated color="primary" icon="add" label="Nueva Encuesta" class="desktop-only new-survey-btn"
                    @click="nuevaEncuesta" />
                </div>

                <!-- Estado de carga de encuestas -->
                <div v-if="loadingEncuestas" class="section-loader" data-aos="fade">
                  <q-spinner color="primary" size="24px" />
                  <span class="q-ml-sm">Cargando encuestas...</span>
                </div>

                <!-- Sin encuestas -->
                <div v-else-if="!encuestas.length" class="empty-state" data-aos="zoom-in" data-aos-delay="100">
                  <div class="empty-state-icon">
                    <q-icon name="assignment" size="48px" />
                  </div>
                  <h3 class="empty-state-title">No hay encuestas</h3>
                  <p class="empty-state-description">Comienza creando tu primera encuesta para este proyecto</p>
                  <q-btn unelevated color="primary" icon="add" label="Nueva Encuesta" class="empty-state-btn" @click="nuevaEncuesta" />
                </div>

                <!-- Lista de encuestas -->
                <div v-else class="encuestas-list">
                  <q-card v-for="(enc, index) in encuestas"
                          :key="enc.id"
                          bordered
                          flat
                          class="encuesta-item"
                          data-aos="fade-up"
                          :data-aos-delay="100 + (index * 50)">
                    <q-item class="encuesta-header">
                      <q-item-section avatar>
                        <q-avatar :color="enc.activa ? 'green-1' : 'grey-3'" text-color="green" class="encuesta-icon">
                          <q-icon name="description" />
                        </q-avatar>
                      </q-item-section>

                      <q-item-section>
                        <q-item-label class="encuesta-title">{{ enc.titulo }}</q-item-label>
                        <q-item-label caption>
                          <q-badge :color="enc.activa ? 'accent' : 'grey'" outline>
                            {{ enc.activa ? 'Activa' : 'Inactiva' }}
                          </q-badge>
                        </q-item-label>
                      </q-item-section>

                      <q-item-section side>
                        <div class="encuesta-actions">
                          <q-btn flat round dense color="grey-7" icon="edit" class="action-icon">
                            <q-tooltip>Editar</q-tooltip>
                          </q-btn>
                          <q-btn flat round dense color="accent" icon="assignment_ind" @click="asignarEncuesta(enc)" class="action-icon">
                            <q-tooltip>Asignar</q-tooltip>
                          </q-btn>
                          <q-btn flat round dense color="primary" icon="visibility" @click.stop="verEncuesta(enc)" class="action-icon">
                            <q-tooltip>Vista Previa</q-tooltip>
                          </q-btn>
                        </div>
                      </q-item-section>
                    </q-item>

                    <q-separator />

                    <q-card-section>
                      <div class="encuesta-description">{{ enc.descripcion || 'Sin descripción' }}</div>

                      <div class="encuesta-metadata">
                        <div class="meta-item" v-if="enc.fechaInicio">
                          <q-icon name="event" size="16px" class="q-mr-xs" />
                          <span>Creada: {{ formatFecha(enc.fechaInicio) }}</span>
                        </div>
                        <div class="meta-item" v-if="enc.fechaFinal">
                          <q-icon name="event_available" size="16px" class="q-mr-xs" />
                          <span>Finaliza: {{ formatFecha(enc.fechaFinal) }}</span>
                        </div>
                      </div>
                    </q-card-section>

                    <q-card-actions align="right">
                      <q-btn flat color="primary" label="Ver estadísticas" icon-right="visibility" class="stats-btn" />
                    </q-card-actions>
                  </q-card>
                </div>

                <div class="mobile-actions">
                  <q-btn unelevated color="primary" icon="add" class="mobile-only fab-button" round size="md"
                    @click="nuevaEncuesta">
                    <q-tooltip>Nueva Encuesta</q-tooltip>
                  </q-btn>
                </div>
              </q-tab-panel>

              <!-- Panel de Análisis -->
              <q-tab-panel name="analisis" class="tab-panel">
                <div class="coming-soon" data-aos="fade-up">
                  <img src="https://cdn.quasar.dev/img/parallax2.jpg" class="placeholder-image" alt="Análisis">
                  <div class="coming-soon-overlay">
                    <q-icon name="analytics" size="56px" color="white" />
                    <h3>Módulo de Análisis</h3>
                    <p>Aquí podrás visualizar estadísticas detalladas y gráficos de las encuestas</p>
                    <q-badge color="primary" class="q-mt-md coming-soon-badge">Próximamente</q-badge>
                  </div>
                </div>
              </q-tab-panel>

              <!-- Panel Geográfico -->
              <q-tab-panel name="geografico" class="tab-panel">
                <div class="coming-soon" data-aos="fade-up">
                  <img src="https://cdn.quasar.dev/img/mountains.jpg" class="placeholder-image" alt="Mapa">
                  <div class="coming-soon-overlay">
                    <q-icon name="map" size="56px" color="white" />
                    <h3>Visualización Geográfica</h3>
                    <p>Aquí podrás ver la distribución geográfica de las respuestas</p>
                    <q-badge color="primary" class="q-mt-md coming-soon-badge">Próximamente</q-badge>
                  </div>
                </div>
              </q-tab-panel>
            </q-tab-panels>
          </q-card>
        </div>
      </div>
    </div>

    <!-- Dialog crear encuesta -->
    <EncuestaFormDialog v-model="openEncuesta" :proyecto-id="proyecto.id" @save="onEncuestaSave" />

    <!-- Dialog vista previa encuesta -->
    <EncuestaPreview v-model="showEncuestaPreview" :encuesta-id="selectedEncuestaId" />

    <!-- Dialog asignación de encuestadores -->
    <EncuestaAsignacionDialog v-model="showAsignacionDialog" :encuesta-id="selectedEncuestaId" @refresh="loadEncuestas" @close="showAsignacionDialog = false" />
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { api } from 'src/boot/axios'
import AOS from 'aos'
import { useAuthStore } from 'src/stores/auth.store'
import EncuestaFormDialog from 'components/encuestadores/EncuestaFormDialog.vue'
import EncuestaPreview from 'components/encuestadores/EncuestaPreview.vue'
import EncuestaAsignacionDialog from 'components/encuestadores/EncuestaAsignacionDialog.vue'

const showEncuestaPreview = ref(false)
const selectedEncuestaId = ref(null)
const selectedEncuesta = ref(null)
const showAsignacionDialog = ref(false)

function verEncuesta(encuesta) {
  selectedEncuesta.value = encuesta ?? null;
  selectedEncuestaId.value = encuesta?.id ?? null;
  showEncuestaPreview.value = !!selectedEncuestaId.value;
}

function editarEncuesta(encuestaId) {
  console.log('Editando encuesta con ID:', encuestaId)
  // Aquí implementa la lógica para editar la encuesta
}

function asignarEncuesta(encuesta) {
  selectedEncuesta.value = encuesta ?? null;
  selectedEncuestaId.value = encuesta?.id ?? null;
  showAsignacionDialog.value = true;
}

// Obtener parámetros y servicios
const route = useRoute()
const $q = useQuasar()
const auth = useAuthStore()

// Estados
const loading = ref(true)
const error = ref(null)
const proyecto = ref({})
const usuarios = ref([])
const tab = ref('encuestas')
const encuestas = ref([])
const loadingEncuestas = ref(false)
const openEncuesta = ref(false)

// Encuestas activas computadas
const encuestasActivas = computed(() => {
  return encuestas.value.filter(e => e.activa).length
})

// Usuario actual (usar auth para no dejarlo como variable sin usar)
const currentUser = computed(() => {
  return auth.user || {}
})

// Cargar datos iniciales
onMounted(async () => {
  // Inicializar AOS si está disponible
  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 800,
      easing: 'ease-out-cubic',
      once: true
    })
  }

  await loadData()
})

// Carga todos los datos necesarios
async function loadData() {
  loading.value = true
  error.value = null

  try {
    // Cargar datos del proyecto
    await loadProyecto()

    // Cargar datos relacionados en paralelo
    await Promise.all([
      loadUsuarios(),
      loadEncuestas()
    ])
  } catch (err) {
    console.error('Error al cargar datos del proyecto:', err)
    error.value = err.message || 'Error al cargar el proyecto'
  } finally {
    loading.value = false
  }
}

// Cargar datos del proyecto
async function loadProyecto() {
  const id = route.params.id

  try {
    const response = await api.get(`/proyectos/${id}`)
    proyecto.value = response.data
    return response.data
  } catch (err) {
    console.error('Error al cargar proyecto:', err)
    throw new Error('No se pudo cargar la información del proyecto')
  }
}

// Cargar usuarios
async function loadUsuarios() {
  try {
    const response = await api.get('/usuarios')
    if (response.data.data) {
      usuarios.value = response.data.data
    } else {
      usuarios.value = response.data
    }
    return usuarios.value
  } catch (err) {
    console.error('Error al cargar usuarios:', err)
    // No mostrar error al usuario para no interrumpir la carga principal
  }
}

// Cargar encuestas del proyecto
async function loadEncuestas() {
  if (!proyecto.value.id) return []

  loadingEncuestas.value = true

  try {
    const response = await api.get('/encuestas', {
      params: {
        proyecto_id: proyecto.value.id
      }
    })

    // Determinar la estructura de los datos
    if (response.data.data) {
      encuestas.value = response.data.data
    } else {
      encuestas.value = response.data
    }

    return encuestas.value
  } catch (err) {
    console.error('Error al cargar encuestas:', err)
    // No mostrar error al usuario para no interrumpir la carga principal
    return []
  } finally {
    loadingEncuestas.value = false
  }
}

// Funciones de formato y verificación de estados
function formatFecha(dateString) {
  if (!dateString) return ''

  try {
    // Extraer la fecha en formato YYYY-MM-DD directamente
    if (typeof dateString === 'string') {
      // Si la fecha viene en formato ISO con hora (YYYY-MM-DDThh:mm:ss)
      if (dateString.includes('T')) {
        const partes = dateString.split('T')[0].split('-')
        return `${partes[2]}/${partes[1]}/${partes[0]}`
      }
      // Si la fecha viene en formato simple YYYY-MM-DD
      else if (dateString.includes('-')) {
        const partes = dateString.split('-')
        return `${partes[2]}/${partes[1]}/${partes[0]}`
      }
      // Si ya viene formateada, devolverla tal cual
      return dateString
    }

    return dateString
  } catch (error) {
    console.error('Error al formatear fecha:', error)
    return dateString
  }
}

// Función para obtener el nombre del responsable según ID
function obtenerNombreResponsable(responsableId) {
  if (!responsableId) return 'No asignado'

  // Si el usuario actual es el responsable, destacarlo (usando currentUser)
  if (currentUser.value && currentUser.value.id === responsableId) {
    return `${currentUser.value.nombres || ''} ${currentUser.value.apellidos || ''} (Tú)`.trim()
  }

  // Buscar el usuario por ID en la lista de usuarios cargados
  const usuario = usuarios.value.find(u => u.id === responsableId)

  if (usuario) {
    return `${usuario.nombres || ''} ${usuario.apellidos || ''}`.trim()
  }

  // Valores por defecto temporales (mientras se cargan los datos)
  const responsablesDefault = {
    1: 'JUAN JOSE MAMANI VIA',
    2: 'Maria Rodriguez',
    3: 'Carlos Perez'
  }

  return responsablesDefault[responsableId] || 'No asignado'
}

// Función para verificar si un proyecto está finalizado basado en su fecha de fin
function isProyectoFinalizado(proyecto) {
  if (!proyecto || !proyecto.fecha_fin) return false

  const hoy = new Date()
  // Asegurar que comparamos solo fechas sin hora
  hoy.setHours(0, 0, 0, 0)

  // Convertir la fecha_fin a objeto Date para comparación
  let fechaFin
  if (typeof proyecto.fecha_fin === 'string') {
    // Si viene en formato ISO con hora
    if (proyecto.fecha_fin.includes('T')) {
      fechaFin = new Date(proyecto.fecha_fin)
    } else {
      // Si viene en formato YYYY-MM-DD
      const partes = proyecto.fecha_fin.split('-')
      fechaFin = new Date(partes[0], partes[1] - 1, partes[2])
    }
  } else {
    fechaFin = new Date(proyecto.fecha_fin)
  }

  // Normalizar la fecha fin para comparar solo la fecha sin hora
  fechaFin.setHours(0, 0, 0, 0)

  return fechaFin < hoy
}

// Obtener clase para el estado
function getEstadoClass(estado, proyecto) {
  // Si la fecha fin ya pasó, mostrar como "Finalizado" sin importar el estado actual
  if (proyecto && isProyectoFinalizado(proyecto)) {
    return 'estado-finalizado'
  }

  const classes = {
    'inicio': 'estado-inicio',
    'en curso': 'estado-encurso',
    'concluido': 'estado-concluido',
    'pausado': 'estado-pausado',
    'finalizado': 'estado-finalizado'
  }
  return classes[estado] || 'estado-default'
}

// Obtener color para el badge de estado
function getEstadoBadgeColor(estado, proyecto) {
  // Si la fecha fin ya pasó, mostrar como "Finalizado" sin importar el estado actual
  if (proyecto && isProyectoFinalizado(proyecto)) {
    return 'secondary'
  }

  const colors = {
    'inicio': 'primary',
    'en curso': 'accent',
    'concluido': 'secondary',
    'pausado': 'orange',
    'finalizado': 'secondary'
  }
  return colors[estado] || 'grey'
}

// Obtener etiqueta según el estado
function getEstadoLabel(estado, proyecto) {
  // Si la fecha fin ya pasó, mostrar como "Finalizado" sin importar el estado actual
  if (proyecto && isProyectoFinalizado(proyecto)) {
    return 'Finalizado'
  }

  const labels = {
    'inicio': 'Inicio',
    'en curso': 'En Curso',
    'concluido': 'Concluido',
    'pausado': 'Pausado',
    'finalizado': 'Finalizado'
  }
  return labels[estado] || estado
}

// Abrir formulario de nueva encuesta
function nuevaEncuesta() {
  openEncuesta.value = true
}

// Manejar la creación de una nueva encuesta
function onEncuestaSave(data) {
  console.log('Encuesta creada con ID:', data.id) // Usar el parámetro para evitar warning

  // Recargar todas las encuestas
  loadEncuestas().then(() => {
    // Notificar éxito
    $q.notify({
      type: 'positive',
      message: 'Encuesta creada exitosamente',
      position: 'top'
    })
  })

  // UX: volver a la pestaña de Encuestas
  tab.value = 'encuestas'
}

// Exportar datos del proyecto
function exportarDatos() {
  // Placeholder para funcionalidad de exportación
  $q.notify({
    type: 'info',
    message: 'Funcionalidad de exportación en desarrollo',
    position: 'top'
  })
}
</script>

<style lang="scss">
/* Variables de colores personalizados */
$purple: #663399;
$teal: #009999;
$light-teal: #00AAAA;
$white: #FFFFFF;

/* Configuración de colores para Quasar */
:root {
  --q-primary: #{$purple};
  --q-secondary: #{$purple};
  --q-accent: #{$teal};
}

/* Estilos profesionales con alta atención al detalle */
.proyecto-detail-page {
  background-color: #f8f9fa;
  min-height: 100vh;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, rgba($purple, 0.02) 0%, rgba($teal, 0.02) 100%);
    pointer-events: none;
    z-index: 0;
  }
}

/* Header con degradado en la nueva paleta de colores */
.header-container {
  background: linear-gradient(135deg, $purple 0%, $teal 100%);
  padding: 28px 0;
  color: $white;
  box-shadow: 0 4px 20px rgba($purple, 0.25);
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    bottom: -30px;
    right: -30px;
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%);
    border-radius: 50%;
  }

  &::before {
    content: '';
    position: absolute;
    top: -20px;
    left: -20px;
    width: 200px;
    height: 200px;
    background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 70%);
    border-radius: 50%;
  }
}

.header-content {
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 24px;
  position: relative;
  z-index: 1;
}

.breadcrumb {
  margin-bottom: 16px;
}

.breadcrumb-btn {
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  padding-left: 0;
  font-weight: 500;
  letter-spacing: 0.01em;
  transition: all 0.3s ease;

  &:hover {
    color: $white;
    transform: translateX(-3px);
  }
}

.header-title-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  display: flex;
  align-items: center;
  flex-wrap: wrap;

  h1 {
    color: $white;
    font-size: 32px;
    font-weight: 700;
    margin: 0;
    margin-right: 16px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      text-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }
  }
}

.estado-badge {
  font-size: 13px;
  padding: 6px 14px;
  border-radius: 30px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  font-weight: 600;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
  background: rgba($white, 0.2);
  backdrop-filter: blur(5px);
  border: 1px solid rgba($white, 0.3);
}

.header-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 12px;

  @media (min-width: 600px) {
    margin-top: 0;
  }
}

.action-btn {
  font-weight: 600;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 8px 16px;
  letter-spacing: 0.03em;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(to right, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.3));
    transform: translateX(-100%);
    transition: transform 0.6s ease;
    pointer-events: none;
  }

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba($purple, 0.3);

    &::after {
      transform: translateX(100%);
    }
  }

  &:active {
    transform: translateY(-1px);
    box-shadow: 0 3px 10px rgba($purple, 0.25);
  }
}

.new-survey-btn {
  background: linear-gradient(135deg, $purple 0%, $teal 100%);
  box-shadow: 0 4px 15px rgba($purple, 0.25);
  font-weight: 600;
  letter-spacing: 0.5px;

  &:hover {
    box-shadow: 0 6px 18px rgba($purple, 0.4);
  }
}

.retry-btn {
  background: linear-gradient(135deg, $purple 0%, $teal 100%);
  font-weight: 600;
  padding: 10px 24px;
  border-radius: 10px;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 6px 16px rgba($purple, 0.35);
    transform: translateY(-2px);
  }
}

/* Contenido principal */
.page-content {
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 30px 24px;
  position: relative;
  z-index: 1;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 30px;

  @media (min-width: 960px) {
    grid-template-columns: 320px 1fr;
  }

  @media (min-width: 1200px) {
    grid-template-columns: 360px 1fr;
  }
}

/* Tarjeta de información del proyecto */
.info-panel {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.proyecto-info-card,
.tabs-card,
.stat-card,
.encuesta-item {
  border-radius: 16px;
  box-shadow: 0 2px 10px rgba($purple, 0.08);
  overflow: hidden;
  transition: all 0.3s ease;
  border-color: rgba($purple, 0.1);

  &:hover {
    box-shadow: 0 8px 24px rgba($purple, 0.12);
    transform: translateY(-3px);
  }
}

.proyecto-info-header {
  padding: 18px 20px;
  background: linear-gradient(to right, rgba($purple, 0.05), rgba($teal, 0.05));
  border-bottom: 1px solid rgba($purple, 0.08);
}

.info-title {
  display: flex;
  align-items: center;
  font-weight: 600;
  font-size: 16px;
  color: $purple;

  .q-icon {
    margin-right: 10px;
    color: $teal;
  }
}

.info-section {
  margin-bottom: 20px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
  }

  &:last-child {
    margin-bottom: 0;
  }
}

.info-label {
  font-size: 14px;
  color: rgba($purple, 0.7);
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  font-weight: 500;

  .q-icon {
    color: $teal;
  }
}

.info-value {
  font-size: 15px;
  color: $purple;
  font-weight: 600;

  &.description {
    font-weight: 400;
    line-height: 1.6;
    color: rgba($purple, 0.8);
  }
}

.dates-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;

  @media (min-width: 480px) and (max-width: 959px) {
    grid-template-columns: 1fr 1fr;
  }
}

/* Tarjetas de estadísticas */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
}

.stat-card {
  position: relative;
  overflow: hidden;
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba($purple, 0.1);
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: linear-gradient(to bottom, $purple, $teal);
    opacity: 0.8;
  }

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba($purple, 0.15);
  }
}

.stat-card-content {
  padding: 20px;
  text-align: center;
}

.stat-card-value {
  font-size: 36px;
  font-weight: 700;
  color: $purple;
  margin-bottom: 6px;
  text-shadow: 0 1px 1px rgba($purple, 0.1);

  &.estado-value {
    font-size: 26px;
  }
}

.stat-card-label {
  font-size: 15px;
  color: rgba($purple, 0.8);
  font-weight: 600;
  margin-bottom: 4px;
  letter-spacing: 0.02em;
}

.stat-card-subtext {
  font-size: 13px;
  color: rgba($purple, 0.6);
  font-weight: 500;
}

.stat-icon {
  position: absolute;
  bottom: 12px;
  right: 12px;
  font-size: 36px;
  opacity: 0.15;
  color: $teal;
}

/* Estados */
.estado-inicio {
  .stat-card-value {
    color: $purple;
  }

  .stat-icon {
    color: $purple;
  }
}

.estado-encurso {
  .stat-card-value {
    color: $teal;
  }

  .stat-icon {
    color: $teal;
  }
}

.estado-concluido,
.estado-finalizado {
  .stat-card-value {
    color: $purple;
  }

  .stat-icon {
    color: $purple;
  }
}

.estado-pausado {
  .stat-card-value {
    color: #f57c00;
  }

  .stat-icon {
    color: #f57c00;
  }
}

.estado-default {
  .stat-card-value {
    color: #757575;
  }

  .stat-icon {
    color: #757575;
  }
}

/* Panel de contenido */
.content-panel {
  display: flex;
  flex-direction: column;
}

.tabs-header {
  border-radius: 16px 16px 0 0;

  .q-tab {
    transition: all 0.3s ease;

    &:hover {
      background: rgba($purple, 0.05);
    }

    &--active {
      font-weight: 600;
    }
  }
}

.tab-panel {
  padding: 28px;
}

/* Estado de carga y errores de página completa */
.full-page-loader,
.full-page-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 30px;
  margin: 30px auto;
  background-color: $white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba($purple, 0.08);
  max-width: 500px;
  text-align: center;
  border: 1px solid rgba($purple, 0.1);
}

/* Estado de carga en secciones */
.section-loader {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 30px;
  color: rgba($purple, 0.7);
  background: rgba($purple, 0.03);
  border-radius: 12px;
  font-weight: 500;
}

/* Panel de encuestas */
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 30px;
}

.panel-title {
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 6px 0;
  color: $purple;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: -8px;
    left: 0;
    width: 40px;
    height: 3px;
    background: $teal;
    border-radius: 10px;
  }
}

.panel-subtitle {
  font-size: 15px;
  color: rgba($purple, 0.7);
  margin: 8px 0 0 0;
}

/* Estado vacío */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 30px;
  background: linear-gradient(to right, rgba($purple, 0.02), rgba($teal, 0.02));
  border-radius: 16px;
  text-align: center;
  margin-top: 16px;
  border: 1px dashed rgba($teal, 0.2);
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba($teal, 0.3);
    box-shadow: 0 8px 30px rgba($purple, 0.05);
  }
}

.empty-state-icon {
  margin-bottom: 24px;
  color: rgba($purple, 0.5);
  background-color: rgba($teal, 0.1);
  border-radius: 50%;
  width: 90px;
  height: 90px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.05);
    background-color: rgba($teal, 0.15);
  }
}

.empty-state-title {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 10px 0;
  color: $purple;
}

.empty-state-description {
  color: rgba($purple, 0.7);
  margin: 0 0 26px 0;
  max-width: 400px;
  font-size: 15px;
  line-height: 1.6;
}

.empty-state-btn {
  background: linear-gradient(135deg, $purple 0%, $teal 100%);
  font-weight: 600;
  padding: 10px 24px;
  border-radius: 10px;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 6px 16px rgba($purple, 0.35);
    transform: translateY(-3px) scale(1.05);
  }
}

/* Lista de encuestas */
.encuestas-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Encuesta individual */
.encuesta-item {
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  border-radius: 16px;
  border: 1px solid rgba($purple, 0.1);
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: linear-gradient(to bottom, $purple, $teal);
    opacity: 0.7;
  }
}

.encuesta-header {
  background: linear-gradient(to right, rgba($purple, 0.03), rgba($teal, 0.03));
  padding: 14px 18px;
}

.encuesta-title {
  font-size: 17px;
  font-weight: 600;
  color: $purple;
}

.encuesta-icon {
  font-size: 20px;
  transition: all 0.3s ease;

  &:hover {
    transform: rotate(5deg);
  }
}

.encuesta-actions {
  display: flex;
  gap: 8px;
}

.action-icon {
  transition: all 0.3s ease;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: rgba($purple, 0);
    transition: all 0.2s ease;
    z-index: -1;
  }

  &:hover {
    transform: translateY(-3px);

    &::before {
      background: rgba($purple, 0.1);
    }
  }
}

.encuesta-description {
  color: rgba($purple, 0.8);
  font-size: 15px;
  line-height: 1.6;
  margin-bottom: 16px;
  max-height: 60px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.encuesta-metadata {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  font-size: 13px;
  color: rgba($purple, 0.7);
}

.meta-item {
  display: flex;
  align-items: center;

  .q-icon {
    color: $teal;
  }
}

.stats-btn {
  transition: all 0.3s ease;
  font-weight: 500;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 50%;
    width: 0;
    height: 2px;
    background: $purple;
    transition: all 0.3s ease;
    transform: translateX(-50%);
  }

  &:hover {
    transform: translateY(-2px);

    &::after {
      width: 80%;
    }
  }
}

/* Componentes Coming Soon */
.coming-soon {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  height: 350px;
  box-shadow: 0 8px 30px rgba($purple, 0.15);
}

.placeholder-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: blur(1px) brightness(0.6);
  transform: scale(1.05);
  transition: all 0.5s ease;

  &:hover {
    filter: blur(0px) brightness(0.7);
    transform: scale(1);
  }
}

.coming-soon-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 24px;
  color: $white;
  background: linear-gradient(to bottom, rgba($purple, 0.1), rgba($purple, 0.4));

  h3 {
    font-size: 28px;
    font-weight: 700;
    margin: 16px 0 8px 0;
    text-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
  }

  p {
    margin: 0 0 24px 0;
    max-width: 400px;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    font-size: 16px;
    line-height: 1.6;
  }

  .coming-soon-badge {
    background: rgba($white, 0.2);
    backdrop-filter: blur(8px);
    color: $white;
    font-weight: 600;
    padding: 6px 14px;
    border-radius: 30px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
    letter-spacing: 0.5px;
    border: 1px solid rgba($white, 0.3);
  }
}

/* Botones flotantes para móvil */
.mobile-actions {
  display: none;

  @media (max-width: 599px) {
    display: block;
    position: fixed;
    bottom: 30px;
    right: 30px;
    z-index: 10;
  }
}

.mobile-only {
  display: none;

  @media (max-width: 599px) {
    display: flex;
  }
}

.desktop-only {
  display: flex;

  @media (max-width: 599px) {
    display: none;
  }
}

.fab-button {
  background: linear-gradient(135deg, $purple 0%, $teal 100%);
  box-shadow: 0 6px 20px rgba($purple, 0.35);
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);

  &:hover {
    transform: translateY(-5px) rotate(5deg);
    box-shadow: 0 10px 25px rgba($purple, 0.45);
  }
}

/* Media queries adicionales */
@media (max-width: 767px) {
  .header-container {
    padding: 20px 0;
  }

  .header-title h1 {
    font-size: 26px;
  }

  .stat-card-value {
    font-size: 30px;
  }

  .tab-panel {
    padding: 20px;
  }

  .panel-title {
    font-size: 20px;
  }

  .empty-state {
    padding: 40px 20px;
  }
}

@media (min-width: 768px) and (max-width: 1023px) {
  .encuestas-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 24px;
  }
}
</style>
