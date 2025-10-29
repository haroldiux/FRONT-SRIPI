<template>
  <q-page padding class="envios-page">
    <!-- Cabecera con efecto de gradiente -->
    <div class="header-container q-mb-lg">
      <div class="row items-center">
        <div class="col-12 col-md-8">
          <h1 class="page-title text-h4 q-mb-sm">{{ getTitleByRole }}</h1>
          <p class="text-subtitle1 q-mb-none subtitle-text">{{ getSubtitleByRole }}</p>
        </div>
        <div class="col-12 col-md-4 q-pt-sm q-pt-md-none">
          <q-input
            v-model="filter"
            outlined
            dense
            clearable
            placeholder="Buscar por encuesta"
            class="search-input"
          >
            <template v-slot:prepend>
              <q-icon name="search" color="primary" />
            </template>
          </q-input>
        </div>
      </div>
    </div>

    <!-- Panel de filtros con diseño atractivo -->
    <q-card class="filter-panel q-mb-md">
      <q-card-section class="q-pa-md">
        <div class="row items-center q-col-gutter-md">
          <!-- Filtro de proyecto (solo para supervisores y admins) -->
          <div v-if="isAdmin || isSupervisor" class="col-12 col-sm-6 col-md">
            <q-select
              v-model="filtroProyecto"
              :options="opcionesProyectos"
              outlined
              dense
              label="Proyecto"
              emit-value
              map-options
              clearable
              class="filter-select"
            >
              <template v-slot:prepend>
                <q-icon name="folder" color="secondary" />
              </template>
              <template v-slot:no-option>
                <div class="text-center q-pa-sm">No hay proyectos disponibles</div>
              </template>
            </q-select>
          </div>

          <!-- Filtro de encuesta -->
          <div class="col-12 col-sm-6 col-md">
            <q-select
              v-model="filtroEncuesta"
              :options="opcionesEncuestas"
              outlined
              dense
              label="Encuesta"
              emit-value
              map-options
              clearable
              class="filter-select"
            >
              <template v-slot:prepend>
                <q-icon name="description" color="secondary" />
              </template>
              <template v-slot:no-option>
                <div class="text-center q-pa-sm">No hay encuestas disponibles</div>
              </template>
            </q-select>
          </div>

          <!-- Filtro de usuario (solo para admins) -->
          <div v-if="isAdmin" class="col-12 col-sm-6 col-md">
            <q-select
              v-model="filtroUsuario"
              :options="opcionesUsuarios"
              outlined
              dense
              label="Aplicador"
              emit-value
              map-options
              clearable
              class="filter-select"
            >
              <template v-slot:prepend>
                <q-icon name="person" color="secondary" />
              </template>
              <template v-slot:no-option>
                <div class="text-center q-pa-sm">No hay usuarios disponibles</div>
              </template>
            </q-select>
          </div>

          <!-- Filtro de fecha -->
          <div class="col-12 col-sm-6 col-md">
            <q-select
              v-model="filtroFecha"
              :options="opcionesFecha"
              outlined
              dense
              label="Fecha"
              emit-value
              map-options
              class="filter-select"
            >
              <template v-slot:prepend>
                <q-icon name="event" color="secondary" />
              </template>
            </q-select>
          </div>

          <!-- Botón de actualizar -->
          <div class="col-12 col-sm-12 col-md-auto text-center text-md-right">
            <q-btn
              color="primary"
              icon="refresh"
              label="Actualizar"
              @click="cargarEnvios"
              :loading="cargando"
              class="update-btn"
            >
              <q-tooltip>Actualizar lista de envíos</q-tooltip>
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
          <div class="text-subtitle1 q-mt-md">Cargando envíos...</div>
        </div>
      </div>

      <!-- Sin resultados -->
      <div v-else-if="!enviosFiltrados.length" class="empty-state q-pa-xl">
        <div class="column items-center">
          <q-icon name="inventory" size="80px" class="empty-icon" />
          <div class="text-h6 q-mt-md empty-title">No se encontraron envíos</div>
          <div class="empty-subtitle q-mt-sm">
            {{ getNoResultsMessage }}
          </div>
          <q-btn
            outline
            color="primary"
            label="Limpiar filtros"
            class="q-mt-lg"
            @click="limpiarFiltros"
            v-if="hayFiltrosActivos"
            icon="filter_alt_off"
          />
        </div>
      </div>

      <!-- Lista de envíos -->
      <div v-else class="envios-container">
        <transition-group
          name="list"
          tag="div"
          class="row q-col-gutter-md"
        >
          <div v-for="(envio, index) in enviosFiltrados" :key="envio.id" class="col-12"
              :style="{ animationDelay: `${index * 0.05}s` }">
            <q-card class="envio-card">
              <div class="status-indicator"></div>
              <q-card-section>
                <div class="row items-start q-col-gutter-md">
                  <!-- Información principal -->
                  <div class="col-12 col-md-4">
                    <div class="text-h6 envio-title">
                      <q-icon name="assignment" color="primary" size="sm" class="q-mr-xs" />
                      {{ envio.encuesta ? envio.encuesta.titulo : 'Encuesta' }}
                    </div>
                    <div class="text-subtitle2 date-text">
                      <q-icon name="event" size="xs" class="q-mr-xs" />
                      <span>{{ formatDateTime(envio.created_at) }}</span>
                    </div>
                    <!-- Mostrar proyecto si aplica -->
                    <div v-if="envio.encuesta && envio.encuesta.proyecto" class="project-tag q-mt-sm">
                      <q-icon name="folder" size="xs" class="q-mr-xs" />
                      <span>{{ envio.encuesta.proyecto.titulo || 'Sin proyecto' }}</span>
                    </div>
                  </div>

                  <!-- Información adicional -->
                  <div class="col-12 col-md-5">
                    <div class="info-container">
                      <!-- Info de ubicación -->
                      <div v-if="envio.lat && envio.lng" class="location-info q-mb-sm">
                        <q-icon name="location_on" size="sm" color="secondary" class="q-mr-xs" />
                        <span class="text-body2">{{ formatLatLng(envio.lat, envio.lng) }}</span>
                        <q-tooltip>
                          <div class="text-body2">Latitud: {{ envio.lat }}</div>
                          <div class="text-body2">Longitud: {{ envio.lng }}</div>
                        </q-tooltip>
                      </div>

                      <!-- Info de aplicador -->
                      <div class="aplicador-info">
                        <q-icon name="assignment_ind" size="sm" color="secondary" class="q-mr-xs" />
                        <span class="text-body2">{{ getNombreAplicador(envio) }}</span>
                      </div>

                      <!-- Respuestas -->
                      <div class="respuestas-info q-mt-sm" v-if="envio.respuestas && envio.respuestas.length">
                        <q-badge color="accent" class="q-mr-sm" outline>
                          <q-icon name="question_answer" size="xs" class="q-mr-xs" />
                          {{ envio.respuestas.length }} respuesta{{ envio.respuestas.length !== 1 ? 's' : '' }}
                        </q-badge>
                      </div>
                    </div>
                  </div>

                  <!-- Acciones -->
                  <div class="col-12 col-md-3 text-right">
                    <q-btn
                      color="primary"
                      icon-right="visibility"
                      label="Ver detalles"
                      :to="`/encuestadores/envio/${envio.id}`"
                      class="details-btn"
                      flat
                    >
                      <q-tooltip>Ver detalles del envío</q-tooltip>
                    </q-btn>
                  </div>
                </div>
              </q-card-section>
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
            @update:model-value="cargarEnvios"
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

    <!-- Diálogo de mapa para mostrar ubicación -->
    <q-dialog v-model="mapDialog" maximized persistent>
      <q-card class="map-dialog-card">
        <q-card-section class="row items-center">
          <div class="text-h6"><q-icon name="location_on" class="q-mr-xs" /> Ubicación del envío</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="col-grow">
          <div id="ubicacion-mapa" ref="ubicacionMapa" style="width: 100%; height: 500px;"></div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cerrar" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { defineComponent, ref, computed, onMounted, watch } from 'vue';
import { api } from 'boot/axios';
import { useQuasar, date } from 'quasar';
import { useAuthStore } from 'src/stores/auth.store';
import { useRouter } from 'vue-router';

export default defineComponent({
  name: 'EnviosListPage',

  setup() {
    const $q = useQuasar();
    const auth = useAuthStore();
    const router = useRouter();

    // Referencias
    const ubicacionMapa = ref(null);
    let mapa = null;
    let marcador = null;

    // Variables reactivas
    const envios = ref([]);
    const usuarios = ref([]);
    const proyectos = ref([]);
    const cargando = ref(false);
    const filter = ref('');
    const currentPage = ref(1);
    const totalPages = ref(1);
    const filtroEncuesta = ref(null);
    const filtroProyecto = ref(null);
    const filtroUsuario = ref(null);
    const filtroFecha = ref('todos');
    const opcionesEncuestas = ref([]);
    const opcionesProyectos = ref([]);
    const opcionesUsuarios = ref([]);
    const mapDialog = ref(false);
    const envioSeleccionado = ref(null);

    // Detección del rol del usuario actual
    const isAdmin = computed(() => auth.user?.rol_id === 1);
    const isSupervisor = computed(() => auth.user?.rol_id === 2);
    const isEncuestador = computed(() => auth.user?.rol_id === 3);
    const isAcademico = computed(() => auth.user?.rol_id === 4);


    // Verificar si hay filtros activos
    const hayFiltrosActivos = computed(() => {
      return filter.value || filtroEncuesta.value || (filtroFecha.value && filtroFecha.value !== 'todos') || filtroProyecto.value || filtroUsuario.value;
    });

    // Títulos dinámicos según el rol
    const getTitleByRole = computed(() => {
      if (isAdmin.value) return '📊 Historial de Envíos';
      if (isSupervisor.value) return '📋 Envíos de mis Proyectos';
      if (isAcademico.value) return '📝 Mis Envíos Realizados';
      return '📝 Mis Envíos Realizados';
    });

    const getSubtitleByRole = computed(() => {
      if (isAdmin.value) return 'Gestiona y visualiza todos los envíos del sistema';
      if (isSupervisor.value) return 'Revisa los envíos de los proyectos que supervisas';
      if (isAcademico.value) return 'Historial completo de tus encuestas completadas';
      return 'Historial completo de tus encuestas completadas';
    });

    // Mensaje cuando no hay resultados
    const getNoResultsMessage = computed(() => {
      if (filter.value || filtroEncuesta.value || filtroFecha.value !== 'todos' || filtroProyecto.value || filtroUsuario.value) {
        return 'No se encontraron envíos con los filtros seleccionados. Intenta con otros criterios.';
      }

      if (isEncuestador.value || isAcademico.value) {
        return 'Aún no has enviado ninguna encuesta. Comienza realizando alguna encuesta asignada.';
      }
      if (isSupervisor.value) {
        return 'No hay envíos en los proyectos que supervisas. Verifica las asignaciones de encuestas.';
      }
      return 'No hay envíos registrados en el sistema. Los envíos aparecerán aquí cuando se completen encuestas.';
    });

    // Opciones para filtros
    const opcionesFecha = [
      { label: 'Todos los períodos', value: 'todos', icon: 'event' },
      { label: 'Hoy', value: 'hoy', icon: 'today' },
      { label: 'Esta semana', value: 'semana', icon: 'date_range' },
      { label: 'Este mes', value: 'mes', icon: 'calendar_month' }
    ];

    // Computed properties para filtrado
    const enviosFiltrados = computed(() => {
      // Comenzamos con todos los envíos cargados
      let resultado = [...envios.value];

      // Filtro según el rol del usuario
      if (isEncuestador.value  || isAcademico.value) {
        // Encuestadores solo ven sus propios envíos
        resultado = resultado.filter(e => e.aplicador_id === auth.user.id);
      } else if (isSupervisor.value && !filtroProyecto.value) {
        // Supervisores ven envíos de sus proyectos
        resultado = resultado.filter(e => {
          return e.encuesta &&
                 e.encuesta.proyecto &&
                 e.encuesta.proyecto.responsable_id === auth.user.id;
        });
      }

      // Filtro por texto
      if (filter.value) {
        const searchTerm = filter.value.toLowerCase();
        resultado = resultado.filter(e =>
          e.encuesta?.titulo?.toLowerCase().includes(searchTerm) ||
          e.encuesta?.descripcion?.toLowerCase().includes(searchTerm)
        );
      }

      // Filtro por encuesta
      if (filtroEncuesta.value) {
        resultado = resultado.filter(e => e.encuesta_id === filtroEncuesta.value);
      }

      // Filtro por proyecto
      if (filtroProyecto.value) {
        resultado = resultado.filter(e =>
          e.encuesta && e.encuesta.proyecto_id === filtroProyecto.value
        );
      }

      // Filtro por usuario/aplicador
      if (filtroUsuario.value) {
        resultado = resultado.filter(e => e.aplicador_id === filtroUsuario.value);
      }

      // Filtro por fecha
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      if (filtroFecha.value === 'hoy') {
        resultado = resultado.filter(e => {
          const fechaEnvio = new Date(e.created_at);
          return fechaEnvio >= hoy;
        });
      } else if (filtroFecha.value === 'semana') {
        const inicioSemana = new Date(hoy);
        inicioSemana.setDate(hoy.getDate() - hoy.getDay()); // Domingo como inicio de semana
        resultado = resultado.filter(e => {
          const fechaEnvio = new Date(e.created_at);
          return fechaEnvio >= inicioSemana;
        });
      } else if (filtroFecha.value === 'mes') {
        const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        resultado = resultado.filter(e => {
          const fechaEnvio = new Date(e.created_at);
          return fechaEnvio >= inicioMes;
        });
      }

      return resultado;
    });

    // Observar cambios en los filtros para recargar automáticamente
    watch([filtroEncuesta, filtroProyecto, filtroUsuario, filtroFecha], () => {
      currentPage.value = 1; // Resetear página al cambiar filtros
      cargarEnvios();
    });

    // Limpiar todos los filtros
    function limpiarFiltros() {
      filter.value = '';
      filtroEncuesta.value = null;
      filtroProyecto.value = null;
      filtroUsuario.value = null;
      filtroFecha.value = 'todos';
      currentPage.value = 1;
      cargarEnvios();
    }

    // Cargar envíos según el rol del usuario
    async function cargarEnvios() {
      cargando.value = true;

      try {
        const params = {
          page: currentPage.value,
          per_page: 10
        };

        // Parámetros específicos según el rol
        if (isEncuestador.value || isAcademico.value) {
          // Encuestadores solo ven sus propios envíos
          params.aplicador_id = auth.user.id;
        } else if (isSupervisor.value && proyectos.value.length > 0) {
          // Para supervisores, filtramos por los IDs de los proyectos que supervisa
          if (filtroProyecto.value) {
            // Si hay un filtro específico de proyecto
            params.proyecto_id = filtroProyecto.value;
          } else {
            // Cargar todos los proyectos del supervisor
            const proyectosIds = proyectos.value
                                  .filter(p => p.responsable_id === auth.user.id)
                                  .map(p => p.id);
            if (proyectosIds.length > 0) {
              params.proyectos_ids = proyectosIds.join(',');
            }
          }
        }

        // Filtros adicionales si se seleccionaron
        if (filtroEncuesta.value) params.encuesta_id = filtroEncuesta.value;
        if (filtroUsuario.value) params.aplicador_id = filtroUsuario.value;

        console.log('Parámetros para cargar envíos:', params);

        // Cargar envíos con los parámetros correspondientes
        const response = await api.get('/envios', { params });

        console.log('Respuesta de envíos:', response.data);

        // Actualizar datos
        envios.value = response.data.data || [];
        totalPages.value = Math.ceil(response.data.total / response.data.per_page) || 1;

        // Cargar opciones para filtros
        await cargarOpcionesEncuestas();
        if (isAdmin.value || isSupervisor.value) {
          await cargarOpcionesProyectos();
        }
        if (isAdmin.value) {
          await cargarOpcionesUsuarios();
        }

        // Notificación de éxito con estilo personalizado
        if (!envios.value.length && hayFiltrosActivos.value) {
          $q.notify({
            type: 'warning',
            message: 'No hay resultados con los filtros actuales',
            position: 'top',
            timeout: 3000,
            progress: true,
            classes: 'notification-custom'
          });
        }

      } catch (error) {
        console.error('Error al cargar envíos:', error);
        $q.notify({
          type: 'negative',
          message: 'Error al cargar los envíos: ' + (error.response?.data?.message || error.message || 'Error desconocido'),
          position: 'top',
          timeout: 5000,
          progress: true,
          classes: 'notification-custom'
        });
      } finally {
        cargando.value = false;
      }
    }

    // Cargar opciones de encuestas para el filtro
    async function cargarOpcionesEncuestas() {
      try {
        // Obtener lista única de encuestas basada en los envíos
        const encuestasUnicas = {};
        envios.value.forEach(envio => {
          if (envio.encuesta && !encuestasUnicas[envio.encuesta.id]) {
            encuestasUnicas[envio.encuesta.id] = envio.encuesta.titulo;
          }
        });

        // Convertir a formato de opciones para q-select
        opcionesEncuestas.value = Object.entries(encuestasUnicas).map(([id, titulo]) => ({
          label: titulo,
          value: parseInt(id),
          icon: 'description'
        }));
      } catch (error) {
        console.error('Error al cargar opciones de encuestas:', error);
      }
    }

    // Cargar opciones de proyectos para el filtro (para admin y supervisor)
    async function cargarOpcionesProyectos() {
      try {
        // Para administradores cargamos todos los proyectos
        // Para supervisores filtramos por sus proyectos
        const response = await api.get('/proyectos');

        let proyectosData = response.data.data || response.data || [];

        // Filtrar proyectos según el rol
        if (isSupervisor.value) {
          proyectosData = proyectosData.filter(p => p.responsable_id === auth.user.id);
        }

        proyectos.value = proyectosData;

        // Actualizar opciones de proyectos para el filtro
        opcionesProyectos.value = proyectosData.map(p => ({
          label: p.titulo,
          value: p.id,
          icon: 'folder'
        }));
      } catch (error) {
        console.error('Error al cargar opciones de proyectos:', error);
      }
    }

    // Cargar opciones de usuarios para el filtro (solo admin)
    async function cargarOpcionesUsuarios() {
      try {
        // Solo administradores pueden filtrar por usuario
        if (!isAdmin.value) return;

        const response = await api.get('/usuarios');
        usuarios.value = response.data.data || response.data || [];

        // Actualizar opciones de usuarios para el filtro
        opcionesUsuarios.value = usuarios.value.map(u => ({
          label: `${u.nombres} ${u.apellidos} (${u.usuario})`,
          value: u.id,
          icon: 'person'
        }));
      } catch (error) {
        console.error('Error al cargar opciones de usuarios:', error);
      }
    }

    // Formatear fecha y hora
    function formatDateTime(dateStr) {
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
      // Si es esta semana
      const inicioSemana = new Date(hoy);
      inicioSemana.setDate(hoy.getDate() - hoy.getDay());
      if (fechaObj >= inicioSemana) {
        return date.formatDate(dateStr, 'dddd, HH:mm');
      }

      return date.formatDate(dateStr, 'DD/MM/YYYY HH:mm');
    }

    // Formatear coordenadas
    function formatLatLng(lat, lng) {
      if (!lat || !lng) return 'No disponible';
      return `${parseFloat(lat).toFixed(4)}°, ${parseFloat(lng).toFixed(4)}°`;
    }

    // Obtener nombre del aplicador
    function getNombreAplicador(envio) {
      if (envio.aplicador_id && auth.user && envio.aplicador_id === auth.user.id) {
        return 'Tú';
      }

      if (envio.aplicador) {
        return `${envio.aplicador.nombres || ''} ${envio.aplicador.apellidos || ''}`.trim() || 'Usuario';
      }

      return 'No especificado';
    }

    // Ver ubicación en mapa
    function verUbicacion(envio) {
      if (!envio.lat || !envio.lng) {
        $q.notify({
          type: 'warning',
          message: 'No hay coordenadas disponibles para este envío',
          position: 'top'
        });
        return;
      }

      envioSeleccionado.value = envio;
      mapDialog.value = true;

      // Cargar mapa después de que el diálogo se abra
      setTimeout(() => {
        inicializarMapa(envio.lat, envio.lng);
      }, 500);
    }

    // Inicializar mapa
    function inicializarMapa(lat, lng) {
      if (!ubicacionMapa.value) return;

      // Importar Leaflet de forma dinámica
      import('leaflet').then(L => {
        // Crear mapa si no existe
        if (!mapa) {
          mapa = L.map(ubicacionMapa.value).setView([lat, lng], 15);

          // Añadir capa base
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
          }).addTo(mapa);
        } else {
          // Actualizar vista si ya existe
          mapa.setView([lat, lng], 15);
        }

        // Crear icono personalizado con SVG
        const iconoPersonalizado = L.divIcon({
          html: `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36">
              <path fill="#663399" d="M12,2C8.13,2,5,5.13,5,9c0,5.25,7,13,7,13s7-7.75,7-13C19,5.13,15.87,2,12,2z" />
              <circle cx="12" cy="9" r="3" fill="#009999" />
            </svg>
          `,
          className: 'custom-marker-icon',
          iconSize: [36, 36],
          iconAnchor: [18, 36]
        });

        // Actualizar o crear marcador
        if (marcador) {
          marcador.setLatLng([lat, lng]);
        } else {
          marcador = L.marker([lat, lng], {
            icon: iconoPersonalizado
          }).addTo(mapa);
        }

        // Añadir popup con información
        marcador.bindPopup(`
          <div style="text-align: center;">
            <strong>Ubicación del envío</strong><br>
            Lat: ${parseFloat(lat).toFixed(6)}<br>
            Lng: ${parseFloat(lng).toFixed(6)}
          </div>
        `).openPopup();

        // Invalidar tamaño para asegurar renderizado correcto
        setTimeout(() => {
          mapa.invalidateSize();
        }, 300);
      });
    }

    // Exportar envío
    function exportarEnvio(envio) {
      const encuestaTitulo = envio.encuesta?.titulo || 'Sin título';

      $q.notify({
        type: 'info',
        message: `Preparando exportación de "${encuestaTitulo}"...`,
        position: 'top',
        timeout: 2000
      });

      // Aquí iría la lógica real de exportación
      // Por ahora es solo una función de demostración
      setTimeout(() => {
        $q.notify({
          type: 'positive',
          message: `Envío de "${encuestaTitulo}" exportado correctamente`,
          position: 'top'
        });
      }, 2000);
    }

    // Eliminar envío (solo admin)
    function eliminarEnvio(envio) {
      if (!isAdmin.value) return;

      $q.dialog({
        title: 'Confirmar eliminación',
        message: `¿Está seguro que desea eliminar el envío de la encuesta "${envio.encuesta?.titulo || 'Sin título'}"?`,
        cancel: true,
        persistent: true,
        color: 'negative',
        icon: 'delete_forever',
        class: 'custom-dialog'
      }).onOk(async () => {
        try {
          // Aquí iría la lógica real de eliminación
          // await api.delete(`/envios/${envio.id}`);

          $q.notify({
            type: 'positive',
            message: 'Envío eliminado correctamente',
            position: 'top',
            timeout: 3000,
            progress: true
          });

          // Recargar datos
          cargarEnvios();
        } catch (error) {
          console.error('Error al eliminar:', error);
          $q.notify({
            type: 'negative',
            message: 'Error al eliminar el envío',
            position: 'top'
          });
        }
      });
    }

    // Ciclo de vida del componente
    onMounted(() => {
      if (auth.isAuth && auth.user) {
        cargarEnvios();
      } else {
        $q.notify({
          type: 'warning',
          message: 'Debe iniciar sesión para ver los envíos',
          position: 'top',
          timeout: 3000,
          progress: true
        });
        // Redirigir al login
        router.push('/login');
      }
    });

    return {
      envios,
      enviosFiltrados,
      cargando,
      filter,
      currentPage,
      totalPages,
      filtroEncuesta,
      filtroProyecto,
      filtroUsuario,
      filtroFecha,
      opcionesEncuestas,
      opcionesProyectos,
      opcionesUsuarios,
      opcionesFecha,
      mapDialog,
      ubicacionMapa,
      hayFiltrosActivos,
      isAdmin,
      isSupervisor,
      isEncuestador,
      isAcademico,
      getTitleByRole,
      getSubtitleByRole,
      getNoResultsMessage,

      cargarEnvios,
      getNombreAplicador,
      formatDateTime,
      formatLatLng,
      verUbicacion,
      exportarEnvio,
      eliminarEnvio,
      limpiarFiltros
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
.envios-page {
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

/* Contenedor de envíos */
.envios-container {
  opacity: 0;
  animation: fadeIn 0.5s ease forwards 0.1s;
}

/* Tarjetas de envíos */
.envio-card {
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
    background: linear-gradient(to bottom, var(--color-primary), var(--color-secondary));
    opacity: 0.7;
    transition: opacity 0.3s ease;
  }

  /* Título de envío */
  .envio-title {
    color: var(--color-primary);
    font-weight: 500;
    margin-bottom: 8px;
    display: flex;
    align-items: center;

    .q-icon {
      margin-right: 8px;
    }
  }

  /* Fecha */
  .date-text {
    color: var(--color-text-light);
    display: flex;
    align-items: center;
    font-size: 0.9rem;
  }

  /* Etiqueta de proyecto */
  .project-tag {
    display: inline-flex;
    align-items: center;
    background-color: rgba(0, 153, 153, 0.1);
    color: var(--color-secondary);
    padding: 3px 8px;
    border-radius: 12px;
    font-size: 0.75rem;
    border: 1px solid rgba(0, 153, 153, 0.2);
  }

  /* Contenedor de información */
  .info-container {
    background-color: rgba(245, 247, 250, 0.5);
    border-radius: 8px;
    padding: 10px 12px;
    border: 1px solid rgba(0, 0, 0, 0.05);
  }

  /* Información de ubicación */
  .location-info {
    display: flex;
    align-items: center;
    font-size: 0.85rem;
  }

  /* Información de aplicador */
  .aplicador-info {
    display: flex;
    align-items: center;
    font-size: 0.85rem;
  }

  /* Botón de detalles */
  .details-btn {
    border-radius: 8px;
    transition: all 0.3s ease;
    border: 1px solid transparent;

    &:hover {
      background-color: rgba(102, 51, 153, 0.1);
      border-color: var(--color-primary);
    }
  }
}

/* Marcador personalizado para el mapa */
.custom-marker-icon {
  background: none !important;

  svg {
    filter: drop-shadow(0 3px 5px rgba(0, 0, 0, 0.3));
  }
}

/* Diálogo del mapa */
.map-dialog-card {
  border-radius: 12px;
  overflow: hidden;

  #ubicacion-mapa {
    border-radius: 8px;
    border: 1px solid var(--color-border);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  }
}

/* Paginación personalizada */
.pagination-custom {
  :deep(.q-btn) {
    border-radius: 50%;
    transition: all 0.3s ease;
  }

  :deep(.q-btn.q-btn--active) {
    background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
    box-shadow: 0 3px 8px rgba(102, 51, 153, 0.3);
  }
}

/* Diálogos personalizados */
.custom-dialog {
  .q-card {
    border-radius: 12px;
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
    border-top: 4px solid var(--color-primary);
    overflow: hidden;
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

  .envio-card {
    .text-right {
      text-align: left;
      margin-top: 12px;
    }
  }

  .q-card-section {
    padding: 16px !important;
  }
}
</style>
