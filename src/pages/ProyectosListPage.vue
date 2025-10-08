<template>
  <q-page class="panel-investigacion">
    <!-- Diálogo de nuevo proyecto -->
    <ProyectoFormDialog v-model="showProjectDialog" @submit="handleProjectSubmit" />

    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <div>
          <h1 class="page-title">Panel de Investigación</h1>
          <p class="welcome-text">Bienvenido, {{ userName }}</p>
          <p class="department-text">{{ userDepartment }}</p>
        </div>
        <div class="header-actions">
          <q-btn
            label="Nueva Encuesta"
            icon="add"
            color="primary"
            unelevated
            class="btn-nueva-encuesta"
            @click="onNuevaEncuesta"
          />
          <q-btn
            label="Cerrar Sesión"
            flat
            color="grey-8"
            class="btn-cerrar-sesion"
            @click="onCerrarSesion"
          />
        </div>
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
        <q-tab name="campañas" icon="folder" label="Campañas" />
        <q-tab name="encuestas" icon="description" label="Encuestas" />
        <q-tab name="analisis" icon="bar_chart" label="Análisis" />
      </q-tabs>
    </div>

    <!-- Contenido principal -->
    <div class="page-content">
      <div class="section-header">
        <div>
          <h2 class="section-title">Gestión de Campañas</h2>
          <p class="section-subtitle">Organiza y administra tus estudios de investigación</p>
        </div>
        <q-btn
          label="Nueva Campaña"
          icon="add"
          color="primary"
          unelevated
          class="btn-nueva-campana"
          @click="onNuevaCampana"
        />
      </div>

      <!-- Lista de Campañas -->
      <div class="campaigns-list">
        <q-card
          v-for="campaign in campaigns"
          :key="campaign.id"
          class="campaign-card"
          flat
          bordered
        >
          <q-card-section>
            <div class="campaign-header">
              <div class="campaign-title-section">
                <h3 class="campaign-title">{{ campaign.nombre }}</h3>
                <q-badge
                  :color="campaign.estado === 'Finalizada' ? 'purple' : 'positive'"
                  :label="campaign.estado"
                  class="status-badge"
                />
              </div>
              <q-btn
                label="VER DETALLES"
                flat
                color="primary"
                icon-right="visibility"
                @click="verDetalles(campaign.id)"
              />
            </div>

            <p class="campaign-description">{{ campaign.descripcion }}</p>

            <div class="campaign-info">
              <div class="info-item">
                <q-icon name="place" size="18px" color="grey-7" />
                <span class="info-label">Ubicación:</span>
                <span class="info-value">{{ campaign.ubicacion }}</span>
              </div>

              <div class="info-item">
                <q-icon name="location_on" size="18px" color="grey-7" />
                <span class="info-label">Zona:</span>
                <span class="info-value">{{ campaign.zona }}</span>
              </div>
            </div>

            <div class="campaign-info">
              <div class="info-item">
                <q-icon name="event" size="18px" color="grey-7" />
                <span class="info-label">Inicio:</span>
                <span class="info-value">{{ campaign.inicio }}</span>
              </div>

              <div class="info-item" v-if="campaign.fin">
                <q-icon name="event" size="18px" color="grey-7" />
                <span class="info-label">Fin:</span>
                <span class="info-value">{{ campaign.fin }}</span>
              </div>
            </div>

            <div class="campaign-stats">
              <div class="stat-item">
                <q-icon name="description" size="20px" color="primary" />
                <span class="stat-value">{{ campaign.encuestas }}</span>
                <span class="stat-label">encuestas</span>
              </div>
              <div class="stat-item">
                <q-icon name="people" size="20px" color="primary" />
                <span class="stat-value">{{ campaign.respuestas }}</span>
                <span class="stat-label">respuestas</span>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'ProjectsListPage',

  setup() {
    const router = useRouter()
    const tab = ref('campañas')

    // Datos del usuario (vendrán del store de autenticación)
    const userName = computed(() => 'Dr. jalar nombre xd')
    const userDepartment = computed(() => 'Odontología aqui ira la especialidad del usuario')

    const campaigns = ref([
      {
        id: 1,
        nombre: 'Odontofobia 2025',
        descripcion: 'Es un estudio para x.. zona',
        ubicacion: 'Cercado',
        zona: 'Norte',
        inicio: '28/9/2025',
        fin: '29/9/2025',
        encuestas: 0,
        respuestas: 0,
        estado: 'Finalizada',
      },
    ])

    const onNuevaEncuesta = () => {
      router.push('/encuestas/nueva')
    }

    const onNuevaCampana = () => {
      router.push('/proyectos/nuevo')
    }

    const onCerrarSesion = () => {
      // Aquí se limpiaría el store de autenticación
      router.push('/login')
    }

    const verDetalles = (id) => {
      router.push(`/proyectos/${id}`)
    }

    return {
      tab,
      userName,
      userDepartment,
      campaigns,
      onNuevaEncuesta,
      onNuevaCampana,
      onCerrarSesion,
      verDetalles,
    }
  },
}
</script>

<style lang="scss" scoped>
.panel-investigacion {
  background-color: #f5f5f9;
  min-height: 100vh;
}

.page-header {
  background: white;
  border-bottom: 1px solid #e0e0e0;
  padding: 24px 32px;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  color: #7c3aed;
  margin: 0 0 8px 0;
}

.welcome-text {
  font-size: 16px;
  color: #1f2937;
  margin: 0 0 4px 0;
}

.department-text {
  font-size: 14px;
  color: #7c3aed;
  margin: 0;
  font-weight: 500;
}

.header-actions {
  display: flex;
  gap: 12px;
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

.btn-cerrar-sesion {
  text-transform: none;
  font-size: 14px;
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

.custom-tabs :deep(.q-tabs__content) {
  border: none;
}

.page-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 32px;
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

.btn-nueva-campana {
  background: #7c3aed;
  color: white;
  font-weight: 500;
  padding: 8px 20px;
  border-radius: 8px;
  text-transform: none;
  font-size: 14px;
}

.campaigns-list {
  display: grid;
  gap: 20px;
}

.campaign-card {
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: white;
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(124, 58, 237, 0.1);
    border-color: #7c3aed;
  }
}

.campaign-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.campaign-title-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.campaign-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.campaign-description {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 16px 0;
}

.campaign-info {
  display: flex;
  gap: 24px;
  margin-bottom: 12px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.info-label {
  color: #6b7280;
  font-weight: 500;
}

.info-value {
  color: #1f2937;
}

.campaign-stats {
  display: flex;
  gap: 24px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.stat-item {
  display: flex;
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
</style>
