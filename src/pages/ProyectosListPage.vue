<template>
  <q-page class="panel-investigacion">
    <!-- Diálogo de nuevo proyecto -->
    <ProyectoForm v-model="showProjectDialog" @save="handleProjectSubmit" @cancel="showProjectDialog = false" />

    <!-- Header mejorado - estilo más simple como en la imagen -->
    <div class="page-header">
      <div class="header-content">
        <div>
          <h1 class="page-title">Panel de Investigación</h1>
          <p class="welcome-text">Bienvenido, {{ userName }}</p>
        </div>
      </div>
    </div>

    <!-- Contenido principal -->
    <div class="page-content">
      <div class="section-header">
        <div>
          <h2 class="section-title">Gestión de Proyectos</h2>
          <p class="section-subtitle">Organiza y administra tus estudios de investigación</p>
        </div>
        <q-btn label="Nuevo Proyecto" icon="add" color="primary" unelevated class="btn-nuevo-proyecto"
          @click="showProjectDialog = true" />
      </div>

      <!-- Estado de carga -->
      <div v-if="loading" class="text-center q-pa-xl">
        <q-spinner color="primary" size="3em" />
        <div class="q-mt-sm">Cargando proyectos...</div>
      </div>

      <!-- Estado vacío -->
      <div v-else-if="!loading && (!proyectos || proyectos.length === 0)" class="empty-state">
        <q-icon name="folder_open" size="80px" color="grey-5" />
        <h5 class="q-mt-md text-grey-8">No hay proyectos</h5>
        <p class="text-grey-7">Crea tu primer proyecto para comenzar</p>
        <q-btn label="Nuevo Proyecto" icon="add" color="primary" unelevated class="q-mt-sm"
          @click="showProjectDialog = true" />
      </div>

      <!-- Lista de Proyectos - estilo similar a la imagen -->
      <div v-else class="projects-list">
        <q-card v-for="proyecto in proyectos" :key="proyecto.id" class="project-card" flat bordered>
          <q-card-section>
            <div class="project-header">
              <div class="project-title-section">
                <h3 class="project-title">{{ proyecto.titulo }}</h3>
                <q-badge :color="getEstadoColor(proyecto.estado, proyecto)"
                  :label="getEstadoLabel(proyecto.estado, proyecto)" class="status-badge" />
              </div>
              <q-btn label="VER DETALLES" flat color="primary" icon-right="visibility"
                @click="verDetalles(proyecto.id)" />
            </div>

            <p class="project-description">{{ proyecto.descripcion || 'Sin descripción' }}</p>

            <!-- Fechas y responsable -->
            <div class="project-info">
              <div class="info-item">
                <q-icon name="event" size="18px" color="grey-7" />
                <span class="info-label">Fecha de inicio:</span>
                <span class="info-value">{{ formatFecha(proyecto.fecha_inicio) }}</span>
              </div>

              <div class="info-item" v-if="proyecto.fecha_fin">
                <q-icon name="event_available" size="18px" color="grey-7" />
                <span class="info-label">Fecha de fin:</span>
                <span class="info-value">{{ formatFecha(proyecto.fecha_fin) }}</span>
              </div>
            </div>

            <div class="project-info">
              <div class="info-item" v-if="proyecto.responsable_id">
                <q-icon name="person" size="18px" color="grey-7" />
                <span class="info-label">Responsable:</span>
                <span class="info-value">
                  {{ obtenerNombreResponsable(proyecto.responsable_id) }}
                </span>
              </div>

              <div class="info-item" v-if="proyecto.ubicacion">
                <q-icon name="place" size="18px" color="grey-7" />
                <span class="info-label">Ubicación:</span>
                <span class="info-value">{{ proyecto.ubicacion }}</span>
              </div>
            </div>

            <!-- Estadísticas simples como en la imagen -->
            <div class="project-stats-row">
              <div class="q-gutter-x-md">
                <span class="stat-item">
                  <q-icon name="description" size="20px" color="blue" />
                  <span class="stat-value">{{ proyecto.encuestas_count || 0 }}</span>
                  <span class="stat-label">encuestas</span>
                </span>

                <span class="stat-item">
                  <q-icon name="people" size="20px" color="blue" />
                  <span class="stat-value">{{ proyecto.respuestas_count || 0 }}</span>
                  <span class="stat-label">respuestas</span>
                </span>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { api } from 'src/boot/axios'
import { useAuthStore } from 'src/stores/auth.store'
import ProyectoForm from 'components/proyectos/ProyectoForm.vue'

const router = useRouter()
const $q = useQuasar()
const auth = useAuthStore()

// Estado del componente
const showProjectDialog = ref(false)
const loading = ref(true)
const error = ref(null)
const proyectos = ref([])
const usuarios = ref([])

// Información del usuario desde el store
const userName = computed(() => {
  if (auth.user) {
    return `${auth.user.nombres || ''} ${auth.user.apellidos || ''}`.trim()
  }
  return 'Usuario'
})

// Función para obtener el nombre del responsable según ID
function obtenerNombreResponsable(responsableId) {
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

// Cargar proyectos desde la API
async function loadProyectos() {
  loading.value = true
  error.value = null

  try {
    // Usar la ruta correcta de la API según tu controlador
    const response = await api.get('/proyectos', {
      params: {
        // Agregar parámetros opcionales si es necesario
        per_page: 20 // Número de proyectos por página
      }
    })

    // Extraer datos según la estructura de respuesta
    // El controlador devuelve data dentro de la respuesta si es paginada
    let proyectosData = []
    if (response.data.data) {
      proyectosData = response.data.data
    } else {
      proyectosData = response.data
    }

    // Verificar y actualizar proyectos vencidos
    proyectosData = await verificarEstadosProyectos(proyectosData)

    // Asignar los proyectos al state
    proyectos.value = proyectosData

    console.log('Proyectos cargados:', proyectos.value)
  } catch (err) {
    console.error('Error al cargar proyectos:', err)
    error.value = err.message || 'Error al cargar proyectos'
    $q.notify({
      type: 'negative',
      message: error.value,
      position: 'top'
    })
  } finally {
    loading.value = false
  }
}

// Verificar y actualizar estados de proyectos vencidos
async function verificarEstadosProyectos(proyectosData) {
  if (!proyectosData || !proyectosData.length) return proyectosData

  // Proyectos que necesitan actualización
  const proyectosParaActualizar = []

  // Fecha actual (sin hora)
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  // Identificar proyectos vencidos
  for (const proyecto of proyectosData) {
    // Si no tiene fecha de fin o ya está marcado como finalizado, omitir
    if (!proyecto.fecha_fin || proyecto.estado === 'finalizado') continue

    // Convertir fecha_fin a objeto Date
    let fechaFin
    try {
      // Si viene en formato ISO con hora (YYYY-MM-DDThh:mm:ss)
      if (typeof proyecto.fecha_fin === 'string' && proyecto.fecha_fin.includes('T')) {
        fechaFin = new Date(proyecto.fecha_fin)
      }
      // Si viene en formato YYYY-MM-DD
      else if (typeof proyecto.fecha_fin === 'string' && proyecto.fecha_fin.includes('-')) {
        const partes = proyecto.fecha_fin.split('-')
        fechaFin = new Date(partes[0], partes[1] - 1, partes[2])
      } else {
        fechaFin = new Date(proyecto.fecha_fin)
      }

      // Normalizar para comparar solo fecha sin hora
      fechaFin.setHours(0, 0, 0, 0)

      // Si la fecha fin ya pasó y el estado no es 'finalizado'
      if (fechaFin < hoy && proyecto.estado !== 'finalizado') {
        proyectosParaActualizar.push({
          id: proyecto.id,
          estadoOriginal: proyecto.estado
        })

        // Actualizar en la lista local para reflejar cambios inmediatamente
        proyecto.estado = 'finalizado'
      }
    } catch (error) {
      console.error(`Error al procesar fecha para proyecto ${proyecto.id}:`, error)
    }
  }

  // Actualizar en el servidor
  if (proyectosParaActualizar.length > 0) {
    console.log(`Actualizando ${proyectosParaActualizar.length} proyectos a estado "finalizado"`)

    // Realizar actualizaciones en paralelo
    try {
      await Promise.all(
        proyectosParaActualizar.map(p =>
          actualizarEstadoProyecto(p.id, 'finalizado')
        )
      )
      console.log('Proyectos actualizados correctamente')
    } catch (error) {
      console.error('Error al actualizar proyectos vencidos:', error)
    }
  }

  return proyectosData
}

// Función para actualizar el estado de un proyecto en el servidor
async function actualizarEstadoProyecto(id, nuevoEstado) {
  try {
    const response = await api.put(`/proyectos/${id}`, {
      estado: nuevoEstado
    })
    return response.data
  } catch (error) {
    console.error('Error al actualizar estado del proyecto:', error)
    throw error
  }
}

// Cargar usuarios (para obtener nombres de responsables)
async function loadUsuarios() {
  try {
    const response = await api.get('/usuarios')
    if (response.data.data) {
      usuarios.value = response.data.data
    } else {
      usuarios.value = response.data
    }
    console.log('Usuarios cargados:', usuarios.value)
  } catch (err) {
    console.error('Error al cargar usuarios:', err)
    // No mostrar error al usuario para no interrumpir la carga de proyectos
  }
}

// Formatear fecha directamente desde el formato de la base de datos
function formatFecha(dateString) {
  if (!dateString) return '';

  try {
    // Extraer la fecha en formato YYYY-MM-DD directamente
    if (typeof dateString === 'string') {
      // Si la fecha viene en formato ISO con hora (YYYY-MM-DDThh:mm:ss)
      if (dateString.includes('T')) {
        const partes = dateString.split('T')[0].split('-');
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
      }
      // Si la fecha viene en formato simple YYYY-MM-DD
      else if (dateString.includes('-')) {
        const partes = dateString.split('-');
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
      }
      // Si ya viene formateada, devolverla tal cual
      return dateString;
    }

    // Si es un objeto Date
    if (dateString instanceof Date) {
      const day = String(dateString.getDate()).padStart(2, '0');
      const month = String(dateString.getMonth() + 1).padStart(2, '0');
      const year = dateString.getFullYear();
      return `${day}/${month}/${year}`;
    }

    return dateString;
  } catch (error) {
    console.error('Error al formatear fecha:', error);
    return dateString || '';
  }
}

// Función para verificar si un proyecto está finalizado basado en su fecha de fin
function isProyectoFinalizado(proyecto) {
  if (!proyecto.fecha_fin) return false

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

// Obtener color según el estado
function getEstadoColor(estado, proyecto) {
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

// Manejar creación de proyecto
function handleProjectSubmit() {
  // Notificar éxito
  $q.notify({
    type: 'positive',
    message: 'Proyecto creado exitosamente',
    position: 'top'
  })

  // Recargar proyectos
  loadProyectos()

  // Cerrar diálogo
  showProjectDialog.value = false
}

// Ver detalles del proyecto
function verDetalles(proyectoId) {
  router.push({
    name: 'proyectos.detail',
    params: { id: proyectoId }
  })
}
// Cargar proyectos y usuarios al montar el componente
onMounted(async () => {
  // Cargar datos en paralelo
  Promise.all([
    loadProyectos(),
    loadUsuarios()
  ]).catch(error => {
    console.error('Error al cargar datos:', error)
  })
})
</script>


<style lang="scss" scoped>
.panel-investigacion {
  background-color: #f7f8fc;
  min-height: 100vh;
}

.page-header {
  background: #1976d2;
  padding: 24px 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  color: white;
  margin: 0 0 8px 0;
}

.welcome-text {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  font-weight: 400;
}

.page-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 32px 32px 32px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.section-title {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 4px 0;
}

.section-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.btn-nuevo-proyecto {
  background: #1976d2;
  color: white;
  font-weight: 500;
  padding: 10px 24px;
  border-radius: 8px;
  text-transform: none;
  font-size: 14px;
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.25);
  transition: all 0.2s ease;

  &:hover {
    background: #1565c0;
    box-shadow: 0 4px 12px rgba(25, 118, 210, 0.4);
    transform: translateY(-2px);
  }
}

.projects-list {
  display: grid;
  gap: 24px;
}

.empty-state {
  text-align: center;
  padding: 80px 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.project-card {
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: white;
  transition: all 0.2s ease;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);

  &:hover {
    box-shadow: 0 8px 24px rgba(25, 118, 210, 0.1);
    border-color: #1976d2;
    transform: translateY(-3px);
  }
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.project-title-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.project-title {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 30px;
  font-size: 12px;
  font-weight: 500;
}

.project-description {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 16px 0;
}

.project-info {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  margin-bottom: 16px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.info-label {
  color: #6b7280;
  font-weight: 500;
}

.info-value {
  color: #1f2937;
  font-weight: 500;
}

.project-stats-row {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.stat-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.stat-label {
  font-size: 13px;
  color: #6b7280;
}

@media (max-width: 768px) {
  .project-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .section-header {
    flex-direction: column;
    gap: 16px;
  }
}
</style>
