<template>
  <q-page class="q-pa-md project-detail">

    <!-- Header -->
    <div class="row items-center q-mb-md">
      <div class="col-auto">
        <q-btn flat icon="arrow_back" label="Volver a Proyectos" :to="{ name: 'proyectos.list' }" />
      </div>
      <div class="col text-right">
        <q-btn color="purple-6" icon="add" label="Nueva Encuesta" class="q-ml-sm" @click="NuevaEncuesta" />
        <q-btn color="purple-6" icon="file_download" label="Exportar Datos" class="q-ml-sm" @click="exportar" />
      </div>
    </div>

    <!-- Title + meta -->
    <div class="q-mb-lg">
      <div class="row items-center q-gutter-sm q-mb-sm">
        <div class="text-h5">{{ proyecto.title }}</div>
        <q-badge color="purple-6" class="q-ml-sm" outline>{{ proyecto.statusLabel }}</q-badge>
      </div>
      <div class="text-body2 text-grey-9 q-mb-md">
        Es un estudio <span class="text-italic">para x.. zona</span>
      </div>

      <div class="row items-center text-grey-8 q-col-gutter-md">
        <div class="col-auto"><q-icon name="place" class="q-mr-xs" /> {{ proyecto.location || 'Cercado' }}</div>
        <div class="col-auto">Zona: {{ proyecto.zone || 'Norte' }}</div>
        <div class="col-auto"><q-icon name="event" class="q-mr-xs" /> {{ rangoFechas }}</div>
      </div>
    </div>

    <!-- KPIs -->
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-12 col-md-3">
        <KpiCard title="Total Encuestas" :value="kpis.totalEncuestas" subtitle="2 activas" icon="show_chart" />
      </div>
      <div class="col-12 col-md-3">
        <KpiCard title="Total Respuestas" :value="kpis.totalRespuestas" subtitle="45 promedio por encuesta"
          icon="groups" />
      </div>
      <div class="col-12 col-md-3">
        <KpiCard title="MDAS Promedio" :value="kpis.mdasPromedio" subtitle="Ansiedad moderada-baja" icon="trending_up"
          value-class="text-positive" />
      </div>
      <div class="col-12 col-md-3">
        <KpiCard title="Tasa Completación" value="92%" subtitle="Excelente participación" icon="insert_chart"
          value-class="text-orange-7" />
      </div>
    </div>

    <!-- Tabs -->
    <q-card flat bordered class="q-mb-lg rounded-12">
      <q-tabs v-model="tab" active-color="primary" indicator-color="primary" class="bg-white text-dark tabs-soft" dense>
        <q-tab name="encuestas" label="Encuestas" icon="auto_graph" />
        <q-tab name="analisis" label="Análisis" icon="bar_chart" />
        <q-tab name="geografico" label="Geográfico" icon="place" />
      </q-tabs>

      <q-separator />

      <q-tab-panels v-model="tab" animated>
        <!-- Panel: Encuestas -->
        <q-tab-panel name="encuestas" class="q-pa-lg">
          <div class="text-subtitle1 q-mb-xs">Encuestas de la Campaña</div>
          <div class="text-caption text-grey-7 q-mb-md">
            Todas las encuestas asociadas a esta campaña de investigación
          </div>

          <div class="column q-gutter-md">
            <q-card v-for="enc in encuestas" :key="enc.id" flat bordered class="q-pa-md encuesta-item">
              <div class="row items-start justify-between">
                <div class="col">
                  <div class="row items-center q-gutter-sm q-mb-xs">
                    <q-avatar size="28px" color="purple-1" text-color="purple-8" icon="show_chart" />
                    <div class="text-subtitle1">{{ enc.titulo }}</div>
                  </div>

                  <q-badge v-if="enc.activa" color="purple-6" outline class="q-mb-sm">Activa</q-badge>

                  <div class="text-body2 q-mb-sm">
                    {{ enc.descripcion }}
                  </div>

                  <div class="row text-grey-8 q-col-gutter-lg">
                    <div class="col-auto"><q-icon name="quiz" class="q-mr-xs" /> {{ enc.respuestas }} respuestas</div>
                    <div class="col-auto"><q-icon name="trending_up" class="q-mr-xs" /> MDAS: {{ enc.mdas }}</div>
                    <div class="col-auto"><q-icon name="insights" class="q-mr-xs" /> {{ enc.completitud }}% completación
                    </div>
                    <div class="col-auto"><q-icon name="event" class="q-mr-xs" /> {{ enc.fecha }}</div>
                  </div>
                </div>

                <div class="col-auto">
                  <q-btn outline color="grey-8" icon="visibility" label="Ver Estadísticas" size="sm" class="q-mb-sm" />
                </div>
              </div>
            </q-card>
          </div>
        </q-tab-panel>

        <!-- Panel: Análisis (placeholder) -->
        <q-tab-panel name="analisis" class="q-pa-lg">
          <q-banner class="bg-grey-2 text-grey-9 rounded-12">
            <q-icon name="insights" size="28px" class="q-mr-md" />
            Aquí irán los gráficos y análisis (MDAS por pregunta, series temporales, etc.).
          </q-banner>
        </q-tab-panel>

        <!-- Panel: Geográfico (placeholder) -->
        <q-tab-panel name="geografico" class="q-pa-lg">
          <q-banner class="bg-grey-2 text-grey-9 rounded-12">
            <q-icon name="map" size="28px" class="q-mr-md" />
            Aquí irá el mapa con distribución geográfica de respuestas.
          </q-banner>
        </q-tab-panel>
      </q-tab-panels>
    </q-card>

    <!-- Dialog crear encuesta -->
    <!-- :key garantiza que el formulario se reinicie cada vez que abres -->
    <EncuestaFormDialog :key="dialogKey" v-model="openEncuesta" :proyecto-id="proyecto.id" @save="onEncuestaSave" />
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, defineAsyncComponent } from 'vue'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { db } from 'src/services/mock'

// 🔹 Carga perezosa del diálogo (mejor performance)
const EncuestaFormDialog = defineAsyncComponent(() =>
  import('src/components/encuestadores/EncuestaFormDialog.vue')
)

const $q = useQuasar()

/** ---- mock proyecto ---- **/
const route = useRoute()
const proyecto = ref({
  id: null, title: '', code: '', status: 'finalizada', statusLabel: 'Finalizada',
  start_date: '2025-09-28', end_date: '2025-09-29', location: 'Cercado', zone: 'Norte',
  summary: 'Es un estudio para x.. zona'
})
onMounted(() => {
  const p = db?.proyectos?.find(p => p.id === Number(route.params.id))
  if (p) {
    proyecto.value = {
      ...proyecto.value,
      ...p,
      statusLabel: p.status === 'activo' ? 'Activa' : 'Finalizada'
    }
  }
})

/** ---- KPIs mock ---- **/
const kpis = ref({
  totalEncuestas: 3,
  totalRespuestas: 135,
  mdasPromedio: 2.31
})

/** ---- encuestas mock ---- **/
const encuestas = ref([
  {
    id: 1,
    titulo: 'MDAS - Evaluación Pre-tratamiento',
    descripcion: 'Encuesta para evaluar el nivel de ansiedad dental antes del tratamiento',
    activa: true,
    respuestas: 45,
    mdas: 2.3,
    completitud: 94.2,
    fecha: '14/2/2024'
  },
  {
    id: 2,
    titulo: 'MDAS - Seguimiento 1',
    descripcion: 'Seguimiento post intervención',
    activa: false,
    respuestas: 50,
    mdas: 2.4,
    completitud: 90.1,
    fecha: '20/3/2024'
  }
])

const tab = ref('encuestas')
const openEncuesta = ref(false)
const dialogKey = ref(0) // 👉 forzamos refresco del componente al abrir

const rangoFechas = computed(() => {
  const s = proyecto.value.start_date?.split('-').reverse().join('/') || ''
  const e = proyecto.value.end_date?.split('-').reverse().join('/') || ''
  return `${s} - ${e}`
})

function NuevaEncuesta() {
  // Reinicia el formulario del diálogo cada vez que abres
  dialogKey.value++
  openEncuesta.value = true
}

function exportar() {
  // placeholder para exportación
  console.log('Exportar datos del proyecto', proyecto.value.id)
}

function onEncuestaSave(nueva) {
  // Actualiza lista mock y KPIs
  encuestas.value.unshift({
    id: nueva.id,
    titulo: nueva.titulo || 'Encuesta nueva',
    descripcion: nueva.descripcion || '—',
    activa: true,
    respuestas: 0,
    mdas: 0,
    completitud: 0,
    fecha: new Date().toLocaleDateString()
  })
  kpis.value.totalEncuestas = encuestas.value.length

  // UX: volver a la pestaña de Encuestas y notificar
  tab.value = 'encuestas'
  $q.notify({ type: 'positive', message: 'Encuesta creada', position: 'top' })
}
</script>

<!-- Kpi card inline (puedes moverlo a components/common si lo reutilizas) -->
<script>
export default {
  components: {
    KpiCard: {
      props: { title: String, value: [String, Number], subtitle: String, icon: String, valueClass: String },
      template: `
      <q-card flat bordered class="q-pa-md rounded-12 kpi-card">
        <div class="row items-center justify-between q-mb-sm">
          <div class="text-caption text-grey-7">{{ title }}</div>
          <q-icon :name="icon" />
        </div>
        <div :class="['text-h5', valueClass]">{{ value }}</div>
        <div class="text-caption text-grey-6 q-mt-xs">{{ subtitle }}</div>
      </q-card>`
    }
  }
}
</script>

<style scoped>
.project-detail :deep(.rounded-12) {
  border-radius: 12px;
}

.kpi-card {
  background: #fff;
}

.tabs-soft {
  border-radius: 12px 12px 0 0;
}

.encuesta-item {
  background: #fffdfc;
  border-radius: 12px;
}
</style>
