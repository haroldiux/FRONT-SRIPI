<template>
  <q-page class="proyecto-detail-page">
    <EncuestaPreview v-model="showEncuestaPreview" :encuesta-id="selectedEncuestaId" @edit="editarEncuesta"
      @close="showEncuestaPreview = false" />
    <!-- Header con fondo azul y degradado sutil -->
    <div class="header-container">
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
            <q-btn unelevated color="white" text-color="primary" class="action-btn" icon-right="add"
              label="Nueva Encuesta" @click="nuevaEncuesta" />
            <q-btn unelevated color="white" text-color="primary" class="action-btn" icon-right="file_download"
              label="Exportar" @click="exportarDatos" />
          </div>
        </div>
      </div>
    </div>

    <!-- Estado de carga -->
    <div v-if="loading" class="full-page-loader">
      <q-spinner-dots color="primary" size="40px" />
      <div class="q-mt-sm text-subtitle1">Cargando información del proyecto...</div>
    </div>

    <!-- Error al cargar -->
    <div v-else-if="error" class="full-page-error">
      <q-icon name="error_outline" size="50px" color="negative" />
      <h5 class="q-mt-md q-mb-sm">Error al cargar el proyecto</h5>
      <p class="text-grey-8">{{ error }}</p>
      <q-btn color="primary" label="Reintentar" icon="refresh" class="q-mt-md" @click="loadData" />
    </div>

    <!-- Contenido principal -->
    <div v-else class="page-content">
      <div class="content-grid">
        <!-- Panel de información principal -->
        <div class="info-panel">
          <!-- Tarjeta de información del proyecto -->
          <q-card flat bordered class="proyecto-info-card">
            <q-card-section class="proyecto-info-header">
              <div class="info-title">
                <q-icon name="info" color="primary" />
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
            <q-card flat bordered class="stat-card">
              <q-card-section class="stat-card-content">
                <div class="stat-card-value">{{ encuestas.length }}</div>
                <div class="stat-card-label">Encuestas</div>
                <div class="stat-card-subtext">{{ encuestasActivas }} activas</div>
                <q-icon name="assignment" class="stat-icon" />
              </q-card-section>
            </q-card>

            <q-card flat bordered class="stat-card" :class="getEstadoClass(proyecto.estado, proyecto)">
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
        <div class="content-panel">
          <q-card flat bordered class="tabs-card">
            <q-tabs v-model="tab" class="bg-white text-primary tabs-header" active-color="primary"
              indicator-color="primary" align="left" narrow-indicator dense>
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

                  <q-btn unelevated color="primary" icon="add" label="Nueva Encuesta" class="desktop-only"
                    @click="nuevaEncuesta" />
                </div>

                <!-- Estado de carga de encuestas -->
                <div v-if="loadingEncuestas" class="section-loader">
                  <q-spinner color="primary" size="24px" />
                  <span class="q-ml-sm">Cargando encuestas...</span>
                </div>

                <!-- Sin encuestas -->
                <div v-else-if="!encuestas.length" class="empty-state">
                  <div class="empty-state-icon">
                    <q-icon name="assignment" size="48px" />
                  </div>
                  <h3 class="empty-state-title">No hay encuestas</h3>
                  <p class="empty-state-description">Comienza creando tu primera encuesta para este proyecto</p>
                  <q-btn unelevated color="primary" icon="add" label="Nueva Encuesta" @click="nuevaEncuesta" />
                </div>

                <!-- Lista de encuestas -->
                <div v-else class="encuestas-list">
                  <q-card v-for="enc in encuestas" :key="enc.id" bordered flat class="encuesta-item">
                    <q-item class="encuesta-header">
                      <q-item-section avatar>
                        <q-avatar :color="enc.activa ? 'green-1' : 'grey-3'" text-color="green" class="encuesta-icon">
                          <q-icon name="description" />
                        </q-avatar>
                      </q-item-section>

                      <q-item-section>
                        <q-item-label class="encuesta-title">{{ enc.titulo }}</q-item-label>
                        <q-item-label caption>
                          <q-badge :color="enc.activa ? 'green' : 'grey'" outline>
                            {{ enc.activa ? 'Activa' : 'Inactiva' }}
                          </q-badge>
                        </q-item-label>
                      </q-item-section>

                      <q-item-section side>
                        <div class="encuesta-actions">
                          <q-btn flat round dense color="grey-7" icon="edit">
                            <q-tooltip>Editar</q-tooltip>
                          </q-btn>
                          <q-btn flat round dense color="blue-7" icon="assignment_ind" @click="asignarEncuesta(enc)">
                            <q-tooltip>Asignar</q-tooltip>
                          </q-btn>
                          <q-btn flat round dense color="primary" icon="visibility" @click.stop="verEncuesta(enc)">
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
                      <q-btn flat color="primary" label="Ver estadísticas" icon-right="visibility" />
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
                <div class="coming-soon">
                  <img src="https://cdn.quasar.dev/img/parallax2.jpg" class="placeholder-image" alt="Análisis">
                  <div class="coming-soon-overlay">
                    <q-icon name="analytics" size="56px" color="white" />
                    <h3>Módulo de Análisis</h3>
                    <p>Aquí podrás visualizar estadísticas detalladas y gráficos de las encuestas</p>
                    <q-badge color="primary" class="q-mt-md">Próximamente</q-badge>
                  </div>
                </div>
              </q-tab-panel>

              <!-- Panel Geográfico -->
              <q-tab-panel name="geografico" class="tab-panel">
                <div class="coming-soon">
                  <img src="https://cdn.quasar.dev/img/mountains.jpg" class="placeholder-image" alt="Mapa">
                  <div class="coming-soon-overlay">
                    <q-icon name="map" size="56px" color="white" />
                    <h3>Visualización Geográfica</h3>
                    <p>Aquí podrás ver la distribución geográfica de las respuestas</p>
                    <q-badge color="primary" class="q-mt-md">Próximamente</q-badge>
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
    const response = await api.get(`/api/proyectos/${id}`)
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
    const response = await api.get('/api/usuarios')
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
    const response = await api.get('/api/encuestas', {
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
    return 'purple'
  }

  const colors = {
    'inicio': 'blue',
    'en curso': 'green',
    'concluido': 'purple',
    'pausado': 'orange',
    'finalizado': 'purple'
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
/* Estilos profesionales con alta atención al detalle */
.proyecto-detail-page {
  background-color: #f8f9fa;
  min-height: 100vh;
}

/* Header estilo empresarial con degradado profesional */
.header-container {
  background: linear-gradient(to right, #1565C0, #1976d2);
  padding: 24px 0;
  color: white;
  box-shadow: 0 2px 10px rgba(25, 118, 210, 0.2);
}

.header-content {
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 16px;
}

.breadcrumb {
  margin-bottom: 12px;
}

.breadcrumb-btn {
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  padding-left: 0;
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
    color: white;
    font-size: 28px;
    font-weight: 600;
    margin: 0;
    margin-right: 16px;
  }
}

.estado-badge {
  font-size: 13px;
  padding: 6px 12px;
  border-radius: 16px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
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
  font-weight: 500;
  border-radius: 4px;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }
}

/* Contenido principal */
.page-content {
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 24px 16px;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;

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
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  transition: box-shadow 0.2s ease;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }
}

.proyecto-info-header {
  padding: 16px;
  background-color: #f9f9f9;
  border-bottom: 1px solid #e0e0e0;
}

.info-title {
  display: flex;
  align-items: center;
  font-weight: 600;
  font-size: 16px;
  color: #1976d2;

  .q-icon {
    margin-right: 8px;
  }
}

.info-section {
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }
}

.info-label {
  font-size: 13px;
  color: #616161;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
}

.info-value {
  font-size: 15px;
  color: #212121;
  font-weight: 500;

  &.description {
    font-weight: 400;
    line-height: 1.5;
  }
}

.dates-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;

  @media (min-width: 480px) and (max-width: 959px) {
    grid-template-columns: 1fr 1fr;
  }
}

/* Tarjetas de estadísticas */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 16px;
}

.stat-card {
  position: relative;
  overflow: hidden;
}

.stat-card-content {
  padding: 16px;
  text-align: center;
}

.stat-card-value {
  font-size: 32px;
  font-weight: 700;
  color: #1976d2;
  margin-bottom: 4px;

  &.estado-value {
    font-size: 24px;
  }
}

.stat-card-label {
  font-size: 14px;
  color: #616161;
  font-weight: 600;
  margin-bottom: 4px;
}

.stat-card-subtext {
  font-size: 12px;
  color: #9e9e9e;
}

.stat-icon {
  position: absolute;
  bottom: 8px;
  right: 8px;
  font-size: 36px;
  opacity: 0.1;
  color: #1976d2;
}

/* Estados */
.estado-inicio {
  .stat-card-value {
    color: #1976d2;
  }

  .stat-icon {
    color: #1976d2;
  }
}

.estado-encurso {
  .stat-card-value {
    color: #2e7d32;
  }

  .stat-icon {
    color: #2e7d32;
  }
}

.estado-concluido,
.estado-finalizado {
  .stat-card-value {
    color: #673ab7;
  }

  .stat-icon {
    color: #673ab7;
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
  border-radius: 8px 8px 0 0;
}

.tab-panel {
  padding: 24px;
}

/* Estado de carga y errores de página completa */
.full-page-loader,
.full-page-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  margin: 24px auto;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  max-width: 500px;
  text-align: center;
}

/* Estado de carga en secciones */
.section-loader {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  color: #616161;
}

/* Panel de encuestas */
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.panel-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: #1f2937;
}

.panel-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

/* Estado vacío */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  background-color: #f5f7fa;
  border-radius: 8px;
  text-align: center;
  margin-top: 16px;
}

.empty-state-icon {
  margin-bottom: 16px;
  color: #bdbdbd;
  background-color: #f5f5f5;
  border-radius: 50%;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-state-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #424242;
}

.empty-state-description {
  color: #757575;
  margin: 0 0 24px 0;
  max-width: 400px;
}

/* Lista de encuestas */
.encuestas-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Encuesta individual */
.encuesta-item {
  overflow: hidden;
  transition: all 0.2s ease;
}

.encuesta-header {
  background-color: #fafafa;
  padding: 12px 16px;
}

.encuesta-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.encuesta-icon {
  font-size: 20px;
}

.encuesta-actions {
  display: flex;
}

.encuesta-description {
  color: #424242;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 12px;
  max-height: 60px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.encuesta-metadata {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 13px;
  color: #757575;
}

.meta-item {
  display: flex;
  align-items: center;
}

/* Componentes Coming Soon */
.coming-soon {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  height: 300px;
}

.placeholder-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: blur(3px) brightness(0.7);
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
  color: white;

  h3 {
    font-size: 24px;
    font-weight: 600;
    margin: 16px 0 8px 0;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  }

  p {
    margin: 0 0 16px 0;
    max-width: 400px;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  }
}

/* Botones flotantes para móvil */
.mobile-actions {
  display: none;

  @media (max-width: 599px) {
    display: block;
    position: fixed;
    bottom: 24px;
    right: 24px;
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
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(25, 118, 210, 0.4);
  }
}

/* Media queries adicionales */
@media (max-width: 767px) {
  .header-container {
    padding: 16px 0;
  }

  .header-title h1 {
    font-size: 24px;
  }

  .stat-card-value {
    font-size: 28px;
  }

  .tab-panel {
    padding: 16px;
  }

  .panel-title {
    font-size: 18px;
  }
}

/* Animaciones sutiles */
.encuesta-item {
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  }
}

/* Efectos de hover para mejorar la experiencia interactiva */
.action-btn,
.encuesta-actions .q-btn {
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
  }
}
</style>
