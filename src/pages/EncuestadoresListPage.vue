<template>
  <q-page padding class="encuestadores-page">
    <div class="q-pa-md">
      <!-- Cabecera con efecto de gradiente -->
      <div class="header-container q-mb-lg">
        <div class="row items-center">
          <div class="col-12 col-md-8">
            <h1 class="page-title text-h4 q-mb-sm">Mis encuestas asignadas</h1>
            <p class="text-subtitle1 q-mb-none subtitle-text">Aquí encontrarás todas las encuestas que debes completar</p>
          </div>
          <div class="col-12 col-md-4 q-pt-sm q-pt-md-none">
            <q-input
              v-model="filter"
              outlined
              dense
              clearable
              placeholder="Buscar encuestas"
              class="search-input"
            >
              <template v-slot:prepend>
                <q-icon name="search" color="primary" />
              </template>
            </q-input>
          </div>
        </div>
      </div>

      <!-- Estadísticas con tarjetas mejoradas -->
      <div class="row q-col-gutter-md q-mb-lg">
        <div class="col-12 col-md-4">
          <q-card class="stats-card total-card">
            <q-card-section>
              <div class="row items-center">
                <div class="col-auto stats-icon-container">
                  <q-icon name="assignment" size="3rem" color="primary" />
                </div>
                <div class="col q-ml-md">
                  <div class="text-h3 stats-number">{{ totalEncuestas }}</div>
                  <div class="text-subtitle1 stats-label">Encuestas asignadas</div>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-md-4">
          <q-card class="stats-card completed-card">
            <q-card-section>
              <div class="row items-center">
                <div class="col-auto stats-icon-container">
                  <q-icon name="check_circle" size="3rem" color="secondary" />
                </div>
                <div class="col q-ml-md">
                  <div class="text-h3 stats-number">{{ totalCompletados }}</div>
                  <div class="text-subtitle1 stats-label">Encuestas completadas</div>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-md-4">
          <q-card class="stats-card pending-card">
            <q-card-section>
              <div class="row items-center">
                <div class="col-auto stats-icon-container">
                  <q-icon name="pending_actions" size="3rem" color="accent" />
                </div>
                <div class="col q-ml-md">
                  <div class="text-h3 stats-number">{{ totalPendientes }}</div>
                  <div class="text-subtitle1 stats-label">Encuestas pendientes</div>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Panel de filtros con diseño atractivo -->
      <q-card class="filter-panel q-mb-md">
        <q-card-section class="q-pa-md">
          <div class="row items-center q-col-gutter-md">
            <!-- Filtro de estado -->
            <div class="col-12 col-sm-6 col-md">
              <q-select
                v-model="filtroEstado"
                :options="opcionesEstado"
                outlined
                dense
                label="Estado"
                emit-value
                map-options
                clearable
                class="filter-select"
              >
                <template v-slot:prepend>
                  <q-icon name="filter_list" color="secondary" />
                </template>
                <template v-slot:no-option>
                  <div class="text-center q-pa-sm">No hay opciones disponibles</div>
                </template>
              </q-select>
            </div>

            <!-- Ordenar por -->
            <div class="col-12 col-sm-6 col-md">
              <q-select
                v-model="ordenarPor"
                :options="opcionesOrden"
                outlined
                dense
                label="Ordenar por"
                emit-value
                map-options
                class="filter-select"
              >
                <template v-slot:prepend>
                  <q-icon name="sort" color="secondary" />
                </template>
                <template v-slot:no-option>
                  <div class="text-center q-pa-sm">No hay opciones disponibles</div>
                </template>
              </q-select>
            </div>

            <!-- Botón de actualizar -->
            <div class="col-12 col-sm-12 col-md-auto text-center text-md-right">
              <q-btn
                color="primary"
                icon="refresh"
                label="Actualizar"
                @click="cargarAsignaciones"
                :loading="cargando"
                class="update-btn"
              >
                <q-tooltip>Actualizar lista de encuestas</q-tooltip>
              </q-btn>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Estado de carga -->
      <transition
        enter-active-class="animated fadeIn"
        leave-active-class="animated fadeOut"
        mode="out-in"
      >
        <div v-if="cargando" class="loader-container q-pa-xl">
          <div class="column items-center">
            <q-spinner-dots color="primary" size="60px" />
            <div class="text-subtitle1 q-mt-md">Cargando encuestas...</div>
          </div>
        </div>

        <!-- Sin resultados -->
        <div v-else-if="!asignaciones.length" class="empty-state q-pa-xl">
          <div class="column items-center">
            <q-icon name="assignment_turned_in" size="80px" class="empty-icon" />
            <div class="text-h6 q-mt-md empty-title">No tienes encuestas asignadas</div>
            <div class="empty-subtitle q-mt-sm">
              Cuando te asignen encuestas aparecerán aquí.
            </div>
          </div>
        </div>

        <!-- Lista de encuestas -->
        <div v-else class="encuestas-container">
          <transition-group
            name="list"
            tag="div"
            class="row q-col-gutter-md"
          >
            <div v-for="(asignacion, index) in asignacionesFiltradas" :key="asignacion.id" class="col-12"
                :style="{ animationDelay: `${index * 0.05}s` }">
              <q-card class="encuesta-card" :class="{'completed-border': getProgreso(asignacion) >= 1, 'inactive-border': !asignacion.estado}">
                <div class="status-indicator" :class="getEstadoClass(asignacion)"></div>
                <q-card-section>
                  <div class="row items-start q-col-gutter-md">
                    <!-- Información principal -->
                    <div class="col-12 col-md-4">
                      <div class="text-h6 encuesta-title">
                        <q-icon name="assignment" color="primary" size="sm" class="q-mr-xs" />
                        {{ asignacion.encuesta.titulo }}
                      </div>
                      <div class="text-subtitle2" v-if="asignacion.encuesta.proyecto">
                        <q-chip dense outline color="secondary" text-color="secondary"
                          icon="folder" class="project-chip">
                          {{ asignacion.encuesta.proyecto.titulo }}
                        </q-chip>
                      </div>
                    </div>

                    <!-- Progreso -->
                    <div class="col-12 col-md-4">
                      <div class="progress-container">
                        <div class="row items-center">
                          <div class="col-8">
                            <div class="text-subtitle2 q-mb-xs progress-label">Progreso:</div>
                            <q-linear-progress
                              :value="getProgreso(asignacion)"
                              :color="getProgresoColor(asignacion)"
                              size="md"
                              rounded
                              class="custom-progress"
                            />
                          </div>
                          <div class="col-4 text-center">
                            <q-circular-progress
                              :value="getProgreso(asignacion) * 100"
                              size="60px"
                              :color="getProgresoColor(asignacion)"
                              class="q-ma-md custom-circular-progress"
                              show-value
                              font-size="12px"
                              track-color="grey-3">
                              {{ Math.round(getProgreso(asignacion) * 100) }}%
                            </q-circular-progress>
                          </div>
                        </div>
                        <div class="text-caption text-center q-mt-xs progress-count">
                          <strong>{{ getEnviosCount(asignacion) }}</strong> de
                          <strong>{{ asignacion.objetivo }}</strong> encuestas completadas
                        </div>
                      </div>
                    </div>

                    <!-- Acciones -->
                    <div class="col-12 col-md-4">
                      <div class="actions-container">
                        <div class="row items-center justify-end">
                          <div class="col-12 col-md-auto">
                            <q-badge
                              :color="getEstadoColor(asignacion)"
                              class="q-py-xs q-px-sm status-badge"
                              rounded
                            >
                              {{ getEstadoTexto(asignacion) }}
                            </q-badge>
                          </div>
                          <div class="col-12 col-md-auto q-mt-sm q-mt-md-none q-ml-md">
                            <q-btn
                              color="primary"
                              icon="add_task"
                              label="Realizar encuesta"
                              :to="`/encuestadores/encuestar/${asignacion.encuesta.id}`"
                              :disable="!asignacion.estado"
                              class="action-btn"
                            />
                            <q-btn
                              color="secondary"
                              icon="history"
                              label="Ver mis envíos"
                              to="/encuestadores/envios"
                              flat
                              class="history-btn"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </q-card-section>

                <!-- Detalles adicionales (expandible) -->
                <q-separator />
                <q-expansion-item
                  icon="info"
                  label="Ver detalles"
                  caption="Más información sobre esta encuesta"
                  header-class="details-header"
                  expand-icon-class="text-primary"
                >
                  <q-card class="details-card">
                    <q-card-section>
                      <div class="row q-col-gutter-md">
                        <!-- Fechas -->
                        <div class="col-12 col-md-6">
                          <div class="text-subtitle2 text-weight-bold q-mb-xs details-title">Fechas:</div>
                          <div class="q-mb-sm date-info" v-if="asignacion.encuesta.fechaInicio">
                            <q-icon name="event" size="xs" class="q-mr-xs" color="primary" />
                            <span class="text-caption">Inicio: {{ formatDate(asignacion.encuesta.fechaInicio) }}</span>
                          </div>
                          <div class="date-info" v-if="asignacion.encuesta.fechaFinal">
                            <q-icon name="event" size="xs" class="q-mr-xs" color="primary" />
                            <span class="text-caption">Fin: {{ formatDate(asignacion.encuesta.fechaFinal) }}</span>
                          </div>
                        </div>

                        <!-- Historial -->
                        <div class="col-12 col-md-6">
                          <div class="text-subtitle2 text-weight-bold q-mb-xs details-title">Última actividad:</div>
                          <div class="activity-info">
                            <q-icon name="schedule" size="xs" class="q-mr-xs" color="secondary" />
                            <span class="text-caption">{{ getUltimoEnvio(asignacion) }}</span>
                          </div>
                        </div>
                      </div>
                    </q-card-section>

                    <!-- Lista de envíos -->
                    <q-separator />
                    <q-card-section v-if="getEnviosCount(asignacion) > 0">
                      <div class="text-subtitle2 text-weight-bold q-mb-sm details-title">Historial de envíos:</div>
                      <q-list bordered separator class="history-list">
                        <q-item v-for="(envio, index) in getUltimosEnvios(asignacion)" :key="index" clickable class="history-item">
                          <q-item-section avatar>
                            <q-icon name="check_circle" color="secondary" />
                          </q-item-section>
                          <q-item-section>
                            <q-item-label class="history-label">Envío #{{ envio.id }}</q-item-label>
                            <q-item-label caption>{{ formatDateTime(envio.created_at) }}</q-item-label>
                          </q-item-section>
                          <q-item-section side>
                            <q-btn flat round icon="visibility" color="primary" :to="`/encuestadores/envio/${envio.id}`" class="view-btn">
                              <q-tooltip>Ver detalles del envío</q-tooltip>
                            </q-btn>
                          </q-item-section>
                        </q-item>
                      </q-list>
                    </q-card-section>

                    <q-card-section v-else class="text-center text-grey no-history">
                      <q-icon name="task" size="2rem" color="grey-5" />
                      <div class="q-mt-sm">Aún no hay envíos registrados para esta encuesta</div>
                    </q-card-section>
                  </q-card>
                </q-expansion-item>
              </q-card>
            </div>
          </transition-group>

          <!-- Paginación mejorada -->
          <div class="row justify-center q-mt-xl" v-if="totalPages > 1">
            <q-pagination
              v-model="currentPage"
              :max="totalPages"
              :max-pages="6"
              direction-links
              boundary-links
              color="primary"
              active-color="primary"
              active-text-color="white"
              class="pagination-custom"
              @update:model-value="cargarAsignaciones"
            >
              <template v-slot:prev="slotProps">
                <q-btn v-bind="slotProps" icon="chevron_left" flat round dense color="primary" />
              </template>
              <template v-slot:next="slotProps">
                <q-btn v-bind="slotProps" icon="chevron_right" flat round dense color="primary" />
              </template>
            </q-pagination>
          </div>
        </div>
      </transition>
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
      { label: 'Activas', value: 'activas', icon: 'toggle_on' },
      { label: 'Completadas', value: 'completadas', icon: 'task_alt' },
      { label: 'Pendientes', value: 'pendientes', icon: 'hourglass_empty' }
    ];

    const opcionesOrden = [
      { label: 'Más recientes', value: 'recientes', icon: 'arrow_downward' },
      { label: 'Más antiguas', value: 'antiguas', icon: 'arrow_upward' },
      { label: 'Mayor progreso', value: 'progreso', icon: 'trending_up' },
      { label: 'Menor progreso', value: 'pendientes', icon: 'trending_down' }
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

        // Notificar éxito con animación
        if (asignaciones.value.length === 0) {
          $q.notify({
            type: 'info',
            message: 'No se encontraron encuestas asignadas',
            position: 'top',
            progress: true,
            timeout: 2000,
            classes: 'notification-custom'
          });
        }

      } catch (error) {
        console.error('Error al cargar asignaciones:', error);
        $q.notify({
          type: 'negative',
          message: 'Error al cargar encuestas asignadas',
          position: 'top',
          timeout: 3000,
          progress: true,
          classes: 'notification-custom'
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
      if (progreso >= 1) return 'secondary';
      if (progreso >= 0.7) return 'accent';
      if (progreso >= 0.3) return 'warning';
      return 'negative';
    };

    // Obtener clase de estado para el indicador lateral
    const getEstadoClass = (asignacion) => {
      if (!asignacion.estado) return 'status-inactive';
      const progreso = getProgreso(asignacion);
      if (progreso >= 1) return 'status-completed';
      if (progreso > 0) return 'status-in-progress';
      return 'status-pending';
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
      if (progreso >= 1) return 'secondary';
      if (progreso > 0) return 'warning';
      return 'primary';
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

      const fechaObj = new Date(dateStr);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      const ayer = new Date(hoy);
      ayer.setDate(hoy.getDate() - 1);

      // Si es hoy
      if (fechaObj >= hoy) {
        return `Hoy, ${date.formatDate(dateStr, 'HH:mm')}`;
      }
      // Si es ayer
      if (fechaObj >= ayer) {
        return `Ayer, ${date.formatDate(dateStr, 'HH:mm')}`;
      }

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
      getEstadoClass,
      getEnviosCount,
      getUltimosEnvios,
      getUltimoEnvio,
      formatDate,
      formatDateTime
    };
  }
});
</script>

<style lang="scss">
/* Definición de colores */
:root {
  --color-primary: #663399;
  --color-secondary: #009999;
  --color-accent: #00AAAA;
  --color-background: #FFFFFF;
  --color-light-bg: #F5F7FA;
  --color-border: #E2E8F0;
  --color-text: #2D3748;
  --color-text-light: #718096;
  --color-success: #38A169;
  --color-warning: #ECC94B;
  --color-danger: #E53E3E;
  --card-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
}

/* Estilos globales */
.encuestadores-page {
  background-color: var(--color-light-bg);
  min-height: 100vh;
}

/* Cabecera con gradiente */
.header-container {
  padding: 24px;
  background: linear-gradient(to right, rgba(102, 51, 153, 0.1), rgba(0, 153, 153, 0.1));
  border-radius: 12px;
  margin-bottom: 24px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(45deg,
      rgba(102, 51, 153, 0.05) 25%,
      transparent 25%,
      transparent 50%,
      rgba(0, 153, 153, 0.05) 50%,
      rgba(0, 153, 153, 0.05) 75%,
      transparent 75%);
    background-size: 60px 60px;
    opacity: 0.5;
    z-index: 0;
  }

  .page-title {
    color: var(--color-primary);
    font-weight: 600;
    position: relative;
    z-index: 1;
  }

  .subtitle-text {
    color: var(--color-text-light);
    position: relative;
    z-index: 1;
  }
}

/* Barra de búsqueda */
.search-input {
  border-radius: 25px;

  :deep(.q-field__control) {
    border-radius: 25px;
    background-color: rgba(255, 255, 255, 0.8);
    transition: all 0.3s ease;
  }

  :deep(.q-field__control:hover) {
    background-color: white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  :deep(.q-field--focused .q-field__control) {
    box-shadow: 0 0 0 2px var(--color-primary);
  }
}

/* Panel de filtros */
.filter-panel {
  border-radius: 12px;
  background-color: white;
  box-shadow: var(--card-shadow);
  transition: box-shadow 0.3s ease;
  overflow: hidden;
  border-top: 4px solid var(--color-secondary);

  &:hover {
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
  }
}

.filter-select {
  :deep(.q-field__control) {
    border-radius: 8px;
    transition: all 0.3s ease;
  }

  :deep(.q-field--focused .q-field__control) {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px rgba(102, 51, 153, 0.2);
  }
}

/* Botón de actualizar */
.update-btn {
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  border-radius: 25px;
  padding: 8px 20px;
  font-weight: 500;
  letter-spacing: 0.5px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 15px rgba(102, 51, 153, 0.3);
  }

  &:active {
    transform: translateY(0);
  }
}

/* Tarjetas estadísticas */
.stats-card {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.4s ease;
  box-shadow: var(--card-shadow);
  background-color: white;

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.15);

    .stats-icon-container {
      transform: scale(1.1);
    }
  }

  .stats-icon-container {
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    width: 70px;
    height: 70px;
    background-color: rgba(255, 255, 255, 0.15);
    transition: transform 0.4s ease;
  }

  .stats-number {
    font-weight: 700;
    letter-spacing: -1px;
    color: var(--color-primary);
    margin-bottom: 0;
  }

  .stats-label {
    color: var(--color-text-light);
    font-weight: 500;
  }
}

/* Personalización de tarjetas de estadísticas */
.total-card {
  border-left: 6px solid var(--color-primary);

  .stats-icon-container {
    background-color: rgba(102, 51, 153, 0.1);
  }
}

.completed-card {
  border-left: 6px solid var(--color-secondary);

  .stats-icon-container {
    background-color: rgba(0, 153, 153, 0.1);
  }
}

.pending-card {
  border-left: 6px solid var(--color-accent);

  .stats-icon-container {
    background-color: rgba(0, 170, 170, 0.1);
  }
}

/* Estado de carga */
.loader-container {
  text-align: center;
  padding: 60px 0;
  background-color: white;
  border-radius: 12px;
  box-shadow: var(--card-shadow);
  opacity: 0;
  animation: fadeIn 0.5s ease forwards;
  border: 1px solid var(--color-border);
}

/* Estado vacío */
.empty-state {
  text-align: center;
  padding: 60px 0;
  background-color: white;
  border-radius: 12px;
  box-shadow: var(--card-shadow);
  opacity: 0;
  animation: fadeIn 0.5s ease forwards;
  border: 1px solid var(--color-border);

  .empty-icon {
    color: rgba(102, 51, 153, 0.3);
    opacity: 0.7;
  }

  .empty-title {
    color: var(--color-text);
    font-weight: 600;
  }

  .empty-subtitle {
    color: var(--color-text-light);
    max-width: 500px;
    margin: 0 auto;
  }
}

/* Contenedor de encuestas */
.encuestas-container {
  opacity: 0;
  animation: fadeIn 0.5s ease forwards 0.1s;
}

/* Tarjetas de encuestas */
.encuesta-card {
  position: relative;
  border-radius: 12px;
  box-shadow: var(--card-shadow);
  transition: all 0.3s ease;
  overflow: hidden;
  border: 1px solid var(--color-border);
  opacity: 0;
  animation: slideInUp 0.5s ease forwards;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);

    .status-indicator {
      opacity: 1;
    }
  }

  .status-indicator {
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    opacity: 0.7;
    transition: opacity 0.3s ease;
  }

  .status-completed {
    background: linear-gradient(to bottom, var(--color-secondary), #20A4A4);
  }

  .status-in-progress {
    background: linear-gradient(to bottom, #F6B93B, #F78C2A);
  }

  .status-pending {
    background: linear-gradient(to bottom, var(--color-primary), #9053c7);
  }

  .status-inactive {
    background: linear-gradient(to bottom, #B0BEC5, #78909C);
  }

  &.completed-border {
    border-top: 3px solid var(--color-secondary);
  }

  &.inactive-border {
    border-top: 3px solid #B0BEC5;
  }
}

/* Título de encuesta */
.encuesta-title {
  color: var(--color-primary);
  font-weight: 600;
  margin-bottom: 8px;
  display: flex;
  align-items: center;

  .q-icon {
    margin-right: 8px;
  }
}

/* Chip de proyecto */
.project-chip {
  border-radius: 16px;
  font-size: 0.75rem;
  transition: all 0.3s ease;

  &:hover {
    background-color: rgba(0, 153, 153, 0.1);
    transform: translateY(-2px);
  }
}

/* Contenedor de progreso */
.progress-container {
  background-color: rgba(245, 247, 250, 0.5);
  border-radius: 8px;
  padding: 14px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;

  &:hover {
    background-color: rgba(245, 247, 250, 0.8);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  .progress-label {
    color: var(--color-text);
    font-weight: 500;
  }

  .progress-count {
    margin-top: 8px;
    color: var(--color-text-light);
  }

  .custom-progress {
    height: 10px;
    border-radius: 5px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) inset;

    :deep(.q-linear-progress__track) {
      background: rgba(0, 0, 0, 0.05);
    }

    :deep(.q-linear-progress__model--with-transition) {
      transition: transform 1s cubic-bezier(0.23, 1, 0.32, 1);
    }
  }

  .custom-circular-progress {
    transition: all 0.5s ease;

    &:hover {
      transform: scale(1.1);
    }
  }
}

/* Contenedor de acciones */
.actions-container {
  display: flex;
  flex-direction: column;
  align-items: flex-end;

  .status-badge {
    font-size: 0.8rem;
    font-weight: 500;
    border-radius: 16px;
    padding: 4px 12px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }
  }

  .action-btn {
    margin-top: 10px;
    border-radius: 8px;
    transition: all 0.3s ease;

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(102, 51, 153, 0.2);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  .history-btn {
    margin-left: 8px;
    border-radius: 8px;
    transition: all 0.3s ease;

    &:hover {
      background-color: rgba(0, 153, 153, 0.1);
      border-color: var(--color-secondary);
    }
  }
}

/* Detalles expandibles */
.details-header {
  transition: all 0.3s ease;
  color: var(--color-primary);

  &:hover {
    background-color: rgba(102, 51, 153, 0.05);
  }
}

.details-card {
  background-color: rgba(250, 250, 250, 0.7);

  .details-title {
    color: var(--color-secondary);
    font-size: 0.95rem;
    border-bottom: 1px dashed rgba(0, 153, 153, 0.2);
    display: inline-block;
    padding-bottom: 4px;
    margin-bottom: 8px;
  }

  .date-info, .activity-info {
    margin-bottom: 6px;
    display: flex;
    align-items: center;
  }

  .history-list {
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid var(--color-border);

    .history-item {
      transition: all 0.2s ease;

      &:hover {
        background-color: rgba(0, 153, 153, 0.05);
      }

      .history-label {
        font-weight: 500;
      }

      .view-btn {
        opacity: 0.7;
        transition: all 0.2s ease;

        &:hover {
          opacity: 1;
          transform: scale(1.1);
        }
      }
    }
  }

  .no-history {
    padding: 24px;
    color: var(--color-text-light);
  }
}

/* Paginación personalizada */
.pagination-custom {
  margin-top: 30px;

  :deep(.q-btn) {
    border-radius: 50%;
    transition: all 0.3s ease;
    margin: 0 2px;
  }

  :deep(.q-btn.q-btn--active) {
    background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
    box-shadow: 0 3px 8px rgba(102, 51, 153, 0.3);
  }
}

/* Notificaciones personalizadas */
.notification-custom {
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);

  &.bg-positive {
    background: linear-gradient(135deg, #21ba45, var(--color-secondary)) !important;
  }

  &.bg-negative {
    background: linear-gradient(135deg, #c10015, #ff5252) !important;
  }

  &.bg-info {
    background: linear-gradient(135deg, var(--color-primary), #1976d2) !important;
  }
}

/* Animaciones */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Animación para lista de elementos */
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(30px);
}

/* Ajustes responsivos */
@media (max-width: 767px) {
  .header-container {
    padding: 16px;
  }

  .stats-card {
    margin-bottom: 16px;
  }

  .actions-container {
    align-items: flex-start;
    margin-top: 16px;

    .status-badge {
      margin-bottom: 10px;
    }

    .action-btn, .history-btn {
      width: 100%;
      margin: 5px 0;
    }

    .history-btn {
      margin-left: 0;
    }
  }
}
</style>
