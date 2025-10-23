<template>
  <q-page padding class="encuestadores-page">
    <div class="q-pa-md">
      <!-- Cabecera con efecto de gradiente y animación AOS -->
      <div class="header-container q-mb-lg" data-aos="fade-down" data-aos-duration="800">
        <div class="header-particles" id="header-particles"></div>
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
              @focus="searchFocus = true"
              @blur="searchFocus = false"
              :class="{'search-focused': searchFocus}"
            >
              <template v-slot:prepend>
                <q-icon name="search" color="primary" class="pulse-icon" />
              </template>
            </q-input>
          </div>
        </div>
      </div>

      <!-- Estadísticas con tarjetas mejoradas y animación AOS -->
      <div class="row q-col-gutter-md q-mb-lg">
        <div class="col-12 col-md-4" data-aos="zoom-in-right" data-aos-delay="100">
          <q-card class="stats-card total-card">
            <div class="card-blob-bg"></div>
            <q-card-section>
              <div class="row items-center">
                <div class="col-auto stats-icon-container">
                  <q-icon name="assignment" size="3rem" color="primary" />
                </div>
                <div class="col q-ml-md">
                  <div class="stats-number counter">
                    <span ref="totalCounter">{{ totalEncuestas }}</span>
                  </div>
                  <div class="text-subtitle1 stats-label">Encuestas asignadas</div>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-md-4" data-aos="zoom-in" data-aos-delay="200">
          <q-card class="stats-card completed-card">
            <div class="card-blob-bg"></div>
            <q-card-section>
              <div class="row items-center">
                <div class="col-auto stats-icon-container">
                  <q-icon name="check_circle" size="3rem" color="secondary" />
                </div>
                <div class="col q-ml-md">
                  <div class="stats-number counter">
                    <span ref="completadosCounter">{{ totalCompletados }}</span>
                  </div>
                  <div class="text-subtitle1 stats-label">Encuestas completadas</div>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-md-4" data-aos="zoom-in-left" data-aos-delay="300">
          <q-card class="stats-card pending-card">
            <div class="card-blob-bg"></div>
            <q-card-section>
              <div class="row items-center">
                <div class="col-auto stats-icon-container">
                  <q-icon name="pending_actions" size="3rem" color="accent" />
                </div>
                <div class="col q-ml-md">
                  <div class="stats-number counter">
                    <span ref="pendientesCounter">{{ totalPendientes }}</span>
                  </div>
                  <div class="text-subtitle1 stats-label">Encuestas pendientes</div>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Panel de filtros con diseño atractivo y animación -->
      <q-card class="filter-panel q-mb-md" data-aos="fade-up" data-aos-delay="400">
        <div class="filter-glow"></div>
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
                transition-show="jump-up"
                transition-hide="jump-down"
              >
                <template v-slot:prepend>
                  <q-icon name="filter_list" color="secondary" class="pulse-icon" />
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
                transition-show="jump-up"
                transition-hide="jump-down"
              >
                <template v-slot:prepend>
                  <q-icon name="sort" color="secondary" class="pulse-icon" />
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
        <div v-if="cargando" class="loader-container q-pa-xl" data-aos="fade-in">
          <div class="column items-center">
            <q-spinner color="primary" size="60px" :thickness="5" class="custom-spinner" />
            <div class="text-subtitle1 q-mt-md loading-text">Cargando encuestas...</div>
          </div>
        </div>

        <!-- Sin resultados -->
        <div v-else-if="!asignaciones.length" class="empty-state q-pa-xl" data-aos="fade-in">
          <div class="column items-center">
            <lottie-player
              src="https://assets5.lottiefiles.com/packages/lf20_ydo1amjm.json"
              background="transparent"
              speed="1"
              style="width: 200px; height: 200px;"
              loop
              autoplay
            ></lottie-player>
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
            <div
              v-for="(asignacion, index) in asignacionesFiltradas"
              :key="asignacion.id"
              class="col-12"
              :data-aos="index % 2 === 0 ? 'fade-right' : 'fade-left'"
              :data-aos-delay="100 * (index % 5)"
              :data-aos-offset="50"
            >
              <q-card
                class="encuesta-card"
                :class="{
                  'completed-border': getProgreso(asignacion) >= 1,
                  'inactive-border': !asignacion.estado
                }"
              >
                <div class="status-indicator" :class="getEstadoClass(asignacion)"></div>
                <q-card-section>
                  <div class="row items-start q-col-gutter-md">
                    <!-- Información principal -->
                    <div class="col-12 col-md-4">
                      <div class="text-h6 encuesta-title">
                        <q-icon name="assignment" color="primary" size="sm" class="q-mr-xs floating-icon" />
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
                              :ref="`progressBar_${asignacion.id}`"
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
                              track-color="grey-3"
                              :ref="`circularProgress_${asignacion.id}`">
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
                            >
                              <q-tooltip>Realizar nueva encuesta</q-tooltip>
                            </q-btn>
                            <q-btn
                              color="secondary"
                              icon="history"
                              label="Ver mis envíos"
                              to="/encuestadores/envios"
                              flat
                              class="history-btn"
                            >
                              <q-tooltip>Historial de mis envíos</q-tooltip>
                            </q-btn>
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
                  expand-icon-toggle
                  :default-opened="false"
                  @show="onItemShow(asignacion.id)"
                >
                  <q-card class="details-card">
                    <q-card-section>
                      <div class="row q-col-gutter-md">
                        <!-- Fechas -->
                        <div class="col-12 col-md-6">
                          <div class="text-subtitle2 text-weight-bold q-mb-xs details-title">
                            <q-icon name="event" size="xs" class="q-mr-xs" /> Fechas:
                          </div>
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
                          <div class="text-subtitle2 text-weight-bold q-mb-xs details-title">
                            <q-icon name="schedule" size="xs" class="q-mr-xs" /> Última actividad:
                          </div>
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
                      <div class="text-subtitle2 text-weight-bold q-mb-sm details-title">
                        <q-icon name="history" size="xs" class="q-mr-xs" /> Historial de envíos:
                      </div>
                      <q-list bordered separator class="history-list">
                        <q-item
                          v-for="(envio, index) in getUltimosEnvios(asignacion)"
                          :key="index"
                          clickable
                          class="history-item"
                          :class="{'slide-in-right': itemExpanded[asignacion.id]}"
                          :style="{'animation-delay': `${index * 0.1}s`}"
                        >
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
                      <lottie-player
                        src="https://assets3.lottiefiles.com/private_files/lf30_LOw4AL.json"
                        background="transparent"
                        speed="1"
                        style="width: 120px; height: 120px; margin: 0 auto;"
                        loop
                        autoplay
                      ></lottie-player>
                      <div class="q-mt-sm">Aún no hay envíos registrados para esta encuesta</div>
                    </q-card-section>
                  </q-card>
                </q-expansion-item>
              </q-card>
            </div>
          </transition-group>

          <!-- Paginación mejorada -->
          <div class="row justify-center q-mt-xl" v-if="totalPages > 1" data-aos="zoom-in" data-aos-offset="0">
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

    <!-- Botón flotante para ir arriba -->
    <q-page-sticky position="bottom-right" :offset="[20, 20]">
      <q-btn
        v-show="showScrollTop"
        fab
        icon="keyboard_arrow_up"
        color="secondary"
        @click="scrollToTop"
        class="scroll-to-top-btn"
      >
        <q-tooltip>Volver arriba</q-tooltip>
      </q-btn>
    </q-page-sticky>
  </q-page>
</template>

<script>
import { defineComponent, ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { api } from 'boot/axios';
import { useQuasar, scroll } from 'quasar';
import { date } from 'quasar';
import AOS from 'aos';
import 'particles.js/particles';

const { getScrollTarget, setVerticalScrollPosition } = scroll;

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
    const searchFocus = ref(false);
    const showScrollTop = ref(false);
    const itemExpanded = ref({});

    // Referencias para animaciones
    const totalCounter = ref(null);
    const completadosCounter = ref(null);
    const pendientesCounter = ref(null);

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

    // Control de estado para las expansiones
    const onItemShow = (id) => {
      itemExpanded.value[id] = true;

      // Refrescar AOS para elementos recién mostrados
      nextTick(() => {
        if (typeof AOS !== 'undefined') {
          AOS.refresh();
        }
      });
    };

    // Inicializar partículas en el header (comprobando global y haciendo import dinámico como fallback)
    const initHeaderParticles = async () => {
      // helper que ejecuta la inicialización si tenemos una referencia válida a particlesJS
      const runParticles = (pjs) => {
        if (!pjs) return;
        try {
          pjs('header-particles', {
            particles: {
              number: {
                value: 30,
                density: {
                  enable: true,
                  value_area: 800
                }
              },
              color: {
                value: "#663399"
              },
              opacity: {
                value: 0.3,
                random: true
              },
              size: {
                value: 3,
                random: true
              },
              line_linked: {
                enable: true,
                distance: 150,
                color: "#009999",
                opacity: 0.2,
                width: 1
              },
              move: {
                enable: true,
                speed: 2,
                direction: "none",
                random: true,
                out_mode: "out",
                bounce: false
              }
            },
            interactivity: {
              detect_on: "canvas",
              events: {
                onhover: {
                  enable: true,
                  mode: "grab"
                },
                onclick: {
                  enable: false
                },
                resize: true
              }
            },
            retina_detect: true
          });
        } catch (e) {
          // no bloquear la app si la inicialización falla
          console.warn('particles.js initialization failed:', e);
        }
      };

      try {
        // Primero intentar usar la versión global si existe
        if (typeof window !== 'undefined' && typeof window.particlesJS !== 'undefined') {
          runParticles(window.particlesJS);
          return;
        }

        // Intentar import dinámico (algunos bundlers exponen la función como default o named export)
        const mod = await import(/* webpackChunkName: "particles" */ 'particles.js/particles').catch(() => null);
        const pjs = mod && (mod.particlesJS || mod.default || mod);
        if (typeof pjs !== 'undefined') {
          runParticles(pjs);
          return;
        }

        // Si llegamos aquí, no hay particlesJS disponible; no hacemos nada
      } catch (err) {
        console.warn('Error cargando particles.js:', err);
      }
    };

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
            position: 'top-right',
            progress: true,
            timeout: 2000,
            classes: 'notification-custom',
            actions: [
              { icon: 'close', color: 'white' }
            ]
          });
        } else {
          // Iniciar animaciones de contadores
          nextTick(() => {
            animateCounters();
          });

          // Inicializar o refrescar AOS
          if (typeof AOS !== 'undefined') {
            setTimeout(() => {
              AOS.refresh();
            }, 500);
          }
        }

      } catch (error) {
        console.error('Error al cargar asignaciones:', error);
        $q.notify({
          type: 'negative',
          message: 'Error al cargar encuestas asignadas',
          position: 'top-right',
          timeout: 3000,
          progress: true,
          classes: 'notification-custom',
          actions: [
            { icon: 'close', color: 'white' }
          ]
        });
      } finally {
        cargando.value = false;
        // Iniciar animaciones de progreso
        setTimeout(initProgressAnimations, 500);
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

    // Animación de contadores
    const animateCounters = () => {
      // Función para animar un contador específico
      const animateCounter = (ref, target, duration = 1500) => {
        if (!ref.value) return;

        const element = ref.value;
        const start = 0;
        const increment = (target / duration) * 10;
        let current = start;

        const timer = setInterval(() => {
          current += increment;
          if (current >= target) {
            element.textContent = target;
            clearInterval(timer);
          } else {
            element.textContent = Math.floor(current);
          }
        }, 10);
      };

      // Animar los tres contadores con diferentes retrasos
      setTimeout(() => animateCounter(totalCounter, totalEncuestas.value), 100);
      setTimeout(() => animateCounter(completadosCounter, totalCompletados.value), 300);
      setTimeout(() => animateCounter(pendientesCounter, totalPendientes.value), 500);
    };

    // Inicialización de animaciones de progreso
    const initProgressAnimations = () => {
      asignaciones.value.forEach(() => {
        // Retraso escalonado para las animaciones
        const delay = Math.random() * 500;
        setTimeout(() => {
          // Podríamos aplicar animaciones específicas aquí si es necesario
          // Por ejemplo, usando anime.js, GSAP, o efectos CSS personalizados
        }, delay);
      });
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

    // Función para ir al inicio de la página
    const scrollToTop = () => {
      const target = document.scrollingElement || document.documentElement;
      const duration = 500;

      setVerticalScrollPosition(getScrollTarget(target), 0, duration);
    };

    // Control del botón para ir arriba
    const handleScroll = () => {
      showScrollTop.value = window.scrollY > 300;
    };

    onMounted(() => {
      cargarAsignaciones();

      // Inicializar AOS
      if (typeof AOS !== 'undefined') {
        AOS.init({
          duration: 800,
          easing: 'ease-out-cubic',
          once: false
        });
      }

      // Inicializar partículas
      nextTick(() => {
        initHeaderParticles();
      });

      // Agregar listener para el botón de ir arriba
      window.addEventListener('scroll', handleScroll);
    });

    onUnmounted(() => {
      window.removeEventListener('scroll', handleScroll);
    });

    // Recargar AOS cuando cambian los filtros
    watch([filtroEstado, ordenarPor, filter], () => {
      nextTick(() => {
        if (typeof AOS !== 'undefined') {
          setTimeout(() => {
            AOS.refresh();
          }, 200);
        }
      });
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
      searchFocus,
      showScrollTop,
      itemExpanded,

      // Referencias
      totalCounter,
      completadosCounter,
      pendientesCounter,

      // Métodos
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
      formatDateTime,
      scrollToTop,
      onItemShow
    };
  }
});
</script>
<style lang="scss" scoped>
/* Definición de colores y variables */
:root {
  --color-primary: #663399;
  --color-primary-light: #8a63cc;
  --color-primary-dark: #4a2c6d;
  --color-secondary: #009999;
  --color-secondary-light: #33b5b5;
  --color-secondary-dark: #007373;
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
  --gradient-primary: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
}

/* Estilos globales */
.encuestadores-page {
  background-color: var(--color-light-bg);
  background-image:
    radial-gradient(circle at 10% 20%, rgba(102, 51, 153, 0.03) 0%, rgba(0, 0, 0, 0) 30%),
    radial-gradient(circle at 90% 80%, rgba(0, 153, 153, 0.03) 0%, rgba(0, 0, 0, 0) 30%);
  background-attachment: fixed;
  min-height: 100vh;
}

/* Cabecera con gradiente y partículas */
.header-container {
  padding: 28px;
  background: linear-gradient(to right, rgba(102, 51, 153, 0.1), rgba(0, 153, 153, 0.1));
  border-radius: 16px;
  margin-bottom: 28px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease-in-out;
  border: 1px solid rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(5px);

  &:hover {
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);

    .page-title {
      background-size: 100% 3px;
    }
  }

  .header-particles {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
  }

  .page-title {
    color: var(--color-primary);
    font-weight: 600;
    position: relative;
    z-index: 1;
    display: inline-block;
    background-image: linear-gradient(to right, var(--color-primary), var(--color-secondary));
    background-position: 0 100%;
    background-repeat: no-repeat;
    background-size: 0 3px;
    transition: background-size 0.5s ease;
    padding-bottom: 5px;
  }

  .subtitle-text {
    color: var(--color-text-light);
    position: relative;
    z-index: 1;
    opacity: 0.9;
  }
}

/* Barra de búsqueda */
.search-input {
  border-radius: 25px;
  transition: transform 0.3s ease;
  overflow: hidden;

  &:hover {
    transform: translateY(-2px);
  }

  &.search-focused {
    transform: translateY(-3px);
  }

  .pulse-icon {
    animation: pulse 2s infinite;
  }

  :deep(.q-field__control) {
    border-radius: 25px;
    background-color: rgba(255, 255, 255, 0.8);
    transition: all 0.3s ease;
    border: 2px solid transparent;
  }

  :deep(.q-field__control:hover) {
    background-color: white;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    border-color: rgba(102, 51, 153, 0.1);
  }

  :deep(.q-field--focused .q-field__control) {
    box-shadow: 0 5px 15px rgba(102, 51, 153, 0.2);
    border-color: var(--color-primary-light);
    background-color: white;
  }
}

/* Panel de filtros */
.filter-panel {
  border-radius: 16px;
  background-color: white;
  box-shadow: var(--card-shadow);
  transition: all 0.3s ease;
  overflow: hidden;
  border-top: 4px solid var(--color-secondary);
  position: relative;

  &:hover {
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);

    .filter-glow {
      opacity: 1;
    }
  }

  .filter-glow {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle at 50% 0%, rgba(0, 153, 153, 0.15), transparent 70%);
    opacity: 0.3;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }
}

.filter-select {
  :deep(.q-field__control) {
    border-radius: 8px;
    transition: all 0.3s ease;
    border: 1px solid rgba(0, 0, 0, 0.1);
  }

  :deep(.q-field--focused .q-field__control) {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(102, 51, 153, 0.15);
  }

  .pulse-icon {
    animation: pulse 2s infinite;
    animation-delay: 0.5s;
  }
}

/* Botón de actualizar */
.update-btn {
  background: var(--gradient-primary);
  border-radius: 25px;
  padding: 8px 22px;
  font-weight: 500;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.2), transparent);
    transform: translateX(-100%);
  }

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(102, 51, 153, 0.3);

    &::before {
      transform: translateX(100%);
      transition: transform 0.8s ease;
    }
  }

  &:active {
    transform: translateY(-1px);
    box-shadow: 0 4px 10px rgba(102, 51, 153, 0.2);
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
  border-left: 6px solid transparent;
  z-index: 1;

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.15);

    .stats-icon-container {
      transform: scale(1.1) rotate(5deg);
    }

    .card-blob-bg {
      transform: scale(1.1);
      opacity: 0.8;
    }
  }

  .card-blob-bg {
    position: absolute;
    top: 0;
    right: 0;
    width: 150px;
    height: 150px;
    border-radius: 50%;
    opacity: 0.4;
    z-index: 0;
    transition: all 0.5s ease;
    transform-origin: 75% 25%;
    filter: blur(20px);
  }

  .stats-icon-container {
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    width: 70px;
    height: 70px;
    background-color: rgba(255, 255, 255, 0.15);
    transition: all 0.4s ease;
    position: relative;
    z-index: 1;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  }

  .stats-number {
    font-weight: 700;
    font-size: 2.5rem;
    letter-spacing: -1px;
    margin-bottom: 0;
    position: relative;
    z-index: 1;
    background-clip: text;
    -webkit-background-clip: text;
    transition: all 0.3s ease;
  }

  .stats-label {
    color: var(--color-text-light);
    font-weight: 500;
    position: relative;
    z-index: 1;
  }
}

/* Personalización de tarjetas de estadísticas */
.total-card {
  border-left-color: var(--color-primary);

  .stats-icon-container {
    background-color: rgba(102, 51, 153, 0.1);
  }

  .card-blob-bg {
    background-color: rgba(102, 51, 153, 0.2);
  }

  .stats-number {
    color: var(--color-primary);
    text-shadow: 0 2px 5px rgba(102, 51, 153, 0.2);
  }
}

.completed-card {
  border-left-color: var(--color-secondary);

  .stats-icon-container {
    background-color: rgba(0, 153, 153, 0.1);
  }

  .card-blob-bg {
    background-color: rgba(0, 153, 153, 0.2);
  }

  .stats-number {
    color: var(--color-secondary);
    text-shadow: 0 2px 5px rgba(0, 153, 153, 0.2);
  }
}

.pending-card {
  border-left-color: var(--color-accent);

  .stats-icon-container {
    background-color: rgba(0, 170, 170, 0.1);
  }

  .card-blob-bg {
    background-color: rgba(0, 170, 170, 0.2);
  }

  .stats-number {
    color: var(--color-accent);
    text-shadow: 0 2px 5px rgba(0, 170, 170, 0.2);
  }
}

/* Estado de carga */
.loader-container {
  text-align: center;
  padding: 70px 0;
  background-color: white;
  border-radius: 16px;
  box-shadow: var(--card-shadow);
  border: 1px solid var(--color-border);

  .custom-spinner {
    animation: spin 1.5s linear infinite;
  }

  .loading-text {
    position: relative;
    display: inline-block;
    color: var(--color-primary);

    &:after {
      content: '...';
      position: absolute;
      width: 24px;
      text-align: left;
      right: -28px;
      animation: dots 1.5s steps(4, end) infinite;
    }
  }
}

@keyframes dots {
  0%, 20% { content: '.'; }
  40% { content: '..'; }
  60%, 100% { content: '...'; }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Estado vacío */
.empty-state {
  text-align: center;
  padding: 60px 0;
  background-color: white;
  border-radius: 16px;
  box-shadow: var(--card-shadow);
  border: 1px solid var(--color-border);

  .empty-icon {
    color: rgba(102, 51, 153, 0.3);
    opacity: 0.7;
    filter: drop-shadow(0 5px 10px rgba(0, 0, 0, 0.1));
  }

  .empty-title {
    color: var(--color-text);
    font-weight: 600;
    margin-top: 20px;
  }

  .empty-subtitle {
    color: var(--color-text-light);
    max-width: 500px;
    margin: 0 auto;
  }
}

/* Contenedor de encuestas */
.encuestas-container {
  position: relative;
}

/* Tarjetas de encuestas */
.encuesta-card {
  position: relative;
  border-radius: 16px;
  box-shadow: var(--card-shadow);
  transition: all 0.3s ease;
  overflow: hidden;
  border: 1px solid var(--color-border);
  background-color: white;
  backdrop-filter: blur(5px);

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.15);

    .status-indicator {
      opacity: 1;
      width: 8px;
    }

    .floating-icon {
      animation: float 2s ease-in-out infinite;
    }
  }

  .status-indicator {
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    opacity: 0.8;
    transition: all 0.3s ease;
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

/* Animación de flotación para iconos */
.floating-icon {
  display: inline-block;
  transition: all 0.3s ease;
}

@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-5px); }
  100% { transform: translateY(0px); }
}

/* Título de encuesta */
.encuesta-title {
  color: var(--color-primary);
  font-weight: 600;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  position: relative;

  &:after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 0;
    width: 0;
    height: 2px;
    background: linear-gradient(to right, var(--color-primary), transparent);
    transition: width 0.3s ease;
  }

  &:hover:after {
    width: 100%;
  }
}

/* Chip de proyecto */
.project-chip {
  border-radius: 20px;
  font-size: 0.75rem;
  transition: all 0.3s ease;
  background-color: rgba(0, 153, 153, 0.05);
  padding: 4px 12px;

  &:hover {
    background-color: rgba(0, 153, 153, 0.15);
    transform: translateY(-2px);
    box-shadow: 0 3px 8px rgba(0, 153, 153, 0.2);
  }
}

/* Contenedor de progreso */
.progress-container {
  background-color: rgba(245, 247, 250, 0.7);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;

  &:hover {
    background-color: rgba(245, 247, 250, 0.9);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.07);
    transform: translateY(-2px);
  }

  .progress-label {
    color: var(--color-text);
    font-weight: 500;
  }

  .progress-count {
    margin-top: 10px;
    color: var(--color-text-light);
  }

  .custom-progress {
    height: 10px;
    border-radius: 5px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) inset;
    margin-top: 5px;

    :deep(.q-linear-progress__track) {
      background: rgba(0, 0, 0, 0.05);
    }

    :deep(.q-linear-progress__model--with-transition) {
      transition: transform 1.5s cubic-bezier(0.23, 1, 0.32, 1);
      position: relative;
      overflow: hidden;

      &::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg,
          rgba(255, 255, 255, 0) 0%,
          rgba(255, 255, 255, 0.3) 50%,
          rgba(255, 255, 255, 0) 100%);
        animation: shimmer 2s infinite;
      }
    }
  }

  .custom-circular-progress {
    transition: all 0.5s ease;
    position: relative;

    &:hover {
      transform: scale(1.1) rotate(15deg);
    }

    &::before {
      content: '';
      position: absolute;
      top: -10%;
      left: -10%;
      width: 120%;
      height: 120%;
      border-radius: 50%;
      background: radial-gradient(
        circle at 30% 30%,
        rgba(255, 255, 255, 0.8) 0%,
        rgba(255, 255, 255, 0) 70%
      );
      opacity: 0;
      transition: opacity 0.5s ease;
      pointer-events: none;
    }

    &:hover::before {
      opacity: 0.6;
    }
  }
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

/* Contenedor de acciones */
.actions-container {
  display: flex;
  flex-direction: column;
  align-items: flex-end;

  .status-badge {
    font-size: 0.85rem;
    font-weight: 500;
    border-radius: 20px;
    padding: 5px 14px;
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;

    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.2), transparent);
      transform: translateX(-100%);
      transition: transform 0.6s ease;
    }

    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 5px 12px rgba(0, 0, 0, 0.15);

      &::after {
        transform: translateX(100%);
      }
    }
  }

  .action-btn {
    margin-top: 10px;
    border-radius: 10px;
    transition: all 0.3s ease;
    background: var(--gradient-primary);
    position: relative;
    overflow: hidden;

    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.1), transparent);
      transform: translateX(-100%);
    }

    &:hover:not(:disabled) {
      transform: translateY(-3px);
      box-shadow: 0 5px 12px rgba(102, 51, 153, 0.2);

      &::after {
        transform: translateX(100%);
        transition: transform 0.8s ease;
      }
    }

    &:active:not(:disabled) {
      transform: translateY(-1px);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  .history-btn {
    margin-left: 8px;
    border-radius: 10px;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 3px;
      background: var(--color-secondary);
      transform: scaleX(0);
      transform-origin: center;
      transition: transform 0.3s ease;
    }

    &:hover {
      background-color: rgba(0, 153, 153, 0.1);
      color: var(--color-secondary-dark);

      &::after {
        transform: scaleX(1);
      }
    }
  }
}

/* Detalles expandibles */
.details-header {
  transition: all 0.3s ease;
  color: var(--color-primary);
  border-radius: 0 0 8px 8px;
  background: linear-gradient(to right, rgba(102, 51, 153, 0.05), transparent);

  &:hover {
    background-color: rgba(102, 51, 153, 0.08);
  }
}

.details-card {
  background-color: rgba(250, 250, 250, 0.7);
  border-radius: 0 0 16px 16px;
  overflow: hidden;
  transition: all 0.3s ease;

  .details-title {
    color: var(--color-secondary);
    font-size: 0.95rem;
    border-bottom: 2px dashed rgba(0, 153, 153, 0.2);
    display: inline-flex;
    align-items: center;
    padding-bottom: 6px;
    margin-bottom: 12px;
    position: relative;

    &::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 0;
      width: 100%;
      height: 2px;
      background: linear-gradient(to right, var(--color-secondary), transparent);
      transform: scaleX(0);
      transform-origin: left;
      transition: transform 0.4s ease;
    }

    &:hover::after {
      transform: scaleX(1);
    }
  }

  .date-info, .activity-info {
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    padding: 5px 10px;
    border-radius: 6px;
    transition: all 0.3s ease;

    &:hover {
      background-color: rgba(102, 51, 153, 0.05);
    }
  }

  .history-list {
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid var(--color-border);

    .history-item {
      transition: all 0.3s ease;

      &:hover {
        background-color: rgba(0, 153, 153, 0.05);
      }

      .history-label {
        font-weight: 500;
      }

      .view-btn {
        opacity: 0.7;
        transition: all 0.3s ease;

        &:hover {
          opacity: 1;
          transform: scale(1.15);
          box-shadow: 0 3px 10px rgba(0, 153, 153, 0.2);
        }
      }
    }

    /* Animación para los items del historial */
    .slide-in-right {
      animation: slideInRight 0.5s forwards;
      opacity: 0;
    }

    @keyframes slideInRight {
      from {
        opacity: 0;
        transform: translateX(30px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
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
  margin-top: 40px;

  :deep(.q-btn) {
    border-radius: 50%;
    transition: all 0.4s ease;
    margin: 0 3px;
    position: relative;
    overflow: hidden;

    &:hover:not(.q-btn--active) {
      background: rgba(102, 51, 153, 0.1);
      transform: translateY(-2px);
    }
  }

  :deep(.q-btn.q-btn--active) {
    background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
    box-shadow: 0 4px 10px rgba(102, 51, 153, 0.3);
    transform: scale(1.1);

    &::after {
      content: '';
      position: absolute;
      width: 30px;
      height: 30px;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
      top: -5px;
      left: -5px;
      border-radius: 50%;
    }
  }
}

/* Botón para ir arriba */
.scroll-to-top-btn {
  box-shadow: 0 5px 15px rgba(0, 153, 153, 0.3);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  transform: scale(0.9);
  opacity: 0.9;

  &:hover {
    transform: scale(1.1) translateY(-5px);
    opacity: 1;
    box-shadow: 0 10px 20px rgba(0, 153, 153, 0.4);

    &::before {
      opacity: 1;
    }
  }

  &:active {
    transform: scale(1) translateY(-2px);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
    opacity: 0;
    transition: opacity 0.3s ease;
  }
}

/* Notificaciones personalizadas */
.notification-custom {
  border-radius: 12px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  max-width: 320px;

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

/* Animación de pulso para iconos */
.pulse-icon {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

/* Animaciones para las tarjetas */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideInUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Animación para lista de elementos */
.list-enter-active,
.list-leave-active {
  transition: all 0.5s cubic-bezier(0.19, 1, 0.22, 1);
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(40px);
}

/* Ajustes responsivos */
@media (max-width: 767px) {
  .header-container {
    padding: 16px;
    margin-bottom: 20px;
  }

  .stats-card {
    margin-bottom: 16px;

    .stats-number {
      font-size: 2rem;
    }

    .stats-icon-container {
      width: 60px;
      height: 60px;
    }
  }

  .actions-container {
    align-items: flex-start;
    margin-top: 16px;

    .status-badge {
      margin-bottom: 12px;
    }

    .action-btn, .history-btn {
      width: 100%;
      margin: 5px 0;
    }

    .history-btn {
      margin-left: 0;
    }
  }

  .filter-panel {
    .filter-glow {
      display: none;
    }
  }

  .encuesta-card {
    .status-indicator {
      width: 5px;
      opacity: 1;
    }
  }

  .scroll-to-top-btn {
    bottom: 16px !important;
    right: 16px !important;
  }
}

/* Efectos de glassmorphism para tarjetas principales */
.glassmorphism {
  background-color: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

/* Animaciones adicionales */
@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {transform: translateY(0);}
  40% {transform: translateY(-15px);}
  60% {transform: translateY(-7px);}
}

@keyframes gradientShift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

/* Estilos para las animaciones AOS */
[data-aos="custom-fade-up"] {
  opacity: 0;
  transform: translateY(30px);
  transition-property: opacity, transform;

  &.aos-animate {
    opacity: 1;
    transform: translateY(0);
  }
}

[data-aos="custom-fade-left"] {
  opacity: 0;
  transform: translateX(30px);
  transition-property: opacity, transform;

  &.aos-animate {
    opacity: 1;
    transform: translateX(0);
  }
}

[data-aos="custom-fade-right"] {
  opacity: 0;
  transform: translateX(-30px);
  transition-property: opacity, transform;

  &.aos-animate {
    opacity: 1;
    transform: translateX(0);
  }
}

[data-aos="custom-zoom"] {
  opacity: 0;
  transform: scale(0.85);
  transition-property: opacity, transform;

  &.aos-animate {
    opacity: 1;
    transform: scale(1);
  }
}

/* Animación para el contador */
.counter {
  display: inline-block;
  font-variant-numeric: tabular-nums;
  transition: all 0.3s ease;
}

/* Estilos adicionales para los estados de las encuestas */
.status-pending {
  position: relative;

  &:after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg,
      rgba(102, 51, 153, 0.2) 25%,
      rgba(102, 51, 153, 0.4) 50%,
      rgba(102, 51, 153, 0.2) 75%
    );
    background-size: 200% 100%;
    animation: shimmerGradient 2s infinite linear;
    z-index: 0;
  }
}

@keyframes shimmerGradient {
  0% { background-position: 100% 0; }
  100% { background-position: -100% 0; }
}
</style>
