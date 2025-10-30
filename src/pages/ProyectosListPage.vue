<template>
  <q-page class="panel-investigacion">
    <!-- Diálogo de nuevo proyecto -->
    <ProyectoForm v-model="showProjectDialog" @save="handleProjectSubmit" @cancel="showProjectDialog = false" />

    <!-- Header mejorado con nuevo estilo -->
    <div class="page-header" data-aos="fade-down" data-aos-duration="800">
      <div class="header-content">
        <div>
          <h1 class="page-title">Panel de Investigación</h1>
          <p class="welcome-text">Bienvenido, {{ userName }}</p>
        </div>
      </div>
    </div>

    <!-- Contenido principal -->
    <div class="page-content">
      <div class="section-header" data-aos="fade-up" data-aos-delay="100">
        <div>
          <h2 class="section-title">{{ getSectionTitle }}</h2>
          <p class="section-subtitle">{{ getSectionSubtitle }}</p>
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
      <div v-else-if="!loading && (!proyectos || proyectos.length === 0)" class="empty-state" data-aos="zoom-in" data-aos-delay="200">
        <q-icon name="folder_open" size="80px" color="primary" />
        <h5 class="q-mt-md text-primary">{{ getEmptyStateTitle }}</h5>
        <p class="text-secondary">{{ getEmptyStateSubtitle }}</p>
        <q-btn label="Nuevo Proyecto" icon="add" color="primary" unelevated class="q-mt-sm btn-empty-state"
          @click="showProjectDialog = true" />
      </div>

      <!-- Lista de Proyectos con nuevo diseño -->
      <div v-else class="projects-list">
        <q-card v-for="(proyecto, index) in proyectos"
                :key="proyecto.id"
                class="project-card"
                flat
                bordered
                data-aos="fade-up"
                :data-aos-delay="100 + (index * 50)">
          <q-card-section>
            <div class="project-header">
              <div class="project-title-section">
                <h3 class="project-title">{{ proyecto.titulo }}</h3>
                <q-badge :color="getEstadoColor(proyecto.estado, proyecto)"
                  :label="getEstadoLabel(proyecto.estado, proyecto)" class="status-badge" />
              </div>
              <q-btn label="VER DETALLES" flat color="accent" icon-right="visibility"
                @click="verDetalles(proyecto.id)" class="btn-ver-detalles" />
            </div>

            <p class="project-description">{{ proyecto.descripcion || 'Sin descripción' }}</p>

            <!-- Fechas y responsable -->
            <div class="project-info">
              <div class="info-item">
                <q-icon name="event" size="18px" color="primary" />
                <span class="info-label">Fecha de inicio:</span>
                <span class="info-value">{{ formatFecha(proyecto.fecha_inicio) }}</span>
              </div>

              <div class="info-item" v-if="proyecto.fecha_fin">
                <q-icon name="event_available" size="18px" color="primary" />
                <span class="info-label">Fecha de fin:</span>
                <span class="info-value">{{ formatFecha(proyecto.fecha_fin) }}</span>
              </div>
            </div>

            <div class="project-info">
              <div class="info-item" v-if="proyecto.responsable_id">
                <q-icon name="person" size="18px" color="primary" />
                <span class="info-label">Responsable:</span>
                <span class="info-value">
                  {{ obtenerNombreResponsable(proyecto.responsable_id) }}
                </span>
              </div>

              <div class="info-item" v-if="proyecto.ubicacion">
                <q-icon name="place" size="18px" color="primary" />
                <span class="info-label">Ubicación:</span>
                <span class="info-value">{{ proyecto.ubicacion }}</span>
              </div>
            </div>

            <!-- Eliminamos la sección de estadísticas que mostraba "0 encuestas" y "0 respuestas" -->
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
import AOS from 'aos'

const router = useRouter()
const $q = useQuasar()
const auth = useAuthStore()

// Detectar el rol del usuario actual

const isResponsable = computed(() => auth.user?.rol_id === 2);
const isAcademico = computed(() => auth.user?.rol_id === 4);

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

// Textos personalizados para el estado vacío según el rol
const getEmptyStateTitle = computed(() => {
  if (isResponsable.value) {
    return 'No tienes proyectos creados';
  } else if (isAcademico.value) {
    return 'No tienes proyectos académicos';
  } else {
    return 'No hay proyectos en el sistema';
  }
});

const getEmptyStateSubtitle = computed(() => {
  if (isResponsable.value || isAcademico.value) {
    return 'Crea tu primer proyecto para comenzar';
  } else {
    return 'Aún no se han creado proyectos en el sistema';
  }
});

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
    // Parámetros para la petición API
    const params = {
      per_page: 20 // Número de proyectos por página
    };

    // Filtrar por responsable si el usuario es Responsable o Académico
    if (isResponsable.value || isAcademico.value) {
      params.responsable_id = auth.user.id;
    }

    // Usar la ruta correcta de la API según tu controlador
    const response = await api.get('/proyectos', { params });

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

// Textos personalizados para el encabezado según el rol
const getSectionTitle = computed(() => {
  if (isResponsable.value) {
    return 'Mis Proyectos de Investigación';
  } else if (isAcademico.value) {
    return 'Mis Proyectos Académicos';
  } else {
    return 'Gestión de Proyectos';
  }
});

const getSectionSubtitle = computed(() => {
  if (isResponsable.value) {
    return 'Administra tus estudios e investigaciones';
  } else if (isAcademico.value) {
    return 'Gestiona tus trabajos académicos';
  } else {
    return 'Organiza y administra todos los proyectos del sistema';
  }
});

// Cargar proyectos y usuarios al montar el componente
onMounted(async () => {
  // Inicializar AOS si está disponible
  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 800,
      easing: 'ease-out-cubic',
      once: true
    })
  }

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
// Variables de colores personalizados
$purple: #663399;
$teal: #009999;
$light-teal: #00AAAA;
$white: #FFFFFF;

// Configuración de colores para Quasar (accesible via variables CSS)
:root {
  --q-primary: #{$purple};
  --q-secondary: #{$purple};
  --q-accent: #{$teal};
}

.panel-investigacion {
  background-color: $white;
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
    background: linear-gradient(135deg, rgba($purple, 0.03) 0%, rgba($teal, 0.03) 100%);
    pointer-events: none;
    z-index: 0;
  }
}

.page-header {
  background: linear-gradient(135deg, $purple 0%, $teal 100%);
  padding: 32px 32px;
  box-shadow: 0 4px 20px rgba($purple, 0.2);
  margin-bottom: 30px;
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    bottom: -10px;
    right: -10px;
    width: 250px;
    height: 250px;
    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%);
    border-radius: 50%;
  }
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: $white;
  margin: 0 0 8px 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    text-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
}

.welcome-text {
  font-size: 18px;
  color: rgba($white, 0.9);
  margin: 0;
  font-weight: 400;
  letter-spacing: 0.02em;
}

.page-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 32px 50px 32px;
  position: relative;
  z-index: 1;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 30px;
}

.section-title {
  font-size: 26px;
  font-weight: 700;
  color: $purple;
  margin: 0 0 8px 0;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: -8px;
    left: 0;
    width: 60px;
    height: 3px;
    background: $teal;
    border-radius: 10px;
  }
}

.section-subtitle {
  font-size: 16px;
  color: rgba($purple, 0.7);
  margin: 10px 0 0 0;
  font-weight: 400;
}

.btn-nuevo-proyecto {
  background: linear-gradient(135deg, $purple 0%, $teal 100%);
  color: $white;
  font-weight: 600;
  padding: 12px 24px;
  border-radius: 10px;
  text-transform: none;
  font-size: 15px;
  box-shadow: 0 4px 12px rgba($purple, 0.25);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 6px 16px rgba($purple, 0.4);
    transform: translateY(-3px);
  }

  &:active {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba($purple, 0.3);
  }
}

.projects-list {
  display: grid;
  gap: 28px;
}

.empty-state {
  text-align: center;
  padding: 100px 0;
  background: $white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba($purple, 0.08);
  border: 1px dashed rgba($teal, 0.2);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 8px 30px rgba($purple, 0.12);
    border-color: rgba($teal, 0.3);
  }
}

.btn-empty-state {
  padding: 12px 30px;
  border-radius: 30px;
  font-weight: 600;
  background: linear-gradient(135deg, $purple 0%, $teal 100%);
  transition: all 0.3s ease;
  margin-top: 20px;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 20px rgba($purple, 0.3);
  }
}

.project-card {
  border-radius: 16px;
  border: 1px solid rgba($purple, 0.1);
  background: $white;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 4px 16px rgba($purple, 0.05);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 6px;
    height: 100%;
    background: linear-gradient(to bottom, $purple, $teal);
    border-radius: 6px 0 0 6px;
  }

  &:hover {
    box-shadow: 0 12px 30px rgba($purple, 0.12);
    border-color: rgba($teal, 0.2);
    transform: translateY(-6px);
  }
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.project-title-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.project-title {
  font-size: 22px;
  font-weight: 600;
  color: $purple;
  margin: 0;
  transition: all 0.3s ease;

  &:hover {
    color: $teal;
  }
}

.status-badge {
  padding: 6px 14px;
  border-radius: 30px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.btn-ver-detalles {
  font-weight: 600;
  letter-spacing: 0.03em;
  border-radius: 8px;
  padding: 8px 16px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba($teal, 0.1);
    transform: translateX(2px);
  }
}

.project-description {
  font-size: 15px;
  color: rgba($purple, 0.7);
  margin: 0 0 20px 0;
  line-height: 1.6;
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
  font-size: 14px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
  }
}

.info-label {
  color: rgba($purple, 0.7);
  font-weight: 500;
}

.info-value {
  color: $purple;
  font-weight: 600;
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

  .page-header {
    padding: 24px 20px;
  }

  .page-content {
    padding: 0 20px 40px;
  }

  .page-title {
    font-size: 26px;
  }

  .welcome-text {
    font-size: 16px;
  }

  .section-title {
    font-size: 22px;
  }
}

@media (min-width: 768px) and (max-width: 1200px) {
  .projects-list {
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  }
}

@media (min-width: 1200px) {
  .projects-list {
    grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
  }
}
</style>
