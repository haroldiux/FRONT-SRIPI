<template>
  <q-page padding>
    <div class="q-pa-md">
      <div class="row items-center q-mb-md">
        <div class="col-12 col-md-8">
          <h1 class="text-h4 q-mb-sm text-primary">
            {{ getTitleByRole }}
          </h1>
          <p class="text-subtitle1 q-mb-none">{{ getSubtitleByRole }}</p>
        </div>
        <div class="col-12 col-md-4 q-pt-sm q-pt-md-none">
          <q-input
            v-model="filter"
            outlined
            dense
            clearable
            placeholder="Buscar por encuesta"
            class="full-width"
          >
            <template v-slot:append>
              <q-icon name="search" />
            </template>
          </q-input>
        </div>
      </div>

      <!-- Filtros adicionales -->
      <div class="row items-center q-mb-md">
        <!-- Filtro de proyecto (solo para supervisores y admins) -->
        <div v-if="isAdmin || isSupervisor" class="col-12 col-md-auto q-mb-sm q-mb-md-none">
          <q-select
            v-model="filtroProyecto"
            :options="opcionesProyectos"
            outlined
            dense
            label="Proyecto"
            emit-value
            map-options
            clearable
            class="q-mr-sm"
            style="min-width: 200px"
          />
        </div>

        <!-- Filtro de encuesta -->
        <div class="col-12 col-md-auto q-mb-sm q-mb-md-none">
          <q-select
            v-model="filtroEncuesta"
            :options="opcionesEncuestas"
            outlined
            dense
            label="Encuesta"
            emit-value
            map-options
            clearable
            class="q-mr-sm"
            style="min-width: 200px"
          />
        </div>

        <!-- Filtro de usuario (solo para admins) -->
        <div v-if="isAdmin" class="col-12 col-md-auto q-mb-sm q-mb-md-none">
          <q-select
            v-model="filtroUsuario"
            :options="opcionesUsuarios"
            outlined
            dense
            label="Aplicador"
            emit-value
            map-options
            clearable
            class="q-mr-sm"
            style="min-width: 200px"
          />
        </div>

        <!-- Filtro de fecha -->
        <div class="col-12 col-md-auto">
          <q-select
            v-model="filtroFecha"
            :options="opcionesFecha"
            outlined
            dense
            label="Fecha"
            emit-value
            map-options
            class="q-mr-sm"
            style="min-width: 150px"
          />
        </div>

        <!-- Botón de actualizar -->
        <div class="col-12 col-md-grow q-mt-sm q-mt-md-none text-right">
          <q-btn
            color="primary"
            icon="refresh"
            label="Actualizar"
            @click="cargarEnvios"
            :loading="cargando"
          />
        </div>
      </div>

      <!-- Loading y sin resultados -->
      <div v-if="cargando" class="full-width text-center q-pa-lg">
        <q-spinner-dots color="primary" size="40px" />
        <div class="text-subtitle1 q-mt-sm">Cargando envíos...</div>
      </div>

      <div v-else-if="!enviosFiltrados.length" class="text-center q-pa-xl">
        <q-icon name="inventory" color="grey-5" size="6rem" />
        <div class="text-h6 text-grey-7 q-mt-md">No se encontraron envíos</div>
        <div class="text-grey-7">
          {{ getNoResultsMessage }}
        </div>
      </div>

      <!-- Lista de envíos -->
      <div v-else class="row q-col-gutter-md">
        <div v-for="envio in enviosFiltrados" :key="envio.id" class="col-12">
          <q-card class="envio-card">
            <q-card-section class="q-py-md">
              <div class="row items-center">
                <!-- Información principal -->
                <div class="col-12 col-md-4">
                  <div class="text-h6 text-primary">{{ envio.encuesta ? envio.encuesta.titulo : 'Encuesta' }}</div>
                  <div class="text-subtitle2">
                    <q-icon name="event" size="xs" class="q-mr-xs" />
                    <span>{{ formatDateTime(envio.created_at) }}</span>
                  </div>
                  <!-- Mostrar proyecto si aplica -->
                  <div v-if="envio.encuesta && envio.encuesta.proyecto" class="text-caption">
                    <q-icon name="folder" size="xs" class="q-mr-xs" />
                    <span>Proyecto: {{ envio.encuesta.proyecto.titulo || 'Sin proyecto' }}</span>
                  </div>
                </div>

                <!-- Información adicional -->
                <div class="col-12 col-md-4 q-py-md q-py-md-none">
                  <div v-if="envio.lat && envio.lng" class="text-caption q-mb-xs">
                    <q-icon name="location_on" size="xs" class="q-mr-xs" />
                    Ubicación: {{ formatLatLng(envio.lat, envio.lng) }}
                  </div>
                  <div class="text-caption">
                    <q-icon name="assignment_ind" size="xs" class="q-mr-xs" />
                    Aplicador: {{ getNombreAplicador(envio) }}
                  </div>
                </div>

                <!-- Acciones -->
                <div class="col-12 col-md-4 text-right">
                  <q-btn
                    color="primary"
                    icon="visibility"
                    label="Ver detalles"
                    :to="`/encuestadores/envio/${envio.id}`"
                    flat
                  />
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Paginación -->
      <div class="row justify-center q-mt-lg" v-if="totalPages > 1">
        <q-pagination
          v-model="currentPage"
          :max="totalPages"
          direction-links
          boundary-links
          @update:model-value="cargarEnvios"
        />
      </div>
    </div>
  </q-page>
</template>

<script>
import { defineComponent, ref, computed, onMounted } from 'vue';
import { api } from 'boot/axios';
import { useQuasar } from 'quasar';
import { date } from 'quasar';
import { useAuthStore } from 'src/stores/auth.store';
import { useRouter } from 'vue-router';

export default defineComponent({
  name: 'EnviosListPage',

  setup() {
    const $q = useQuasar();
    const auth = useAuthStore();
    const router = useRouter();

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

    // Detección del rol del usuario actual
    const isAdmin = computed(() => auth.user?.rol_id === 1);
    const isSupervisor = computed(() => auth.user?.rol_id === 2);
    const isEncuestador = computed(() => auth.user?.rol_id === 3);

    // Títulos dinámicos según el rol
    const getTitleByRole = computed(() => {
      if (isAdmin.value) return 'Historial de Envíos';
      if (isSupervisor.value) return 'Envíos de mis Proyectos';
      return 'Mis Envíos Realizados';
    });

    const getSubtitleByRole = computed(() => {
      if (isAdmin.value) return 'Todos los envíos del sistema';
      if (isSupervisor.value) return 'Envíos de los proyectos que supervisas';
      return 'Historial de encuestas completadas';
    });

    // Mensaje cuando no hay resultados
    const getNoResultsMessage = computed(() => {
      if (filter.value || filtroEncuesta.value || filtroFecha.value || filtroProyecto.value || filtroUsuario.value) {
        return 'Intenta con otros filtros';
      }

      if (isEncuestador.value) {
        return 'Aún no has enviado ninguna encuesta';
      }
      if (isSupervisor.value) {
        return 'No hay envíos en los proyectos que supervisas';
      }
      return 'No hay envíos registrados en el sistema';
    });

    // Opciones para filtros
    const opcionesFecha = [
      { label: 'Todos los períodos', value: 'todos' },
      { label: 'Hoy', value: 'hoy' },
      { label: 'Esta semana', value: 'semana' },
      { label: 'Este mes', value: 'mes' }
    ];

    // Computed properties para filtrado
    const enviosFiltrados = computed(() => {
      // Comenzamos con todos los envíos cargados
      let resultado = [...envios.value];

      // Filtro según el rol del usuario
      if (isEncuestador.value) {
        // Encuestadores solo ven sus propios envíos
        resultado = resultado.filter(e => e.aplicador_id === auth.user.id);
      } else if (isSupervisor.value && !filtroProyecto.value) {
        // Supervisores ven envíos de sus proyectos
        // Esto asume que hay una relación entre supervisor y proyectos
        // y que los proyectos están incluidos en los datos de envío
        resultado = resultado.filter(e => {
          // Verificar si la encuesta tiene un proyecto asignado al supervisor
          return e.encuesta &&
                 e.encuesta.proyecto &&
                 e.encuesta.proyecto.responsable_id === auth.user.id;
        });
      }

      // Filtro por texto
      if (filter.value) {
        const searchTerm = filter.value.toLowerCase();
        resultado = resultado.filter(e =>
          e.encuesta?.titulo?.toLowerCase().includes(searchTerm)
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

    // Cargar envíos según el rol del usuario
    async function cargarEnvios() {
      cargando.value = true;

      try {
        const params = {
          page: currentPage.value,
          per_page: 10
        };

        // Parámetros específicos según el rol
        if (isEncuestador.value) {
          // Encuestadores solo ven sus propios envíos
          params.aplicador_id = auth.user.id;
        } else if (isSupervisor.value && proyectos.value.length > 0) {
          // Para supervisores, filtramos por los IDs de los proyectos que supervisa
          // Esto requiere un endpoint que acepte múltiples IDs de proyecto
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

      } catch (error) {
        console.error('Error al cargar envíos:', error);
        $q.notify({
          type: 'negative',
          message: 'Error al cargar los envíos: ' + (error.response?.data?.message || error.message || 'Error desconocido'),
          position: 'top'
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
          value: parseInt(id)
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
          value: p.id
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
          value: u.id
        }));
      } catch (error) {
        console.error('Error al cargar opciones de usuarios:', error);
      }
    }

    // Formatear fecha y hora
    function formatDateTime(dateStr) {
      if (!dateStr) return 'No especificada';
      return date.formatDate(dateStr, 'DD/MM/YYYY HH:mm');
    }

    // Formatear coordenadas
    function formatLatLng(lat, lng) {
      if (!lat || !lng) return 'No disponible';
      return `${parseFloat(lat).toFixed(6)}, ${parseFloat(lng).toFixed(6)}`;
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

    // Ciclo de vida del componente
    onMounted(() => {
      if (auth.isAuth && auth.user) {
        cargarEnvios();
      } else {
        $q.notify({
          type: 'warning',
          message: 'Debe iniciar sesión para ver los envíos',
          position: 'top'
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
      isAdmin,
      isSupervisor,
      isEncuestador,
      getTitleByRole,
      getSubtitleByRole,
      getNoResultsMessage,

      cargarEnvios,
      getNombreAplicador,
      formatDateTime,
      formatLatLng
    };
  }
});
</script>

<style lang="scss" scoped>
.envio-card {
  transition: all 0.2s;
  border-radius: 8px;
  overflow: hidden;
}

.envio-card:hover {
  box-shadow: 0 8px 12px rgba(0, 0, 0, 0.1);
}

/* Animación para los elementos cargados */
.envio-card {
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

/* Ajustes responsive */
@media (max-width: 767px) {
  .text-right {
    text-align: left;
    margin-top: 10px;
  }
}
</style>
