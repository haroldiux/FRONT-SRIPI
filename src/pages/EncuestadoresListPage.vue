<template>
  <q-page padding>
    <div class="q-pa-md">
      <div class="row items-center q-mb-md">
        <div class="col-12 col-md-8">
          <h1 class="text-h4 q-mb-sm text-primary">Mis encuestas asignadas</h1>
          <p class="text-subtitle1 q-mb-none">Aquí encontrarás todas las encuestas que debes completar</p>
        </div>
        <div class="col-12 col-md-4 q-pt-sm q-pt-md-none">
          <q-input v-model="filter" outlined dense clearable placeholder="Buscar encuestas" class="full-width">
            <template v-slot:append>
              <q-icon name="search" />
            </template>
          </q-input>
        </div>
      </div>

      <!-- Estadísticas -->
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-12 col-md-4">
          <q-card class="stats-card bg-primary text-white">
            <q-card-section>
              <div class="row items-center">
                <div class="col-auto">
                  <q-icon name="assignment" size="3rem" />
                </div>
                <div class="col q-ml-md">
                  <div class="text-h3">{{ totalEncuestas }}</div>
                  <div class="text-subtitle1">Encuestas asignadas</div>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-md-4">
          <q-card class="stats-card bg-positive text-white">
            <q-card-section>
              <div class="row items-center">
                <div class="col-auto">
                  <q-icon name="check_circle" size="3rem" />
                </div>
                <div class="col q-ml-md">
                  <div class="text-h3">{{ totalCompletados }}</div>
                  <div class="text-subtitle1">Encuestas completadas</div>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-md-4">
          <q-card class="stats-card bg-accent text-white">
            <q-card-section>
              <div class="row items-center">
                <div class="col-auto">
                  <q-icon name="pending_actions" size="3rem" />
                </div>
                <div class="col q-ml-md">
                  <div class="text-h3">{{ totalPendientes }}</div>
                  <div class="text-subtitle1">Encuestas pendientes</div>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Filtros adicionales -->
      <div class="row items-center q-mb-md">
        <div class="col-12 col-md-auto q-mb-sm q-mb-md-none">
          <q-select v-model="filtroEstado" :options="opcionesEstado" outlined dense label="Estado" emit-value
            map-options clearable class="q-mr-sm" style="min-width: 150px" />
        </div>
        <div class="col-12 col-md-auto">
          <q-select v-model="ordenarPor" :options="opcionesOrden" outlined dense label="Ordenar por" emit-value
            map-options class="q-mr-sm" style="min-width: 200px" />
        </div>
        <div class="col-12 col-md-grow q-mt-sm q-mt-md-none text-right">
          <q-btn color="primary" icon="refresh" label="Actualizar" @click="cargarAsignaciones" :loading="cargando" />
        </div>
      </div>

      <!-- Loading y sin resultados -->
      <div v-if="cargando" class="full-width text-center q-pa-lg">
        <q-spinner-dots color="primary" size="40px" />
        <div class="text-subtitle1 q-mt-sm">Cargando encuestas...</div>
      </div>

      <div v-else-if="!asignaciones.length" class="text-center q-pa-xl">
        <q-icon name="assignment_turned_in" color="grey-5" size="6rem" />
        <div class="text-h6 text-grey-7 q-mt-md">No tienes encuestas asignadas</div>
        <div class="text-grey-7">Cuando te asignen encuestas aparecerán aquí.</div>
      </div>

      <!-- Lista de encuestas -->
      <div v-else class="row q-col-gutter-md">
        <div v-for="asignacion in asignacionesFiltradas" :key="asignacion.id" class="col-12">
          <q-card class="encuesta-card">
            <q-card-section class="q-py-md">
              <div class="row items-center">
                <!-- Info principal -->
                <div class="col-12 col-md-4">
                  <div class="text-h6 text-primary">{{ asignacion.encuesta.titulo }}</div>
                  <div class="text-subtitle2">
                    <q-chip v-if="asignacion.encuesta.proyecto" dense outline color="secondary" text-color="secondary"
                      icon="folder" class="q-mr-xs">
                      {{ asignacion.encuesta.proyecto.titulo }}
                    </q-chip>
                  </div>
                </div>

                <!-- Progreso -->
                <div class="col-12 col-md-4 q-py-md q-py-md-none">
                  <div class="row items-center">
                    <div class="col-7">
                      <div class="text-subtitle2 q-mb-xs">Progreso:</div>
                      <q-linear-progress :value="getProgreso(asignacion)" :color="getProgresoColor(asignacion)"
                        size="md" rounded />
                    </div>
                    <div class="col-5 text-center">
                      <q-circular-progress :value="getProgreso(asignacion) * 100" size="60px"
                        :color="getProgresoColor(asignacion)" class="q-ma-md" show-value font-size="12px"
                        track-color="grey-3">
                        {{ Math.round(getProgreso(asignacion) * 100) }}%
                      </q-circular-progress>
                    </div>
                  </div>
                  <div class="text-caption text-center q-mt-xs">
                    <strong>{{ getEnviosCount(asignacion) }}</strong> de
                    <strong>{{ asignacion.objetivo }}</strong> encuestas completadas
                  </div>
                </div>

                <!-- Acciones -->
                <div class="col-12 col-md-4 text-right">
                  <div class="row items-center justify-end">
                    <div class="col-12 col-md-auto">
                      <q-badge :color="getEstadoColor(asignacion)" class="q-py-xs q-px-sm" rounded>
                        {{ getEstadoTexto(asignacion) }}
                      </q-badge>
                    </div>
                    <div class="col-12 col-md-auto q-mt-sm q-mt-md-none q-ml-md">
                      <q-btn color="primary" icon="add_task" label="Realizar encuesta"
                        :to="`/encuestadores/encuestar/${asignacion.encuesta.id}`" :disable="!asignacion.estado" />
                      <q-btn color="secondary" icon="history" label="Ver mis envíos" to="/encuestadores/envios" flat />
                    </div>
                  </div>
                </div>
              </div>
            </q-card-section>

            <!-- Detalles adicionales (expandible) -->
            <q-separator />
            <q-expansion-item icon="info" label="Ver detalles" caption="Más información sobre esta encuesta"
              header-class="text-primary" expand-icon-class="text-primary">
              <q-card>
                <q-card-section>
                  <div class="row q-col-gutter-md">
                    <!-- Fechas -->
                    <div class="col-12 col-md-6">
                      <div class="text-subtitle2 text-weight-bold q-mb-xs">Fechas:</div>
                      <div class="q-mb-sm" v-if="asignacion.encuesta.fechaInicio">
                        <q-icon name="event" size="xs" class="q-mr-xs" />
                        <span class="text-caption">Inicio: {{ formatDate(asignacion.encuesta.fechaInicio) }}</span>
                      </div>
                      <div v-if="asignacion.encuesta.fechaFinal">
                        <q-icon name="event" size="xs" class="q-mr-xs" />
                        <span class="text-caption">Fin: {{ formatDate(asignacion.encuesta.fechaFinal) }}</span>
                      </div>
                    </div>

                    <!-- Historial -->
                    <div class="col-12 col-md-6">
                      <div class="text-subtitle2 text-weight-bold q-mb-xs">Última actividad:</div>
                      <div>
                        <q-icon name="schedule" size="xs" class="q-mr-xs" />
                        <span class="text-caption">{{ getUltimoEnvio(asignacion) }}</span>
                      </div>
                    </div>
                  </div>
                </q-card-section>

                <!-- Lista de envíos -->
                <q-separator />
                <q-card-section v-if="getEnviosCount(asignacion) > 0">
                  <div class="text-subtitle2 text-weight-bold q-mb-sm">Historial de envíos:</div>
                  <q-list bordered separator>
                    <q-item v-for="(envio, index) in getUltimosEnvios(asignacion)" :key="index" clickable>
                      <q-item-section avatar>
                        <q-icon name="check_circle" color="positive" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label>Envío #{{ envio.id }}</q-item-label>
                        <q-item-label caption>{{ formatDateTime(envio.created_at) }}</q-item-label>
                      </q-item-section>
                      <q-item-section side>
                        <q-btn flat round icon="visibility" color="primary" :to="`/encuestadores/envio/${envio.id}`" />
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-card-section>

                <q-card-section v-else class="text-center text-grey">
                  <q-icon name="task" size="2rem" />
                  <div class="q-mt-sm">Aún no hay envíos registrados para esta encuesta</div>
                </q-card-section>
              </q-card>
            </q-expansion-item>
          </q-card>
        </div>
      </div>

      <!-- Paginación -->
      <div class="row justify-center q-mt-lg" v-if="totalPages > 1">
        <q-pagination v-model="currentPage" :max="totalPages" direction-links boundary-links
          @update:model-value="cargarAsignaciones" />
      </div>
    </div>
  </q-page>
</template>

<script>
import { defineComponent, ref, computed, onMounted } from 'vue';
import { api } from 'boot/axios';
import { useQuasar } from 'quasar';
import { date } from 'quasar';

export default defineComponent({
  name: 'EncuestadoresListPage',

  setup() {
    const $q = useQuasar();
    const asignaciones = ref([]);
    const cargando = ref(false);
    const filter = ref('');
    const currentPage = ref(1);
    const totalPages = ref(1);
    const filtroEstado = ref(null);
    const ordenarPor = ref('recientes');

    // Mock data para los envíos (en producción, esto vendría de la API)
    const enviosPorAsignacion = ref({});

    const opcionesEstado = [
      { label: 'Activas', value: 'activas' },
      { label: 'Completadas', value: 'completadas' },
      { label: 'Pendientes', value: 'pendientes' }
    ];

    const opcionesOrden = [
      { label: 'Más recientes', value: 'recientes' },
      { label: 'Más antiguas', value: 'antiguas' },
      { label: 'Mayor progreso', value: 'progreso' },
      { label: 'Menor progreso', value: 'pendientes' }
    ];

    // Estadísticas calculadas
    const totalEncuestas = computed(() => asignaciones.value.length);

    const totalCompletados = computed(() => {
      return asignaciones.value.filter(a => {
        const completados = getEnviosCount(a);
        return completados >= a.objetivo;
      }).length;
    });

    const totalPendientes = computed(() => {
      return asignaciones.value.filter(a => {
        const completados = getEnviosCount(a);
        return completados < a.objetivo;
      }).length;
    });

    // Filtrado de asignaciones
    const asignacionesFiltradas = computed(() => {
      let resultado = asignaciones.value;

      // Filtro por texto
      if (filter.value) {
        const searchTerm = filter.value.toLowerCase();
        resultado = resultado.filter(a =>
          a.encuesta.titulo.toLowerCase().includes(searchTerm) ||
          (a.encuesta.proyecto && a.encuesta.proyecto.titulo.toLowerCase().includes(searchTerm))
        );
      }

      // Filtro por estado
      if (filtroEstado.value) {
        switch (filtroEstado.value) {
          case 'activas':
            resultado = resultado.filter(a => a.estado);
            break;
          case 'completadas':
            resultado = resultado.filter(a => getEnviosCount(a) >= a.objetivo);
            break;
          case 'pendientes':
            resultado = resultado.filter(a => getEnviosCount(a) < a.objetivo);
            break;
        }
      }

      // Ordenamiento
      resultado = [...resultado].sort((a, b) => {
        switch (ordenarPor.value) {
          case 'antiguas':
            return new Date(a.created_at) - new Date(b.created_at);
          case 'progreso':
            return getProgreso(b) - getProgreso(a);
          case 'pendientes':
            return getProgreso(a) - getProgreso(b);
          case 'recientes':
          default:
            return new Date(b.created_at) - new Date(a.created_at);
        }
      });

      return resultado;
    });

    // Cargar asignaciones desde la API
    const cargarAsignaciones = async () => {
      cargando.value = true;
      try {
        // Obtener todas las asignaciones del usuario actual
        const response = await api.get('/asignaciones', {
          params: {
            usuario_id: getUserId(),
            per_page: 100, // Podemos ajustar según necesidad
            page: currentPage.value
          }
        });

        asignaciones.value = response.data.data;
        totalPages.value = Math.ceil(response.data.total / response.data.per_page);

        // Cargar envíos para cada asignación
        await Promise.all(asignaciones.value.map(async (asignacion) => {
          await cargarEnvios(asignacion);
        }));

      } catch (error) {
        console.error('Error al cargar asignaciones:', error);
        $q.notify({
          color: 'negative',
          message: 'Error al cargar encuestas asignadas',
          icon: 'error'
        });
      } finally {
        cargando.value = false;
      }
    };

    // Cargar envíos de una asignación específica
    const cargarEnvios = async (asignacion) => {
      try {
        const response = await api.get('/envios', {
          params: {
            encuesta_id: asignacion.encuesta_id,
            usuario_id: getUserId()
          }
        });

        enviosPorAsignacion.value[asignacion.id] = response.data.data;
      } catch (error) {
        console.error(`Error al cargar envíos para la asignación ${asignacion.id}:`, error);
        enviosPorAsignacion.value[asignacion.id] = [];
      }
    };

    // Obtener el ID del usuario actual desde localStorage
    const getUserId = () => {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.id;
    };

    // Calcular el progreso de una asignación
    const getProgreso = (asignacion) => {
      const completados = getEnviosCount(asignacion);
      const objetivo = asignacion.objetivo || 1;
      return Math.min(completados / objetivo, 1);
    };

    // Obtener color según el progreso
    const getProgresoColor = (asignacion) => {
      const progreso = getProgreso(asignacion);
      if (progreso >= 1) return 'positive';
      if (progreso >= 0.7) return 'accent';
      if (progreso >= 0.3) return 'warning';
      return 'negative';
    };

    // Obtener estado textual
    const getEstadoTexto = (asignacion) => {
      if (!asignacion.estado) return 'Inactiva';
      const progreso = getProgreso(asignacion);
      if (progreso >= 1) return 'Completada';
      if (progreso > 0) return 'En proceso';
      return 'Pendiente';
    };

    // Obtener color del estado
    const getEstadoColor = (asignacion) => {
      if (!asignacion.estado) return 'grey';
      const progreso = getProgreso(asignacion);
      if (progreso >= 1) return 'positive';
      if (progreso > 0) return 'warning';
      return 'blue';
    };

    // Obtener cantidad de envíos realizados
    const getEnviosCount = (asignacion) => {
      const envios = enviosPorAsignacion.value[asignacion.id] || [];
      return envios.length;
    };

    // Obtener los últimos envíos (para mostrar en el historial)
    const getUltimosEnvios = (asignacion) => {
      const envios = enviosPorAsignacion.value[asignacion.id] || [];
      return envios.slice(0, 5); // Mostrar los últimos 5 envíos
    };

    // Obtener fecha del último envío
    const getUltimoEnvio = (asignacion) => {
      const envios = enviosPorAsignacion.value[asignacion.id] || [];
      if (envios.length === 0) return 'Sin actividad';

      // Ordenar por fecha y obtener el último
      const ultimoEnvio = [...envios].sort((a, b) => {
        return new Date(b.created_at) - new Date(a.created_at);
      })[0];

      return formatDateTime(ultimoEnvio.created_at);
    };

    // Formatear fecha
    const formatDate = (dateStr) => {
      if (!dateStr) return 'No especificada';
      return date.formatDate(dateStr, 'DD/MM/YYYY');
    };

    // Formatear fecha y hora
    const formatDateTime = (dateStr) => {
      if (!dateStr) return 'No especificada';
      return date.formatDate(dateStr, 'DD/MM/YYYY HH:mm');
    };

    onMounted(() => {
      cargarAsignaciones();
    });

    return {
      asignaciones,
      asignacionesFiltradas,
      cargando,
      filter,
      currentPage,
      totalPages,
      filtroEstado,
      opcionesEstado,
      ordenarPor,
      opcionesOrden,
      totalEncuestas,
      totalCompletados,
      totalPendientes,

      cargarAsignaciones,
      getProgreso,
      getProgresoColor,
      getEstadoTexto,
      getEstadoColor,
      getEnviosCount,
      getUltimosEnvios,
      getUltimoEnvio,
      formatDate,
      formatDateTime
    };
  }
});
</script>

<style lang="scss" scoped>
.stats-card {
  transition: all 0.3s;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  }
}

.encuesta-card {
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 8px 12px rgba(0, 0, 0, 0.1);
  }
}

// Animación para los elementos cargados
.encuesta-card {
  animation: fade-in 0.5s ease-in-out;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// Estilización avanzada
.text-primary {
  font-weight: 500;
}

// Ajustes responsive
@media (max-width: 767px) {
  .text-right {
    text-align: left;
    margin-top: 10px;
  }
}
</style>
