<template>
  <q-page class="project-detail-page">
    <!-- Breadcrumb -->
    <div class="breadcrumb-container">
      <q-btn
        flat
        dense
        icon="arrow_back"
        label="Volver a Campañas"
        color="grey-8"
        class="btn-back"
        @click="$router.push('/proyectos')"
      />
    </div>

    <!-- Header de la campaña -->
    <div class="campaign-header-section">
      <div class="campaign-header-content">
        <div class="title-section">
          <h1 class="campaign-name">{{ campaign.nombre }}</h1>
          <q-badge
            :color="campaign.estado === 'Finalizada' ? 'purple' : 'positive'"
            :label="campaign.estado"
            class="status-badge"
          />
        </div>
        <q-btn
          label="Exportar Datos"
          icon="download"
          color="primary"
          outline
          class="btn-export"
          @click="onExportarDatos"
        />
      </div>

      <p class="campaign-description">{{ campaign.descripcion }}</p>

      <div class="campaign-metadata">
        <div class="metadata-item">
          <q-icon name="place" size="18px" color="grey-7" />
          <span class="metadata-value">{{ campaign.ubicacion }}</span>
        </div>
        <div class="metadata-item">
          <q-icon name="location_on" size="18px" color="grey-7" />
          <span class="metadata-label">Zona:</span>
          <span class="metadata-value">{{ campaign.zona }}</span>
        </div>
        <div class="metadata-item">
          <q-icon name="event" size="18px" color="grey-7" />
          <span class="metadata-value">{{ campaign.inicio }} - {{ campaign.fin }}</span>
        </div>
      </div>
    </div>

    <!-- Métricas principales -->
    <div class="metrics-section">
      <div class="metric-card" style="border-left: 4px solid #8b5cf6">
        <div class="metric-header">
          <span class="metric-label">Total Encuestas</span>
          <q-icon name="description" size="24px" color="purple-5" />
        </div>
        <div class="metric-value">{{ metrics.totalEncuestas }}</div>
        <div class="metric-subtitle">{{ metrics.encuestasActivas }} activas</div>
      </div>

      <div class="metric-card" style="border-left: 4px solid #a78bfa">
        <div class="metric-header">
          <span class="metric-label">Total Respuestas</span>
          <q-icon name="people" size="24px" color="purple-4" />
        </div>
        <div class="metric-value">{{ metrics.totalRespuestas }}</div>
        <div class="metric-subtitle">{{ metrics.promedioRespuestas }} promedio por encuesta</div>
      </div>

      <div class="metric-card" style="border-left: 4px solid #10b981">
        <div class="metric-header">
          <span class="metric-label">MDAS Promedio</span>
          <q-icon name="trending_up" size="24px" color="positive" />
        </div>
        <div class="metric-value">{{ metrics.mdasPromedio }}</div>
        <div class="metric-subtitle">{{ metrics.nivelAnsiedad }}</div>
      </div>

      <div class="metric-card" style="border-left: 4px solid #f59e0b">
        <div class="metric-header">
          <span class="metric-label">Tasa Completación</span>
          <q-icon name="pie_chart" size="24px" color="warning" />
        </div>
        <div class="metric-value">{{ metrics.tasaCompletacion }}%</div>
        <div class="metric-subtitle">{{ metrics.descripcionCompletacion }}</div>
      </div>
    </div>

    <!-- Tabs de navegación -->
    <div class="tabs-container">
      <q-tabs
        v-model="tab"
        dense
        class="custom-tabs"
        active-color="primary"
        indicator-color="primary"
        align="left"
      >
        <q-tab name="encuestas" icon="description" label="Encuestas" />
        <q-tab name="analisis" icon="bar_chart" label="Análisis" />
        <q-tab name="geografico" icon="map" label="Geográfico" />
      </q-tabs>
    </div>

    <!-- Contenido de las tabs -->
    <div class="tab-content">
      <q-tab-panels v-model="tab" animated class="bg-transparent">
        <!-- Panel de Encuestas -->
        <q-tab-panel name="encuestas" class="q-pa-none">
          <div class="encuestas-section">
            <div class="section-header">
              <div>
                <h2 class="section-title">Encuestas de la Campaña</h2>
                <p class="section-subtitle">
                  Todas las encuestas asociadas a esta campaña de investigación
                </p>
              </div>
              <q-btn
                label="Nueva Encuesta"
                icon="add"
                color="primary"
                unelevated
                class="btn-nueva-encuesta"
                @click="onNuevaEncuesta"
              />
            </div>

            <!-- Lista de encuestas -->
            <div class="encuestas-list">
              <q-card
                v-for="encuesta in encuestas"
                :key="encuesta.id"
                class="encuesta-card"
                flat
                bordered
              >
                <q-card-section>
                  <div class="encuesta-header">
                    <div class="encuesta-icon">
                      <q-icon name="description" size="32px" color="primary" />
                    </div>
                    <div class="encuesta-info">
                      <div class="encuesta-title-row">
                        <h3 class="encuesta-title">{{ encuesta.titulo }}</h3>
                        <q-badge
                          :color="encuesta.estado === 'Activa' ? 'positive' : 'grey-6'"
                          :label="encuesta.estado"
                          class="encuesta-badge"
                        />
                      </div>
                      <p class="encuesta-description">{{ encuesta.descripcion }}</p>
                    </div>
                    <q-btn
                      label="Ver Estadísticas"
                      flat
                      color="primary"
                      icon-right="visibility"
                      class="btn-ver-stats"
                      @click="verEstadisticas(encuesta.id)"
                    />
                  </div>

                  <div class="encuesta-stats">
                    <div class="stat-item">
                      <q-icon name="people" size="20px" color="primary" />
                      <span class="stat-value">{{ encuesta.respuestas }}</span>
                      <span class="stat-label">respuestas</span>
                    </div>
                    <div class="stat-item">
                      <q-icon name="trending_up" size="20px" color="positive" />
                      <span class="stat-value">MDAS: {{ encuesta.mdas }}</span>
                    </div>
                    <div class="stat-item">
                      <q-icon name="pie_chart" size="20px" color="warning" />
                      <span class="stat-value">{{ encuesta.completacion }}% completación</span>
                    </div>
                    <div class="stat-item">
                      <q-icon name="event" size="20px" color="grey-7" />
                      <span class="stat-value">{{ encuesta.fecha }}</span>
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </q-tab-panel>

        <!-- Panel de Análisis -->
        <q-tab-panel name="analisis">
          <div class="coming-soon">
            <q-icon name="bar_chart" size="64px" color="grey-5" />
            <p>Vista de análisis en desarrollo</p>
          </div>
        </q-tab-panel>

        <!-- Panel Geográfico -->
        <q-tab-panel name="geografico">
          <div class="coming-soon">
            <q-icon name="map" size="64px" color="grey-5" />
            <p>Vista geográfica en desarrollo</p>
          </div>
        </q-tab-panel>
      </q-tab-panels>
    </div>
  </q-page>
</template>

<script>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'

export default {
  name: 'ProjectDetailPage',

  setup() {
    const router = useRouter()
    const route = useRoute()
    const tab = ref('encuestas')

    const campaign = ref({
      nombre: 'Odontofobia 2025',
      descripcion: 'Es un estudio para x.. zona',
      ubicacion: 'Cercado',
      zona: 'Norte',
      inicio: '28/9/2025',
      fin: '29/9/2025',
      estado: 'Finalizada',
    })

    const metrics = ref({
      totalEncuestas: 3,
      encuestasActivas: 2,
      totalRespuestas: 135,
      promedioRespuestas: 45,
      mdasPromedio: 2.31,
      nivelAnsiedad: 'Ansiedad moderada-baja',
      tasaCompletacion: 92,
      descripcionCompletacion: 'Excelente participación',
    })

    const encuestas = ref([
      {
        id: 1,
        titulo: 'MDAS - Evaluación Pre-tratamiento',
        descripcion: 'Encuesta para evaluar el nivel de ansiedad dental antes del tratamiento',
        respuestas: 45,
        mdas: 2.3,
        completacion: 94.2,
        fecha: '14/2/2024',
        estado: 'Activa',
      },
      {
        id: 2,
        titulo: 'MDAS - Seguimiento Post-tratamiento',
        descripcion: 'Evaluación de ansiedad dental después del tratamiento odontológico',
        respuestas: 38,
        mdas: 1.8,
        completacion: 89.5,
        fecha: '29/2/2024',
        estado: 'Activa',
      },
    ])

    const onExportarDatos = () => {
      console.log('Exportar datos')
    }

    const onNuevaEncuesta = () => {
      router.push(`/proyectos/${route.params.id}/encuestas/nueva`)
    }

    const verEstadisticas = (encuestaId) => {
      router.push(`/encuestas/${encuestaId}/estadisticas`)
    }

    return {
      tab,
      campaign,
      metrics,
      encuestas,
      onExportarDatos,
      onNuevaEncuesta,
      verEstadisticas,
    }
  },
}
</script>

<style lang="scss" scoped>
.project-detail-page {
  background-color: #f5f5f9;
  min-height: 100vh;
}

.breadcrumb-container {
  background: white;
  padding: 16px 32px;
  border-bottom: 1px solid #e0e0e0;
}

.btn-back {
  text-transform: none;
  font-size: 14px;
  font-weight: 500;
}

.campaign-header-section {
  background: white;
  padding: 24px 32px;
  border-bottom: 1px solid #e0e0e0;
}

.campaign-header-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.campaign-name {
  font-size: 28px;
  font-weight: 600;
  color: #7c3aed;
  margin: 0;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.btn-export {
  text-transform: none;
  font-weight: 500;
  border-radius: 8px;
  border: 1.5px solid #7c3aed;
  color: #7c3aed;
}

.campaign-description {
  max-width: 1400px;
  margin: 0 auto 16px;
  font-size: 14px;
  color: #6b7280;
}

.campaign-metadata {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  gap: 24px;
}

.metadata-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #6b7280;
}

.metadata-label {
  font-weight: 500;
}

.metadata-value {
  color: #1f2937;
}

.metrics-section {
  max-width: 1400px;
  margin: 32px auto;
  padding: 0 32px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.metric-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e5e7eb;
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.metric-label {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

.metric-value {
  font-size: 32px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 4px;
}

.metric-subtitle {
  font-size: 13px;
  color: #6b7280;
}

.tabs-container {
  background: white;
  border-bottom: 1px solid #e0e0e0;
  padding: 0 32px;
}

.custom-tabs {
  max-width: 1400px;
  margin: 0 auto;
}

.custom-tabs :deep(.q-tab) {
  text-transform: none;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  padding: 16px 24px;
}

.custom-tabs :deep(.q-tab--active) {
  color: #7c3aed;
}

.tab-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 32px;
}

.encuestas-section {
  background: transparent;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 4px 0;
}

.section-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.btn-nueva-encuesta {
  background: #7c3aed;
  color: white;
  font-weight: 500;
  padding: 8px 20px;
  border-radius: 8px;
  text-transform: none;
  font-size: 14px;
}

.encuestas-list {
  display: grid;
  gap: 20px;
}

.encuesta-card {
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: white;
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(124, 58, 237, 0.1);
    border-color: #7c3aed;
  }
}

.encuesta-header {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 16px;
}

.encuesta-icon {
  flex-shrink: 0;
  width: 56px;
  height: 56px;
  background: #f3f4f6;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.encuesta-info {
  flex: 1;
}

.encuesta-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.encuesta-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.encuesta-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.encuesta-description {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.btn-ver-stats {
  text-transform: none;
  font-weight: 500;
}

.encuesta-stats {
  display: flex;
  gap: 24px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.stat-value {
  color: #1f2937;
  font-weight: 600;
}

.stat-label {
  color: #6b7280;
}

.coming-soon {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  color: #9ca3af;

  p {
    margin-top: 16px;
    font-size: 16px;
  }
}
</style>
