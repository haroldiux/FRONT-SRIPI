<template>
  <q-page padding class="estadisticas-page">
    <!-- Cabecera con efecto de gradiente -->
    <div class="header-container q-mb-lg">
      <div class="row items-center">
        <div class="col-12 col-md-8">
          <h1 class="page-title text-h4 q-mb-sm">📊 Análisis de Encuestas</h1>
          <p class="text-subtitle1 q-mb-none subtitle-text">
            {{ getSubtitleByRole }}
          </p>
        </div>
        <div class="col-12 col-md-4 q-pt-sm q-pt-md-none text-right">
          <q-btn color="primary" icon="file_download" label="Exportar a Excel" :loading="exportando"
            @click="exportarDatos" :disable="!encuestaSeleccionada || !datosDisponibles" class="export-btn" />
        </div>
      </div>
    </div>

    <!-- Filtros superiores -->
    <q-card class="filter-panel q-mb-md">
      <q-card-section class="q-pa-md">
        <div class="row items-center q-col-gutter-md">
          <!-- Selector de encuesta -->
          <div class="col-12 col-md">
            <q-select v-model="encuestaSeleccionada" :options="opcionesEncuestas" outlined dense
              label="Selecciona una encuesta" emit-value map-options @update:model-value="cargarDatosEncuesta"
              class="filter-select">
              <template v-slot:prepend>
                <q-icon name="assignment" color="primary" />
              </template>
              <template v-slot:no-option>
                <div class="text-center q-pa-sm">No hay encuestas disponibles</div>
              </template>
            </q-select>
          </div>

          <!-- Selector de aplicador (solo para admin/supervisor) -->
          <div v-if="isAdmin || isSupervisor" class="col-12 col-md">
            <q-select v-model="aplicadorSeleccionado" :options="opcionesAplicadores" outlined dense
              label="Filtrar por aplicador" emit-value map-options clearable @update:model-value="filtrarPorAplicador"
              :disable="!encuestaSeleccionada" class="filter-select">
              <template v-slot:prepend>
                <q-icon name="person" color="primary" />
              </template>
              <template v-slot:no-option>
                <div class="text-center q-pa-sm">No hay aplicadores disponibles</div>
              </template>
            </q-select>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Estado de carga -->
    <div v-if="cargando" class="loader-container q-pa-xl text-center">
      <q-spinner-dots color="primary" size="60px" />
      <div class="text-subtitle1 q-mt-md">Cargando datos de la encuesta...</div>
    </div>

    <!-- Sin encuesta seleccionada -->
    <div v-else-if="!encuestaSeleccionada" class="empty-state q-pa-xl text-center">
      <q-icon name="bar_chart" size="80px" class="empty-icon" color="primary" />
      <div class="text-h6 q-mt-md empty-title">Selecciona una encuesta para ver sus estadísticas</div>
      <div class="empty-subtitle q-mt-sm">
        Podrás visualizar gráficos y descargar reportes de las respuestas
      </div>
    </div>

    <!-- Encuesta seleccionada pero sin datos -->
    <div v-else-if="!datosDisponibles" class="empty-state q-pa-xl text-center">
      <q-icon name="analytics" size="80px" class="empty-icon" color="orange" />
      <div class="text-h6 q-mt-md empty-title">No hay datos disponibles</div>
      <div class="empty-subtitle q-mt-sm">
        {{ getMensajeSinDatos }}
      </div>
    </div>

    <!-- Datos disponibles - Mostrar estadísticas -->
    <div v-else>
      <!-- Resumen general -->
      <q-card class="resumen-card q-mb-lg">
        <q-card-section>
          <div class="row items-center q-col-gutter-lg">
            <div class="col-12 col-md-4">
              <div class="text-h6 q-mb-sm">
                <q-icon name="assignment" color="primary" size="sm" class="q-mr-xs" />
                {{ infoEncuesta.titulo }}
              </div>
              <div v-if="infoEncuesta.descripcion" class="text-body2 q-mb-sm">
                {{ infoEncuesta.descripcion }}
              </div>
              <div v-if="infoEncuesta.proyecto" class="project-tag q-mt-xs">
                <q-icon name="folder" size="xs" class="q-mr-xs" />
                <span>{{ infoEncuesta.proyecto.titulo || 'Sin proyecto' }}</span>
              </div>
            </div>

            <div class="col-12 col-md-4">
              <q-circular-progress :value="porcentajeCompletado" size="120px" :thickness="0.15" color="secondary"
                track-color="grey-3" class="q-ma-md progress-circular" center-color="white" :min="0" :max="100"
                :animate="true">
                <div class="text-center">
                  <div class="text-h6">{{ enviosActuales }}</div>
                  <div class="text-caption">de {{ objetivoTotal }}</div>
                </div>
              </q-circular-progress>
            </div>

            <div class="col-12 col-md-4">
              <div class="text-h6">Progreso</div>
              <q-linear-progress :value="porcentajeCompletado / 100" size="md" :color="getColorProgreso"
                class="q-my-md progress-linear" rounded stripe animate />
              <div class="row justify-between text-caption">
                <div>{{ enviosActuales }} envíos completados</div>
                <div>{{ objetivoTotal }} objetivo</div>
              </div>

              <!-- Para aplicador específico (cuando está filtrado) -->
              <div v-if="aplicadorSeleccionado" class="q-mt-md">
                <div class="text-subtitle2">Progreso del aplicador seleccionado</div>
                <q-linear-progress :value="porcentajeCompletadoAplicador / 100" size="md" color="accent"
                  class="q-my-md progress-linear-aplicador" rounded stripe animate />
                <div class="row justify-between text-caption">
                  <div>{{ enviosAplicador }} envíos</div>
                  <div>{{ objetivoAplicador }} objetivo</div>
                </div>
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Gráficos por preguntas -->
      <div class="graficos-container">
        <div v-for="pregunta in preguntasConGraficos" :key="pregunta.id" class="q-mb-xl">
          <q-card class="grafico-card">
            <q-card-section>
              <div class="text-h6 q-mb-lg grafico-titulo">
                <q-icon :name="getIconoPregunta(pregunta.tipo)" color="primary" class="q-mr-sm" />
                {{ pregunta.enunciado }}
              </div>

              <div class="row justify-between items-center q-mb-md">
                <div class="text-caption text-grey">
                  {{ getTotalRespuestas(pregunta) }} respuestas
                </div>

                <!-- Selector de tipo de gráfico (solo para tipos compatibles) -->
                <div v-if="tieneOpcionesMultiples(pregunta)">
                  <q-btn-toggle v-model="tiposGrafico[pregunta.id]" :options="[
                    { label: 'Barras', value: 'bar', icon: 'bar_chart' },
                    { label: 'Pastel', value: 'pie', icon: 'pie_chart' }
                  ]" color="primary" text-color="white" toggle-color="accent"
                    @update:model-value="actualizarGrafico(pregunta.id)" size="sm" dense rounded unelevated />
                </div>
              </div>

              <!-- Contenedor del gráfico -->
              <div :id="`grafico-${pregunta.id}`" class="grafico-container" style="position: relative; height: 300px;">
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>
  </q-page>
</template>
<script>
import { defineComponent, ref, computed, onMounted, watch, nextTick } from 'vue';
import { api } from 'boot/axios';
import { useQuasar, date } from 'quasar';
import { useAuthStore } from 'src/stores/auth.store';
import { useRouter } from 'vue-router';
import * as XLSX from 'xlsx';
import * as d3 from 'd3';

export default defineComponent({
  name: 'EstadisticasEncuestaPage',

  setup() {
    const $q = useQuasar();
    const auth = useAuthStore();
    const router = useRouter();

    // Referencias a los gráficos
    const graficos = ref({});
    const tiposGrafico = ref({});

    // Variables reactivas
    const cargando = ref(false);
    const exportando = ref(false);
    const encuestaSeleccionada = ref(null);
    const aplicadorSeleccionado = ref(null);
    const opcionesEncuestas = ref([]);
    const opcionesAplicadores = ref([]);
    const infoEncuesta = ref({});
    const respuestas = ref([]);
    const preguntas = ref([]);
    const asignaciones = ref([]);

    // Detección del rol del usuario actual
    const isAdmin = computed(() => auth.user?.rol_id === 1);
    const isSupervisor = computed(() => auth.user?.rol_id === 2);
    const isEncuestador = computed(() => auth.user?.rol_id === 3);
    const isAcademico = computed(() => auth.user?.rol_id === 4);

    // Subtítulo según el rol
    const getSubtitleByRole = computed(() => {
      if (isAdmin.value) return 'Visualiza y analiza los datos de todas las encuestas';
      if (isSupervisor.value) return 'Analiza los resultados de las encuestas de tus proyectos';
      return 'Visualiza estadísticas de tus encuestas realizadas';
    });

    // Mensaje cuando no hay datos
    const getMensajeSinDatos = computed(() => {
      if (aplicadorSeleccionado.value) {
        return `El aplicador seleccionado no ha realizado envíos para esta encuesta`;
      }
      return `No se han registrado envíos para esta encuesta todavía`;
    });

    // Datos disponibles
    const datosDisponibles = computed(() => {
      return respuestas.value.length > 0;
    });

    // Estadísticas de objetivos y progreso
    const objetivoTotal = computed(() => {
      if (asignaciones.value.length === 0) return 0;
      return asignaciones.value.reduce((sum, asignacion) => sum + asignacion.objetivo, 0);
    });

    const enviosActuales = computed(() => {
      return respuestas.value.length > 0 ?
        [...new Set(respuestas.value.map(r => r.envio_id))].length : 0;
    });

    const porcentajeCompletado = computed(() => {
      if (objetivoTotal.value === 0) return 0;
      return Math.min(Math.round((enviosActuales.value / objetivoTotal.value) * 100), 100);
    });

    const getColorProgreso = computed(() => {
      const porcentaje = porcentajeCompletado.value;
      if (porcentaje >= 100) return 'positive';
      if (porcentaje >= 70) return 'secondary';
      if (porcentaje >= 30) return 'accent';
      return 'negative';
    });

    // Estadísticas del aplicador seleccionado
    const objetivoAplicador = computed(() => {
      if (!aplicadorSeleccionado.value) return 0;
      const asignacion = asignaciones.value.find(a =>
        a.usuario_id === aplicadorSeleccionado.value);
      return asignacion ? asignacion.objetivo : 0;
    });

    const enviosAplicador = computed(() => {
      if (!aplicadorSeleccionado.value) return 0;

      // Obtener IDs únicos de envíos realizados por este aplicador
      const enviosIds = respuestas.value
        .filter(r => r.envio && r.envio.aplicador_id === aplicadorSeleccionado.value)
        .map(r => r.envio_id);

      return [...new Set(enviosIds)].length;
    });

    const porcentajeCompletadoAplicador = computed(() => {
      if (objetivoAplicador.value === 0) return 0;
      return Math.min(Math.round((enviosAplicador.value / objetivoAplicador.value) * 100), 100);
    });

    // Preguntas que pueden visualizarse con gráficos
    const preguntasConGraficos = computed(() => {
      return preguntas.value.filter(p =>
        ['option', 'multiple', 'checkbox', 'scale', 'number', 'date'].includes(p.tipo)
      );
    });

    // Verifica si una pregunta tiene opciones múltiples (para cambiar tipo de gráfico)
    function tieneOpcionesMultiples(pregunta) {
      return ['option', 'multiple', 'checkbox'].includes(pregunta.tipo);
    }

    // Icono según el tipo de pregunta
    function getIconoPregunta(tipo) {
      const iconos = {
        'text': 'short_text',
        'textarea': 'subject',
        'number': 'pin',
        'option': 'radio_button_checked',
        'multiple': 'check_box',
        'checkbox': 'check_box_outline_blank',
        'scale': 'linear_scale',
        'date': 'calendar_today'
      };
      return iconos[tipo] || 'help';
    }

    // Cargar encuestas disponibles según rol
    async function cargarEncuestasDisponibles() {
      cargando.value = true;
      try {
        let params = {};

        // Diferentes parámetros según el rol
        if (isEncuestador.value || isAcademico.value) {
          params.aplicador_id = auth.user.id;
        } else if (isSupervisor.value) {
          params.responsable_id = auth.user.id;
        }

        const response = await api.get('/encuestas/disponibles-analisis', { params });

        opcionesEncuestas.value = (response.data.data || []).map(e => ({
          label: e.titulo,
          value: e.id,
          icon: 'assignment'
        }));

        // Autoseleccionar si solo hay una opción
        if (opcionesEncuestas.value.length === 1) {
          encuestaSeleccionada.value = opcionesEncuestas.value[0].value;
          await cargarDatosEncuesta();
        }

      } catch (error) {
        console.error('Error al cargar encuestas disponibles:', error);
        $q.notify({
          type: 'negative',
          message: 'Error al cargar encuestas disponibles',
          position: 'top'
        });
      } finally {
        cargando.value = false;
      }
    }

    // Cargar datos de la encuesta seleccionada
    async function cargarDatosEncuesta() {
      if (!encuestaSeleccionada.value) return;

      cargando.value = true;
      aplicadorSeleccionado.value = null; // Resetear filtro de aplicador

      // Destruir gráficos previos
      Object.entries(graficos.value).forEach(([id, chart]) => {
        if (chart) {
          try {
            chart.destroy();
          } catch (e) {
            console.warn(`Error al destruir gráfico ${id}:`, e);
          }
        }
      });
      graficos.value = {};

      try {
        // 1. Cargar información de la encuesta
        const encuestaResponse = await api.get(`/encuestas/${encuestaSeleccionada.value}`);
        infoEncuesta.value = encuestaResponse.data;

        // 2. Cargar preguntas
        preguntas.value = [];
        if (infoEncuesta.value.secciones) {
          infoEncuesta.value.secciones.forEach(seccion => {
            if (seccion.preguntas) {
              preguntas.value = [...preguntas.value, ...seccion.preguntas];
            }
          });
        }

        // 3. Cargar respuestas
        const respuestasParams = { encuesta_id: encuestaSeleccionada.value };

        // Para encuestadores y académicos, solo ver sus propios envíos
        if (isEncuestador.value || isAcademico.value) {
          respuestasParams.aplicador_id = auth.user.id;
        }

        const respuestasResponse = await api.get('/respuestas', { params: respuestasParams });
        respuestas.value = respuestasResponse.data.data || [];

        // 4. Cargar asignaciones
        const asignacionesResponse = await api.get('/asignaciones', {
          params: { encuesta_id: encuestaSeleccionada.value }
        });
        asignaciones.value = asignacionesResponse.data.data || [];

        // 5. Cargar opciones de aplicadores (para admins y supervisores)
        if (isAdmin.value || isSupervisor.value) {
          await cargarOpcionesAplicadores();
        }

        // 6. Inicializar tipos de gráficos por defecto
        preguntasConGraficos.value.forEach(p => {
          tiposGrafico.value[p.id] = tieneOpcionesMultiples(p) ? 'bar' : 'bar';
        });

        // 7. Renderizar gráficos después de que el DOM se actualice
        // Usar un tiempo más largo para asegurarse de que el DOM esté listo
        setTimeout(() => {
          nextTick(() => {
            renderizarGraficos();
          });
        }, 500);

      } catch (error) {
        console.error('Error al cargar datos de la encuesta:', error);
        $q.notify({
          type: 'negative',
          message: 'Error al cargar datos de la encuesta',
          position: 'top'
        });
      } finally {
        cargando.value = false;
      }
    }

    // Cargar opciones de aplicadores
    async function cargarOpcionesAplicadores() {
      if (!encuestaSeleccionada.value) return;

      try {
        const params = { encuesta_id: encuestaSeleccionada.value };

        // Para supervisores, solo ver aplicadores de sus proyectos
        if (isSupervisor.value) {
          params.responsable_id = auth.user.id;
        }

        const response = await api.get('/aplicadores-por-encuesta', { params });
        const aplicadores = response.data.data || [];

        opcionesAplicadores.value = aplicadores.map(a => ({
          label: `${a.nombres} ${a.apellidos} (${a.usuario || 'Sin código'})`,
          value: a.id,
          objetivo: a.objetivo || 0
        }));

      } catch (error) {
        console.error('Error al cargar aplicadores:', error);
      }
    }

    // Filtrar datos por aplicador seleccionado
    function filtrarPorAplicador() {
      // Re-renderizar los gráficos cuando cambia el filtro
      renderizarGraficos();
    }

    // Obtener total de respuestas para una pregunta
    function getTotalRespuestas(pregunta) {
      // Filtrar respuestas por la pregunta actual
      let respuestasFiltradas = respuestas.value.filter(r => r.pregunta_id === pregunta.id);

      // Si hay un aplicador seleccionado, filtrar solo sus respuestas
      if (aplicadorSeleccionado.value) {
        respuestasFiltradas = respuestasFiltradas.filter(r =>
          r.envio && r.envio.aplicador_id === aplicadorSeleccionado.value
        );
      }

      return respuestasFiltradas.length;
    }

    // Renderizar gráficos para todas las preguntas
    function renderizarGraficos() {
      // Ya no necesitamos destruir gráficos de Chart.js
      graficos.value = {}; // Reiniciar el objeto de gráficos

      // Esperar a que el DOM se actualice completamente
      setTimeout(() => {
        nextTick(() => {
          // Renderizar cada gráfico con un pequeño retraso entre ellos
          preguntasConGraficos.value.forEach((pregunta, index) => {
            setTimeout(() => {
              try {
                renderizarGraficoPregunta(pregunta);
              } catch (error) {
                console.error(`Error al renderizar gráfico para pregunta ${pregunta.id}:`, error);
              }
            }, index * 100); // Escalonar el renderizado para evitar problemas
          });
        });
      }, 500);
    }

    // Renderizar un gráfico específico para una pregunta
    function renderizarGraficoPregunta(pregunta) {
      const elementId = `grafico-${pregunta.id}`;
      const container = document.getElementById(elementId);

      if (!container) {
        console.warn(`Contenedor con id ${elementId} no encontrado`);
        return;
      }

      // Limpiar el contenedor
      container.innerHTML = '';

      // Filtrar respuestas por la pregunta actual
      let respuestasPregunta = respuestas.value.filter(r => r.pregunta_id === pregunta.id);

      // Si hay un aplicador seleccionado, filtrar solo sus respuestas
      if (aplicadorSeleccionado.value) {
        respuestasPregunta = respuestasPregunta.filter(r =>
          r.envio && r.envio.aplicador_id === aplicadorSeleccionado.value
        );
      }

      // Si no hay respuestas, mostrar mensaje
      if (respuestasPregunta.length === 0) {
        const noDataDiv = document.createElement('div');
        noDataDiv.className = 'text-center q-py-md';
        noDataDiv.innerHTML = '<p class="text-grey">No hay datos disponibles</p>';
        container.appendChild(noDataDiv);
        return;
      }

      // Preparar datos según el tipo de pregunta
      let data = [];

      switch (pregunta.tipo) {
        case 'option':
        case 'multiple':
        case 'checkbox': {
          // Contar frecuencias de opciones seleccionadas
          const opcionesCounts = {};

          respuestasPregunta.forEach(respuesta => {
            if (respuesta.opciones && respuesta.opciones.length > 0) {
              respuesta.opciones.forEach(opcion => {
                opcionesCounts[opcion.id] = (opcionesCounts[opcion.id] || 0) + 1;
              });
            }
          });

          // Preparar datos para D3
          data = pregunta.opciones.map(o => ({
            label: o.texto,
            value: opcionesCounts[o.id] || 0
          }));
          break;
        }

        case 'scale': {
          // Agrupar por valor de escala
          const scaleValues = {};

          respuestasPregunta.forEach(respuesta => {
            const valor = respuesta.valor_escala;
            if (valor !== null && valor !== undefined) {
              scaleValues[valor] = (scaleValues[valor] || 0) + 1;
            }
          });

          // Ordenar valores de menor a mayor
          const sortedScaleValues = Object.keys(scaleValues)
            .map(v => parseInt(v))
            .sort((a, b) => a - b);

          // Preparar datos para D3
          data = sortedScaleValues.map(value => ({
            label: value.toString(),
            value: scaleValues[value]
          }));
          break;
        }

        case 'number': {
          // Agrupar por rangos para números
          const numValues = respuestasPregunta
            .map(r => parseFloat(r.valor_num))
            .filter(v => !isNaN(v));

          if (numValues.length === 0) {
            const noDataDiv = document.createElement('div');
            noDataDiv.className = 'text-center q-py-md';
            noDataDiv.innerHTML = '<p class="text-grey">No hay datos numéricos disponibles</p>';
            container.appendChild(noDataDiv);
            return;
          }

          // Crear rangos (hasta 10 barras)
          const min = Math.min(...numValues);
          const max = Math.max(...numValues);

          // Protección contra división por cero si min === max
          const step = min === max ? 1 : (max - min) / 10;

          // Si todos los valores son iguales
          if (min === max) {
            data = [{ label: min.toString(), value: numValues.length }];
          } else {
            const ranges = [];
            const counts = [];

            for (let i = 0; i < 10; i++) {
              const rangeMin = min + (step * i);
              const rangeMax = i === 9 ? max : min + (step * (i + 1));

              const rangeLabel = `${rangeMin.toFixed(1)} - ${rangeMax.toFixed(1)}`;
              const count = numValues.filter(v => v >= rangeMin && v <= rangeMax).length;

              if (count > 0) {
                ranges.push(rangeLabel);
                counts.push(count);
              }
            }

            data = ranges.map((range, i) => ({
              label: range,
              value: counts[i]
            }));
          }
          break;
        }

        case 'date': {
          // Agrupar por meses para fechas
          const dateGroups = {};

          respuestasPregunta.forEach(respuesta => {
            if (respuesta.valor_texto) {
              try {
                const fecha = new Date(respuesta.valor_texto);
                if (!isNaN(fecha.getTime())) {
                  const mes = fecha.toLocaleString('default', { month: 'long', year: 'numeric' });
                  dateGroups[mes] = (dateGroups[mes] || 0) + 1;
                }
              } catch (e) {
                console.error('Error al parsear fecha:', e);
              }
            }
          });

          const dateLabels = Object.keys(dateGroups);

          if (dateLabels.length === 0) {
            const noDataDiv = document.createElement('div');
            noDataDiv.className = 'text-center q-py-md';
            noDataDiv.innerHTML = '<p class="text-grey">No hay fechas disponibles</p>';
            container.appendChild(noDataDiv);
            return;
          }

          data = dateLabels.map(label => ({
            label: label,
            value: dateGroups[label]
          }));
          break;
        }

        default: {
          // Para otros tipos de preguntas o si no hay un tipo reconocido
          const noDataDiv = document.createElement('div');
          noDataDiv.className = 'text-center q-py-md';
          noDataDiv.innerHTML = '<p class="text-grey">No se puede graficar este tipo de pregunta</p>';
          container.appendChild(noDataDiv);
          return;
        }
      }

      // Si no hay datos después de procesar, mostrar mensaje
      if (data.length === 0) {
        const noDataDiv = document.createElement('div');
        noDataDiv.className = 'text-center q-py-md';
        noDataDiv.innerHTML = '<p class="text-grey">No hay datos disponibles</p>';
        container.appendChild(noDataDiv);
        return;
      }

      // Determinar tipo de gráfico
      const tipoGrafico = tiposGrafico.value[pregunta.id] || 'bar';

      // Crear SVG
      const margin = { top: 20, right: 20, bottom: 70, left: 40 };
      const width = container.clientWidth - margin.left - margin.right;
      const height = 280 - margin.top - margin.bottom;

      const svg = d3.select(container)
        .append('svg')
        .attr('width', '100%')
        .attr('height', height + margin.top + margin.bottom)
        .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      if (tipoGrafico === 'bar') {
        // Crear escalas
        const x = d3.scaleBand()
          .range([0, width])
          .domain(data.map(d => d.label))
          .padding(0.2);

        const y = d3.scaleLinear()
          .range([height, 0])
          .domain([0, d3.max(data, d => d.value) * 1.1 || 1]); // Añadir un poco de espacio arriba

        // Añadir ejes
        svg.append('g')
          .attr('transform', `translate(0,${height})`)
          .call(d3.axisBottom(x))
          .selectAll('text')
          .attr('transform', 'translate(-10,0)rotate(-45)')
          .style('text-anchor', 'end')
          .style('font-size', '12px');

        svg.append('g')
          .call(d3.axisLeft(y).ticks(5).tickFormat(d => d))
          .selectAll('text')
          .style('font-size', '12px');

        // Añadir barras
        const colors = generateColors(data.length);

        svg.selectAll('.bar')
          .data(data)
          .enter()
          .append('rect')
          .attr('class', 'bar')
          .attr('x', d => x(d.label))
          .attr('y', d => y(d.value))
          .attr('width', x.bandwidth())
          .attr('height', d => height - y(d.value))
          .attr('fill', (_, i) => colors[i])
          .on('mouseover', function (event, d) {
            d3.select(this).attr('opacity', 0.8);

            // Tooltip simple
            svg.append('text')
              .attr('class', 'tooltip-text')
              .attr('x', x(d.label) + x.bandwidth() / 2)
              .attr('y', y(d.value) - 10)
              .attr('text-anchor', 'middle')
              .style('font-size', '12px')
              .style('font-weight', 'bold')
              .text(d.value);
          })
          .on('mouseout', function () {
            d3.select(this).attr('opacity', 1);
            svg.selectAll('.tooltip-text').remove();
          });

        // Añadir valores en las barras
        svg.selectAll('.label')
          .data(data)
          .enter()
          .append('text')
          .attr('class', 'label')
          .attr('x', d => x(d.label) + x.bandwidth() / 2)
          .attr('y', d => y(d.value) - 5)
          .attr('text-anchor', 'middle')
          .style('font-size', '12px')
          .text(d => d.value);

      } else if (tipoGrafico === 'pie') {
        // Crear un gráfico de pastel
        const radius = Math.min(width, height) / 2;

        const pie = d3.pie()
          .value(d => d.value)
          .sort(null);

        const arc = d3.arc()
          .innerRadius(0)
          .outerRadius(radius * 0.8);

        const outerArc = d3.arc()
          .innerRadius(radius * 0.9)
          .outerRadius(radius * 0.9);

        const pieData = pie(data);

        const pieGroup = svg.append('g')
          .attr('transform', `translate(${width / 2},${height / 2})`);

        const colors = generateColors(data.length);

        // Añadir secciones del pie
        pieGroup.selectAll('path')
          .data(pieData)
          .enter()
          .append('path')
          .attr('d', arc)
          .attr('fill', (_, i) => colors[i])
          .attr('stroke', 'white')
          .style('stroke-width', '2px')
          .style('opacity', 0.7)
          .on('mouseover', function () {
            d3.select(this).style('opacity', 1);
          })
          .on('mouseout', function () {
            d3.select(this).style('opacity', 0.7);
          });

        // Añadir etiquetas
        const labels = pieGroup.selectAll('text')
          .data(pieData)
          .enter()
          .append('text')
          .attr('transform', d => {
            const pos = outerArc.centroid(d);
            const midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2;
            pos[0] = radius * 0.95 * (midAngle < Math.PI ? 1 : -1);
            return `translate(${pos})`;
          })
          .style('text-anchor', d => {
            const midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2;
            return midAngle < Math.PI ? 'start' : 'end';
          });

        labels.append('tspan')
          .text(d => d.data.label)
          .attr('x', 0)
          .attr('dy', '0em')
          .style('font-size', '12px');

        labels.append('tspan')
          .text(d => `(${d.data.value})`)
          .attr('x', 0)
          .attr('dy', '1.2em')
          .style('font-size', '12px')
          .style('font-weight', 'bold');

        // Añadir líneas conectoras
        pieGroup.selectAll('polyline')
          .data(pieData)
          .enter()
          .append('polyline')
          .attr('points', d => {
            const pos = outerArc.centroid(d);
            const midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2;
            pos[0] = radius * 0.95 * (midAngle < Math.PI ? 1 : -1);
            return [arc.centroid(d), outerArc.centroid(d), pos];
          })
          .style('fill', 'none')
          .style('stroke', 'rgba(0, 0, 0, 0.3)')
          .style('stroke-width', '1px');
      }

      // Guardar referencia al gráfico (en este caso, el contenedor)
      graficos.value[pregunta.id] = container;
    }

    // Actualizar un gráfico específico cuando cambia el tipo
    function actualizarGrafico(preguntaId) {
      const pregunta = preguntas.value.find(p => p.id === preguntaId);
      if (pregunta) {
        // Simplemente volver a renderizar el gráfico
        renderizarGraficoPregunta(pregunta);
      }
    }

    // Generar colores aleatorios para gráficos
    function generateColors(count) {
      // Colores predefinidos
      const colors = [
        'rgba(102, 51, 153, 0.7)',  // Púrpura (color primario)
        'rgba(0, 153, 153, 0.7)',   // Verde azulado (color secundario)
        'rgba(0, 170, 170, 0.7)',   // Verde azulado claro (color acento)
        'rgba(75, 192, 192, 0.7)',  // Turquesa
        'rgba(153, 102, 255, 0.7)', // Lavanda
        'rgba(255, 159, 64, 0.7)',  // Naranja
        'rgba(255, 99, 132, 0.7)',  // Rosa
        'rgba(54, 162, 235, 0.7)',  // Azul
        'rgba(255, 206, 86, 0.7)'   // Amarillo
      ];

      // Si hay más opciones que colores, generar colores adicionales
      if (count > colors.length) {
        for (let i = colors.length; i < count; i++) {
          const r = Math.floor(Math.random() * 200) + 50;
          const g = Math.floor(Math.random() * 200) + 50;
          const b = Math.floor(Math.random() * 200) + 50;
          colors.push(`rgba(${r}, ${g}, ${b}, 0.7)`);
        }
      }

      return colors.slice(0, count);
    }

    // Exportar datos a Excel
    async function exportarDatos() {
      if (!encuestaSeleccionada.value || !datosDisponibles.value) return;

      exportando.value = true;

      try {
        // Preparar estructura del Excel
        const workbook = XLSX.utils.book_new();

        // Obtener los envíos únicos
        const enviosIds = [...new Set(respuestas.value.map(r => r.envio_id))];

        // Filtrar por aplicador seleccionado si existe
        let enviosData = [];
        if (aplicadorSeleccionado.value) {
          const enviosIdsAplicador = [...new Set(
            respuestas.value
              .filter(r => r.envio && r.envio.aplicador_id === aplicadorSeleccionado.value)
              .map(r => r.envio_id)
          )];

          enviosData = enviosIdsAplicador;
        } else {
          enviosData = enviosIds;
        }

        // Obtener datos de todos los envíos
        const enviosResponse = await api.get('/envios/detalles', {
          params: {
            encuesta_id: encuestaSeleccionada.value,
            aplicador_id: aplicadorSeleccionado.value || undefined,
            envios_ids: enviosData.join(',')
          }
        });

        const envios = enviosResponse.data.data || [];

        // Construir encabezados (todas las preguntas)
        const headers = [
          'ID Envío',
          'Fecha de Envío',
          'Aplicador',
          'Código Aplicador',
          'Latitud',
          'Longitud'
        ];

        // Agregar encabezados de preguntas
        preguntas.value.forEach(p => {
          headers.push(p.enunciado);
        });

        // Preparar filas
        const rows = envios.map(envio => {
          const row = [
            envio.id,
            formatDateTime(envio.created_at),
            envio.aplicador ? `${envio.aplicador.nombres || ''} ${envio.aplicador.apellidos || ''}`.trim() : 'No especificado',
            envio.aplicador ? envio.aplicador.usuario : '',
            envio.lat || '',
            envio.lng || ''
          ];

          // Agregar respuestas
          preguntas.value.forEach(pregunta => {
            const respuesta = envio.respuestas.find(r => r.pregunta_id === pregunta.id);

            if (respuesta) {
              switch (pregunta.tipo) {
                case 'text':
                case 'textarea':
                case 'date':
                  row.push(respuesta.valor_texto || '');
                  break;
                case 'number':
                  row.push(respuesta.valor_num || '');
                  break;
                case 'scale':
                  row.push(respuesta.valor_escala || '');
                  break;
                case 'option':
                case 'multiple':
                case 'checkbox':
                  if (respuesta.opciones && respuesta.opciones.length) {
                    row.push(respuesta.opciones.map(o => o.texto).join(', '));
                  } else {
                    row.push('');
                  }
                  break;
                default:
                  row.push('');
              }
            } else {
              row.push(''); // Sin respuesta
            }
          });

          return row;
        });

        // Crear la hoja de cálculo
        const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);

        // Ajustar anchos de columna
        const colWidths = headers.map((h, i) => {
          // Calcular ancho basado en contenido
          let maxWidth = h.length;

          rows.forEach(row => {
            if (row[i] && String(row[i]).length > maxWidth) {
              maxWidth = String(row[i]).length;
            }
          });

          // Limitar ancho máximo y mínimo
          return Math.max(8, Math.min(50, maxWidth + 2));
        });

        worksheet['!cols'] = colWidths.map(width => ({ wch: width }));

        // Agregar la hoja al libro
        const sheetName = infoEncuesta.value.titulo.substring(0, 30).replace(/[\\/[\]*?:]/g, ''); XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

        // Generar el archivo
        const filename = `Encuesta_${infoEncuesta.value.id}_${Date.now()}.xlsx`;
        XLSX.writeFile(workbook, filename);

        $q.notify({
          type: 'positive',
          message: 'Datos exportados correctamente',
          position: 'top',
          timeout: 3000
        });

      } catch (error) {
        console.error('Error al exportar datos:', error);
        $q.notify({
          type: 'negative',
          message: 'Error al exportar datos',
          position: 'top'
        });
      } finally {
        exportando.value = false;
      }
    }

    // Formatear fecha y hora
    function formatDateTime(dateStr) {
      if (!dateStr) return 'No especificada';

      try {
        return date.formatDate(dateStr, 'DD/MM/YYYY HH:mm');
      } catch {
        return dateStr;
      }
    }

    // Ciclo de vida del componente
    onMounted(async () => {
      if (!auth.isAuth || !auth.user) {
        $q.notify({
          type: 'warning',
          message: 'Debe iniciar sesión para ver las estadísticas',
          position: 'top',
          timeout: 3000
        });
        router.push('/login');
        return;
      }

      await cargarEncuestasDisponibles();
    });

    // Observar cambios en encuestaSeleccionada
    watch(encuestaSeleccionada, () => {
      // Limpiar datos actuales
      infoEncuesta.value = {};
      respuestas.value = [];
      preguntas.value = [];
      asignaciones.value = [];
      aplicadorSeleccionado.value = null;

      // Destruir gráficos previos
      Object.values(graficos.value).forEach(chart => {
        if (chart) chart.destroy();
      });
      graficos.value = {};

      if (encuestaSeleccionada.value) {
        cargarDatosEncuesta();
      }
    });

    return {
      cargando,
      exportando,
      encuestaSeleccionada,
      aplicadorSeleccionado,
      opcionesEncuestas,
      opcionesAplicadores,
      infoEncuesta,
      respuestas,
      preguntas,
      asignaciones,
      tiposGrafico,
      preguntasConGraficos,

      isAdmin,
      isSupervisor,
      isEncuestador,
      isAcademico,
      getSubtitleByRole,
      getMensajeSinDatos,
      datosDisponibles,

      objetivoTotal,
      enviosActuales,
      porcentajeCompletado,
      getColorProgreso,
      objetivoAplicador,
      enviosAplicador,
      porcentajeCompletadoAplicador,

      cargarEncuestasDisponibles,
      cargarDatosEncuesta,
      cargarOpcionesAplicadores,
      filtrarPorAplicador,
      getTotalRespuestas,
      renderizarGraficos,
      actualizarGrafico,
      getIconoPregunta,
      tieneOpcionesMultiples,
      exportarDatos,
      formatDateTime,
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
.estadisticas-page {
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

/* Botón de exportación */
.export-btn {
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  border-radius: 8px;
  padding: 8px 16px;
  font-weight: 500;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 1;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 15px rgba(102, 51, 153, 0.3);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
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

/* Estado de carga */
.loader-container {
  padding: 60px 0;
  background-color: white;
  border-radius: 12px;
  box-shadow: var(--card-shadow);
  animation: fadeIn 0.5s ease forwards;
  border: 1px solid var(--color-border);
}

/* Estado vacío */
.empty-state {
  padding: 60px 0;
  background-color: white;
  border-radius: 12px;
  box-shadow: var(--card-shadow);
  animation: fadeIn 0.5s ease forwards;
  border: 1px solid var(--color-border);

  .empty-icon {
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

/* Tarjeta de resumen */
.resumen-card {
  border-radius: 16px;
  background-color: white;
  box-shadow: var(--card-shadow);
  transition: all 0.3s ease;
  overflow: hidden;
  border-left: 6px solid var(--color-primary);

  &:hover {
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    transform: translateY(-3px);
  }

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

  /* Progress circular */
  .progress-circular {
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    transition: all 0.4s ease;

    &:hover {
      transform: scale(1.05);
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
    }
  }

  /* Progress linear */
  .progress-linear {
    height: 12px;
    border-radius: 6px;
    overflow: hidden;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .progress-linear-aplicador {
    height: 8px;
    border-radius: 4px;
    overflow: hidden;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
  }
}

/* Tarjeta de gráfico */
.grafico-card {
  border-radius: 16px;
  background-color: white;
  box-shadow: var(--card-shadow);
  transition: all 0.3s ease;
  overflow: hidden;
  border-top: 4px solid var(--color-secondary);

  &:hover {
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.15);
    transform: translateY(-5px);
  }

  .grafico-titulo {
    position: relative;
    color: var(--color-primary);
    padding-bottom: 8px;
    border-bottom: 1px dashed rgba(0, 153, 153, 0.2);

    &::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      width: 100px;
      height: 2px;
      background: linear-gradient(to right, var(--color-primary), var(--color-secondary));
      border-radius: 2px;
    }
  }

  .grafico-container {
    position: relative;
    padding: 16px;
    background-color: rgba(245, 247, 250, 0.5);
    border-radius: 8px;
    border: 1px solid rgba(0, 0, 0, 0.05);
  }
}

/* Animaciones */
@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Ajustes responsivos */
@media (max-width: 767px) {
  .header-container {
    padding: 16px;
  }

  .grafico-card {
    margin-bottom: 24px;
  }
}
</style>
