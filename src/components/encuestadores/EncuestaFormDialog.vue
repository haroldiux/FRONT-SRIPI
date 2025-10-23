<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" persistent
    transition-show="fade" transition-hide="fade" maximized>
    <q-card class="bg-white encuesta-dialog" data-aos="zoom-in" data-aos-duration="400">
      <!-- Header -->
      <q-card-section class="dialog-header-section" :class="previewMode ? 'bg-teal' : 'bg-purple'"
        style="color: white;">
        <div class="text-h6 row items-center">
          <q-icon :name="previewMode ? 'visibility' : 'assignment'" class="q-mr-sm" />
          {{ previewMode ? 'Vista Previa de Encuesta' : 'Nueva Encuesta' }}
          <q-badge outline color="white" class="q-ml-md" v-if="formData.secciones.length > 0">
            {{ totalQuestions }} preguntas en {{ formData.secciones.length }} secciones
          </q-badge>
        </div>
        <div>
          <q-btn flat round dense :icon="previewMode ? 'edit' : 'visibility'" @click="togglePreviewMode"
            class="q-mr-sm mode-toggle-btn" :color="previewMode ? 'white' : 'white'">
            <q-tooltip anchor="bottom middle" self="top middle" :offset="[0, 8]">
              {{ previewMode ? 'Volver a Edición' : 'Ver Vista Previa' }}
            </q-tooltip>
          </q-btn>
          <q-btn flat round dense icon="close" @click="confirmClose">
            <q-tooltip anchor="bottom middle" self="top middle" :offset="[0, 8]">
              Cerrar
            </q-tooltip>
          </q-btn>
        </div>
      </q-card-section>

      <q-separator />

      <!-- BODY con scroll -->
      <q-card-section class="dialog-body-section q-pa-md" style="max-height: 80vh; overflow: auto;">
        <!-- MODO EDICIÓN -->
        <q-form ref="formRef" @submit="onSubmit" class="q-gutter-lg" v-if="!previewMode">
          <!-- INFORMACIÓN GENERAL -->
          <q-card flat bordered class="form-card" data-aos="fade-up" data-aos-delay="100">
            <q-card-section>
              <div class="row items-center">
                <q-icon name="description" color="purple" size="24px" class="q-mr-sm" />
                <div class="text-subtitle1 text-weight-bold">Información de la Encuesta</div>
              </div>

              <q-input filled dense class="col-12 col-md-6 q-mt-md custom-input" v-model="formData.titulo"
                label="Título de la Encuesta *" placeholder="Ej: Estudio de Satisfacción 2025"
                :rules="[val => !!val || 'El título es requerido']" />

              <q-input filled autogrow class="q-mt-md custom-input" v-model="formData.descripcion" label="Descripción"
                type="textarea" placeholder="Describe el propósito o contexto del estudio..." />

              <div class="row q-col-gutter-md q-mt-md">
                <q-input filled dense class="col-12 col-md-3 custom-input" v-model="formData.fechaInicio"
                  label="Fecha de Inicio *" mask="##/##/####" placeholder="dd/mm/aaaa"
                  :rules="[val => !!val || 'La fecha es requerida']">
                  <template v-slot:append>
                    <q-icon name="event" class="cursor-pointer">
                      <q-popup-proxy transition-show="scale" transition-hide="scale">
                        <q-date v-model="formData.fechaInicio" mask="DD/MM/YYYY" color="teal">
                          <div class="row justify-end">
                            <q-btn v-close-popup flat label="Cerrar" color="teal" />
                          </div>
                        </q-date>
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>

                <q-input filled dense class="col-12 col-md-3 custom-input" v-model="formData.fechaFinal"
                  label="Fecha de Fin" mask="##/##/####" placeholder="dd/mm/aaaa">
                  <template v-slot:append>
                    <q-icon name="event" class="cursor-pointer">
                      <q-popup-proxy transition-show="scale" transition-hide="scale">
                        <q-date v-model="formData.fechaFinal" mask="DD/MM/YYYY" color="teal">
                          <div class="row justify-end">
                            <q-btn v-close-popup flat label="Cerrar" color="teal" />
                          </div>
                        </q-date>
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>

                <!-- Estado activo/inactivo -->
                <div class="col-12 col-md-3 flex items-center">
                  <q-toggle v-model="formData.activa" color="teal" label="Encuesta activa" left-label />
                </div>
              </div>
            </q-card-section>
          </q-card>

          <!-- SECCIONES -->
          <q-card flat bordered class="form-card" data-aos="fade-up" data-aos-delay="200">
            <q-card-section>
              <div class="row items-center">
                <q-icon name="view_list" color="purple" size="24px" class="q-mr-sm" />
                <div class="text-subtitle1 text-weight-bold">Secciones (encabezados)</div>
                <q-space />
                <q-btn color="teal" icon="add" label="Agregar sección" size="sm" unelevated class="add-section-btn"
                  @click="addSection" />
              </div>

              <!-- KEY para forzar re-render tras eliminar/mover -->
              <div class="q-mt-md" :key="sectionsKey">
                <q-banner v-if="!formData.secciones.length" class="bg-grey-2 text-grey-8 rounded-12 q-pa-md"
                  data-aos="fade-up">
                  <q-icon name="info" color="teal" size="24px" class="q-mr-sm vertical-middle" />
                  Agrega tu primera sección (por ejemplo: <em>Datos personales</em>).
                </q-banner>

                <div v-for="(sec, si) in formData.secciones" :key="sec.id" class="q-mb-md" data-aos="fade-up"
                  :data-aos-delay="150 + (si * 50)">
                  <q-expansion-item dense expand-separator :label="sec.titulo || `Sección ${si + 1}`"
                    :caption="`${sec.preguntas.length} pregunta(s)`" icon="folder"
                    header-class="text-purple expansion-header" default-opened class="section-expansion-item">
                    <!-- Header sección -->
                    <q-card>
                      <q-card-section class="q-pa-md">
                        <div class="row q-col-gutter-md q-mt-sm">
                          <q-input filled dense class="col-12 col-md-6 custom-input" v-model="sec.titulo"
                            label="Nombre de la sección *" :rules="[val => !!val || 'El título es requerido']" />
                          <q-input filled dense class="col-12 col-md-6 custom-input" v-model="sec.descripcion"
                            label="Descripción (opcional)" />
                        </div>

                        <div class="row q-gutter-sm q-mt-sm">
                          <q-btn color="teal" icon="add" label="Agregar pregunta" size="sm" unelevated
                            class="action-btn" @click="addQuestion(si)" />
                          <q-btn outline color="teal" icon="arrow_upward" label="Subir" size="sm" class="action-btn"
                            :disable="si === 0" @click="moveSection(si, -1)" />
                          <q-btn outline color="teal" icon="arrow_downward" label="Bajar" size="sm" class="action-btn"
                            :disable="si === formData.secciones.length - 1" @click="moveSection(si, 1)" />
                          <q-space />
                          <q-btn flat color="negative" icon="delete" label="Eliminar sección" size="sm"
                            class="action-btn" @click="removeSection(si)" />
                        </div>

                        <!-- Preguntas de la sección -->
                        <div class="q-mt-md">
                          <div v-for="(preg, qi) in sec.preguntas" :key="preg.id" class="q-mb-md question-box"
                            data-aos="fade-right" :data-aos-delay="100 + (qi * 50)">
                            <q-separator spaced />
                            <div class="row items-center justify-between q-mb-sm q-px-md q-pt-md">
                              <div class="text-body1 text-weight-medium flex items-center">
                                <q-badge color="purple" class="q-mr-sm">{{ qi + 1 }}</q-badge>
                                Pregunta
                              </div>
                              <div class="row q-gutter-xs">
                                <q-btn dense flat round color="teal" icon="arrow_upward" :disable="qi === 0"
                                  @click="moveQuestion(si, qi, -1)">
                                  <q-tooltip>Mover arriba</q-tooltip>
                                </q-btn>
                                <q-btn dense flat round color="teal" icon="arrow_downward"
                                  :disable="qi === sec.preguntas.length - 1" @click="moveQuestion(si, qi, 1)">
                                  <q-tooltip>Mover abajo</q-tooltip>
                                </q-btn>
                                <q-btn dense flat round color="negative" icon="delete" v-if="sec.preguntas.length > 1"
                                  @click="removeQuestion(si, qi)">
                                  <q-tooltip>Eliminar pregunta</q-tooltip>
                                </q-btn>
                              </div>
                            </div>

                            <q-card-section class="q-px-md q-pt-none">
                              <q-input filled dense v-model="preg.enunciado" label="Texto de la pregunta *"
                                placeholder="Escriba la pregunta…" class="custom-input"
                                :rules="[val => !!val || 'El enunciado es requerido']" />

                              <div class="row q-col-gutter-md q-mt-sm">
                                <q-select class="col-12 col-md-6 custom-input" filled dense emit-value map-options
                                  v-model="preg.tipo" :options="tiposPreguntas" label="Tipo de pregunta"
                                  @update:model-value="(v) => typeChanged(si, qi, v)" />
                                <div class="col-12 col-md-6 flex items-center">
                                  <q-checkbox v-model="preg.obligatoria" label="Pregunta obligatoria" color="teal" />
                                </div>
                              </div>

                              <!-- Opciones (radio/checkbox) -->
                              <div v-if="['single', 'multi'].includes(preg.tipo)" class="q-mt-sm q-pl-md">
                                <div class="row items-center q-col-gutter-sm q-mb-xs" v-for="(opt, oi) in preg.opciones"
                                  :key="oi" data-aos="fade-right" :data-aos-delay="100 + (oi * 30)">
                                  <q-input dense outlined class="col custom-input" v-model="opt.texto"
                                    placeholder="Texto de la opción" />
                                  <q-btn dense flat round icon="remove" color="negative"
                                    @click="removeOpcion(si, qi, oi)" />
                                </div>
                                <q-btn outline dense icon="add" size="sm" label="Agregar opción" color="teal"
                                  class="q-mt-xs" @click="addOpcion(si, qi)" />
                              </div>

                              <!-- Escala -->
                              <div v-else-if="preg.tipo === 'scale'" class="q-mt-md q-pl-md">
                                <div class="row q-col-gutter-md">
                                  <q-input dense outlined class="col-3 custom-input" v-model.number="preg.min"
                                    label="Mín" type="number" />
                                  <q-input dense outlined class="col-3 custom-input" v-model.number="preg.max"
                                    label="Máx" type="number" />
                                </div>
                                <q-slider v-model="preg.previewValue" :min="preg.min || 0" :max="preg.max || 10"
                                  color="teal" markers label class="q-mt-sm" />
                              </div>

                              <!-- Fecha -->
                              <div v-else-if="preg.tipo === 'date'" class="q-mt-sm q-pl-md">
                                <q-input v-model="preg.previewValue" dense outlined mask="##/##/####"
                                  placeholder="dd/mm/aaaa" class="custom-input">
                                  <template v-slot:append>
                                    <q-icon name="event" class="cursor-pointer">
                                      <q-popup-proxy transition-show="scale" transition-hide="scale">
                                        <q-date v-model="preg.previewValue" mask="DD/MM/YYYY" color="teal">
                                          <div class="row justify-end">
                                            <q-btn v-close-popup flat label="Cerrar" color="teal" />
                                          </div>
                                        </q-date>
                                      </q-popup-proxy>
                                    </q-icon>
                                  </template>
                                </q-input>
                              </div>

                              <!-- Texto largo -->
                              <div v-else-if="preg.tipo === 'textarea'" class="q-mt-sm q-pl-md">
                                <q-input v-model="preg.previewValue" type="textarea" rows="3" dense outlined
                                  placeholder="Respuesta larga…" class="custom-input" />
                              </div>

                              <!-- Texto corto -->
                              <div v-else-if="preg.tipo === 'text'" class="q-mt-sm q-pl-md">
                                <q-input v-model="preg.previewValue" dense outlined placeholder="Respuesta corta…"
                                  class="custom-input" />
                              </div>

                              <!-- Número -->
                              <div v-else-if="preg.tipo === 'number'" class="q-mt-sm q-pl-md">
                                <q-input v-model="preg.previewValue" type="number" dense outlined placeholder="0"
                                  class="custom-input" />
                              </div>
                            </q-card-section>
                          </div>
                        </div>
                      </q-card-section>
                    </q-card>
                  </q-expansion-item>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </q-form>

        <!-- MODO VISTA PREVIA -->
        <div v-else class="preview-container" data-aos="fade-up">
          <q-card class="preview-card" bordered>
            <!-- Reemplaza la sección de información/título con esto: -->
            <q-card-section class="preview-header bg-gradient" style="color: white !important;">
              <div class="text-h5 q-mb-xs"
                style="color: white !important; font-weight: bold !important; opacity: 1 !important;">{{ formData.titulo
                  || 'Sin título' }}</div>
              <p class="q-ma-none text-body1" style="color: white !important; opacity: 1 !important;">{{
                formData.descripcion ||
                'Sin descripción' }}</p>
              <div class="text-caption q-mt-sm" v-if="formData.fechaInicio" style="color: white !important;">
                <q-icon name="event" size="xs" class="q-mr-xs" /> Disponible desde: {{ formData.fechaInicio }}
                <span v-if="formData.fechaFinal"> hasta {{ formData.fechaFinal }}</span>
              </div>
            </q-card-section>

            <q-separator />

            <q-card-section v-for="(seccion, i) in formData.secciones" :key="seccion.id" class="preview-section"
              data-aos="fade-up" :data-aos-delay="100 * i">
              <div class="text-h6 q-mb-md section-title">
                <q-icon name="bookmark" color="teal" size="xs" class="q-mr-xs" />
                {{ i + 1 }}. {{ seccion.titulo }}
              </div>
              <p v-if="seccion.descripcion" class="q-mb-lg text-grey-8">{{ seccion.descripcion }}</p>

              <div v-for="(pregunta, pregIndex) in seccion.preguntas" :key="pregunta.id"
                class="preview-question q-mb-lg" data-aos="fade-up" :data-aos-delay="50 * pregIndex">
                <div class="row items-center q-mb-sm">
                  <div class="text-subtitle1 question-text">
                    <span class="question-number">{{ i + 1 }}.{{ pregIndex + 1 }}.</span>
                    {{ pregunta.enunciado }}
                  </div>
                  <q-badge v-if="pregunta.obligatoria" color="negative" class="q-ml-sm">Obligatoria</q-badge>
                </div>

                <!-- Componente según el tipo de pregunta -->
                <div class="q-pl-md q-mt-sm">
                  <!-- Texto corto -->
                  <q-input v-if="pregunta.tipo === 'text'" outlined dense placeholder="Escriba su respuesta aquí"
                    class="custom-input" />

                  <!-- Texto largo -->
                  <q-input v-else-if="pregunta.tipo === 'textarea'" type="textarea" outlined autogrow
                    placeholder="Escriba su respuesta aquí" class="custom-input" />

                  <!-- Número -->
                  <q-input v-else-if="pregunta.tipo === 'number'" type="number" outlined dense placeholder="0"
                    class="custom-input" />

                  <!-- Opciones simples (radio) -->
                  <div v-else-if="pregunta.tipo === 'single'" class="q-mt-sm">
                    <q-option-group v-model="pregunta.previewValue"
                      :options="pregunta.opciones.map(opt => ({ label: opt.texto, value: opt.id }))" type="radio"
                      color="teal" class="custom-option-group" />
                  </div>

                  <!-- Opciones múltiples (checkbox) -->
                  <div v-else-if="pregunta.tipo === 'multi'" class="q-mt-sm">
                    <q-option-group v-model="pregunta.previewValue"
                      :options="pregunta.opciones.map(opt => ({ label: opt.texto, value: opt.id }))" type="checkbox"
                      color="teal" class="custom-option-group" />
                  </div>

                  <!-- Escala -->
                  <div v-else-if="pregunta.tipo === 'scale'" class="q-mt-md">
                    <div class="row justify-between q-mb-xs scale-labels">
                      <div class="text-caption">{{ pregunta.min }}</div>
                      <div class="text-caption">{{ pregunta.max }}</div>
                    </div>
                    <q-slider v-model="pregunta.previewValue" :min="pregunta.min" :max="pregunta.max" :step="1" label
                      markers color="teal" />
                  </div>

                  <!-- Fecha -->
                  <div v-else-if="pregunta.tipo === 'date'" class="q-mt-sm">
                    <q-input outlined dense placeholder="dd/mm/aaaa" mask="##/##/####" class="custom-input">
                      <template v-slot:append>
                        <q-icon name="event" class="cursor-pointer">
                          <q-popup-proxy transition-show="scale" transition-hide="scale">
                            <q-date mask="DD/MM/YYYY" color="teal">
                              <div class="row justify-end">
                                <q-btn v-close-popup flat label="Cerrar" color="teal" />
                              </div>
                            </q-date>
                          </q-popup-proxy>
                        </q-icon>
                      </template>
                    </q-input>
                  </div>
                </div>
              </div>
            </q-card-section>

            <q-separator />

            <q-card-section class="preview-footer">
              <q-btn unelevated color="teal" label="Enviar Respuestas" class="q-mr-sm" icon="send" />
              <q-btn outline color="grey-7" label="Borrar Todo" icon="delete_sweep" />
            </q-card-section>
          </q-card>
        </div>
      </q-card-section>

      <!-- Actions -->
      <q-separator />
      <q-card-actions align="right" class="q-pa-md bg-grey-1">
        <q-btn flat color="grey-7" label="Cancelar" @click="confirmClose" />
        <q-btn v-if="!previewMode" unelevated color="teal" label="Guardar Encuesta" @click="onSubmit"
          :loading="submitting" icon-right="save" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useQuasar, uid } from 'quasar'
import { api } from 'src/boot/axios'
import { useAuthStore } from 'src/stores/auth.store'
import { onMounted } from 'vue'

// Props y emisiones
const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  proyectoId: {
    type: Number,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'save', 'cancel'])

// Servicios y refs
const $q = useQuasar()
const auth = useAuthStore()
const formRef = ref(null)
const submitting = ref(false)
const sectionsKey = ref(0) // Key para forzar re-render de secciones
const previewMode = ref(false) // Estado para modo vista previa

// Calcular el total de preguntas en toda la encuesta
const totalQuestions = computed(() => {
  return formData.value.secciones.reduce((total, seccion) => {
    return total + seccion.preguntas.length
  }, 0)
})

// Inicialización de AOS
onMounted(() => {
  if (window.AOS) {
    window.AOS.init({
      duration: 800,
      easing: 'ease-out-cubic',
      once: false
    })
  }
})

// Toggle entre modo edición y vista previa
function togglePreviewMode() {
  // Validar datos mínimos antes de permitir la vista previa
  if (!previewMode.value) {
    // Verificar que hay datos básicos
    if (!formData.value.titulo.trim()) {
      $q.notify({
        type: 'warning',
        message: 'Agregue al menos un título a la encuesta antes de ver la vista previa',
        position: 'top',
        color: 'teal',
        icon: 'warning'
      })
      return
    }

    // Verificar que hay al menos una sección
    if (formData.value.secciones.length === 0) {
      $q.notify({
        type: 'warning',
        message: 'Agregue al menos una sección a la encuesta antes de ver la vista previa',
        position: 'top',
        color: 'teal',
        icon: 'warning'
      })
      return
    }

    // Verificar que cada sección tiene al menos un título
    for (let i = 0; i < formData.value.secciones.length; i++) {
      const section = formData.value.secciones[i]

      if (!section.titulo.trim()) {
        $q.notify({
          type: 'warning',
          message: `La sección ${i + 1} debe tener un título`,
          position: 'top',
          color: 'teal',
          icon: 'warning'
        })
        return
      }

      // Verificar que cada pregunta tiene al menos un enunciado
      for (let j = 0; j < section.preguntas.length; j++) {
        if (!section.preguntas[j].enunciado.trim()) {
          $q.notify({
            type: 'warning',
            message: `La pregunta ${j + 1} en la sección "${section.titulo}" debe tener un enunciado`,
            position: 'top',
            color: 'teal',
            icon: 'warning'
          })
          return
        }
      }
    }
  }

  // Cambiar al modo opuesto con una transición suave
  // Animar el cambio de modo con AOS
  if (window.AOS) {
    window.AOS.refresh()
  }
  previewMode.value = !previewMode.value
}

// Tipos de pregunta disponibles
const tiposPreguntas = [
  { label: 'Texto corto', value: 'text' },
  { label: 'Texto largo', value: 'textarea' }, // Cambiado a 'textarea' para distinguirlo claramente
  { label: 'Número', value: 'number' },
  { label: 'Opción múltiple', value: 'single' },
  { label: 'Casillas', value: 'multi' },
  { label: 'Escala', value: 'scale' },
  { label: 'Fecha', value: 'date' }
]

// Estado inicial del formulario
const formData = ref({
  titulo: '',
  descripcion: '',
  fechaInicio: '',
  fechaFinal: '',
  activa: true,
  secciones: [
    {
      id: uid(),
      titulo: 'Sección 1',
      descripcion: '',
      preguntas: [
        {
          id: uid(),
          enunciado: '',
          tipo: 'text',
          obligatoria: true,
          previewValue: '',
          min: 0,
          max: 10
        }
      ]
    }
  ]
})

// Usuario actual para establecer creador_id
const currentUserId = computed(() => {
  return auth.user?.id || null
})

// FUNCIONES PARA SECCIONES
function addSection() {
  formData.value.secciones.push({
    id: uid(),
    titulo: `Sección ${formData.value.secciones.length + 1}`,
    descripcion: '',
    preguntas: [
      { id: uid(), enunciado: '', tipo: 'text', obligatoria: true, previewValue: '', min: 0, max: 10 }
    ]
  })

  // Actualizar animaciones después de agregar sección
  if (window.AOS) {
    setTimeout(() => {
      window.AOS.refresh()
    }, 200)
  }
}

function removeSection(sectionIndex) {
  if (formData.value.secciones.length <= 1) {
    $q.notify({
      type: 'warning',
      message: 'La encuesta debe tener al menos una sección',
      position: 'top',
      color: 'teal',
      icon: 'warning'
    })
    return
  }

  $q.dialog({
    title: '¿Deseas eliminar esta sección?',
    message: '¿Estás seguro de eliminar esta sección y todas sus preguntas?',
    ok: { label: 'Eliminar', color: 'negative', unelevated: true },
    cancel: { flat: true, label: 'Cancelar' },
    persistent: true
  }).onOk(() => {
    formData.value.secciones.splice(sectionIndex, 1)
    sectionsKey.value++ // Forzar re-render de la lista

    // Actualizar animaciones después de eliminar sección
    if (window.AOS) {
      setTimeout(() => {
        window.AOS.refresh()
      }, 200)
    }
  })
}

function moveSection(sectionIndex, direction) {
  const arr = formData.value.secciones
  const newIndex = sectionIndex + direction

  if (newIndex < 0 || newIndex >= arr.length) return

  const [item] = arr.splice(sectionIndex, 1)
  arr.splice(newIndex, 0, item)

  // Actualizar animaciones después de mover sección
  if (window.AOS) {
    setTimeout(() => {
      window.AOS.refresh()
    }, 200)
  }
}

// FUNCIONES PARA PREGUNTAS
function addQuestion(sectionIndex) {
  formData.value.secciones[sectionIndex].preguntas.push({
    id: uid(),
    enunciado: '',
    tipo: 'text',
    obligatoria: true,
    previewValue: '',
    min: 0,
    max: 10
  })

  // Actualizar animaciones después de agregar pregunta
  if (window.AOS) {
    setTimeout(() => {
      window.AOS.refresh()
    }, 200)
  }
}

function removeQuestion(sectionIndex, questionIndex) {
  if (formData.value.secciones[sectionIndex].preguntas.length <= 1) {
    $q.notify({
      type: 'warning',
      message: 'La sección debe tener al menos una pregunta',
      position: 'top',
      color: 'teal',
      icon: 'warning'
    })
    return
  }

  formData.value.secciones[sectionIndex].preguntas.splice(questionIndex, 1)

  // Actualizar animaciones después de eliminar pregunta
  if (window.AOS) {
    setTimeout(() => {
      window.AOS.refresh()
    }, 200)
  }
}

function moveQuestion(sectionIndex, questionIndex, direction) {
  const arr = formData.value.secciones[sectionIndex].preguntas
  const newIndex = questionIndex + direction

  if (newIndex < 0 || newIndex >= arr.length) return

  const [item] = arr.splice(questionIndex, 1)
  arr.splice(newIndex, 0, item)

  // Actualizar animaciones después de mover pregunta
  if (window.AOS) {
    setTimeout(() => {
      window.AOS.refresh()
    }, 200)
  }
}

// FUNCIONES PARA TIPOS DE PREGUNTAS
function typeChanged(sectionIndex, questionIndex, value) {
  const question = formData.value.secciones[sectionIndex].preguntas[questionIndex]
  question.tipo = value

  if (['single', 'multi'].includes(value)) {
    // Inicializar opciones para selección múltiple
    question.opciones = question.opciones || [
      { id: uid(), texto: 'Opción 1', valor: null },
      { id: uid(), texto: 'Opción 2', valor: null }
    ]
    // Borrar propiedades de escala si existían
    question.min = null
    question.max = null

    // Valor por defecto según tipo
    question.previewValue = value === 'single' ? null : []
  }
  else if (value === 'scale') {
    // Inicializar escala con valores por defecto
    question.min = 0
    question.max = 10
    // Borrar opciones si existían
    question.opciones = []

    // Valor por defecto para escala
    question.previewValue = question.min
  }
  else {
    // Limpiar opciones/escala para otros tipos
    question.opciones = []
    question.min = null
    question.max = null

    // Valor por defecto según tipo
    question.previewValue = value === 'number' ? 0 : ''
  }

  // Actualizar animaciones después de cambiar tipo
  if (window.AOS) {
    setTimeout(() => {
      window.AOS.refresh()
    }, 200)
  }
}

// FUNCIONES PARA OPCIONES
function addOpcion(sectionIndex, questionIndex) {
  const opciones = formData.value.secciones[sectionIndex].preguntas[questionIndex].opciones || []
  opciones.push({
    id: uid(),
    texto: `Opción ${opciones.length + 1}`,
    valor: null
  })

  formData.value.secciones[sectionIndex].preguntas[questionIndex].opciones = opciones

  // Actualizar animaciones después de agregar opción
  if (window.AOS) {
    setTimeout(() => {
      window.AOS.refresh()
    }, 200)
  }
}

function removeOpcion(sectionIndex, questionIndex, optionIndex) {
  const opciones = formData.value.secciones[sectionIndex].preguntas[questionIndex].opciones

  if (opciones.length <= 2) {
    $q.notify({
      type: 'warning',
      message: 'La pregunta debe tener al menos dos opciones',
      position: 'top',
      color: 'teal',
      icon: 'warning'
    })
    return
  }

  opciones.splice(optionIndex, 1)
}

// FORMATO Y VALIDACIÓN
function toISODateFromDMY(dmy) {
  if (!dmy) return null

  const parts = dmy.split('/')
  if (parts.length !== 3) return null

  return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
}

function validateForm() {
  // Validar datos generales
  if (!formData.value.titulo.trim()) {
    $q.notify({
      type: 'warning',
      message: 'El título de la encuesta es obligatorio',
      position: 'top',
      color: 'teal',
      icon: 'warning'
    })
    return false
  }

  if (!formData.value.fechaInicio) {
    $q.notify({
      type: 'warning',
      message: 'La fecha de inicio es obligatoria',
      position: 'top',
      color: 'teal',
      icon: 'warning'
    })
    return false
  }

  // Validar secciones
  for (let i = 0; i < formData.value.secciones.length; i++) {
    const section = formData.value.secciones[i]

    if (!section.titulo.trim()) {
      $q.notify({
        type: 'warning',
        message: `La sección ${i + 1} debe tener un título`,
        position: 'top',
        color: 'teal',
        icon: 'warning'
      })
      return false
    }

    // Validar preguntas
    for (let j = 0; j < section.preguntas.length; j++) {
      const question = section.preguntas[j]

      if (!question.enunciado.trim()) {
        $q.notify({
          type: 'warning',
          message: `La pregunta ${j + 1} de la sección "${section.titulo}" debe tener un enunciado`,
          position: 'top',
          color: 'teal',
          icon: 'warning'
        })
        return false
      }

      // Validar opciones para preguntas de tipo selección
      if (['single', 'multi'].includes(question.tipo)) {
        if (!question.opciones || question.opciones.length < 2) {
          $q.notify({
            type: 'warning',
            message: `La pregunta ${j + 1} de la sección "${section.titulo}" debe tener al menos 2 opciones`,
            position: 'top',
            color: 'teal',
            icon: 'warning'
          })
          return false
        }

        for (let k = 0; k < question.opciones.length; k++) {
          if (!question.opciones[k].texto.trim()) {
            $q.notify({
              type: 'warning',
              message: `La opción ${k + 1} de la pregunta ${j + 1} en la sección "${section.titulo}" debe tener texto`,
              position: 'top',
              color: 'teal',
              icon: 'warning'
            })
            return false
          }
        }
      }

      // Validar escala
      if (question.tipo === 'scale') {
        if (question.min >= question.max) {
          $q.notify({
            type: 'warning',
            message: `En la pregunta ${j + 1} de la sección "${section.titulo}", el valor mínimo debe ser menor que el máximo`,
            position: 'top',
            color: 'teal',
            icon: 'warning'
          })
          return false
        }
      }
    }
  }

  return true
}

// CONSTRUCCIÓN DEL PAYLOAD
function buildEncuestaPayload() {
  return {
    proyecto_id: props.proyectoId || null,
    creador_id: currentUserId.value,
    titulo: formData.value.titulo.trim(),
    descripcion: formData.value.descripcion?.trim() || null,
    fechaInicio: toISODateFromDMY(formData.value.fechaInicio),
    fechaFinal: toISODateFromDMY(formData.value.fechaFinal),
    activa: !!formData.value.activa,
    secciones: formData.value.secciones.map((seccion, secIndex) => ({
      titulo: seccion.titulo.trim(),
      descripcion: seccion.descripcion?.trim() || null,
      orden: secIndex + 1, // Agregar orden explícito para secciones
      preguntas: seccion.preguntas.map((pregunta, pregIndex) => ({
        enunciado: pregunta.enunciado.trim(),
        tipo: mapTipoToBackend(pregunta.tipo),
        obligatoria: !!pregunta.obligatoria,
        orden: pregIndex + 1, // Asignar orden basado en el índice
        min: pregunta.tipo === 'scale' ? pregunta.min : null,
        max: pregunta.tipo === 'scale' ? pregunta.max : null,
        opciones: ['single', 'multi'].includes(pregunta.tipo)
          ? pregunta.opciones.map((opcion, optIndex) => ({
            texto: opcion.texto.trim(),
            valor: opcion.valor,
            orden: optIndex + 1 // Asignar orden para opciones
          }))
          : []
      }))
    }))
  }
}

// Mapear tipos de preguntas al formato del backend
function mapTipoToBackend(tipo) {
  const mapping = {
    'text': 'text',
    'textarea': 'text', // Mapear textarea a text para el backend
    'number': 'number',
    'single': 'single',
    'multi': 'multi',
    'scale': 'scale',
    'date': 'date'
  }
  return mapping[tipo] || 'text'
}

// ENVÍO DEL FORMULARIO
async function onSubmit() {
  try {
    if (!validateForm()) {
      return
    }

    submitting.value = true

    // Construir payload
    const payload = buildEncuestaPayload()

    // Verificar que tengamos creador_id
    if (!payload.creador_id) {
      throw new Error('No se ha podido determinar el ID del creador de la encuesta')
    }

    console.log('Enviando encuesta:', payload)

    // Enviar a la API
    const response = await api.post('/encuestas', payload)
    const data = response.data.data || response.data

    // Notificar éxito
    $q.notify({
      type: 'positive',
      message: 'Encuesta creada exitosamente',
      position: 'top',
      color: 'teal',
      icon: 'check_circle',
      timeout: 2000
    })

    // Resetear formulario
    resetForm()

    // Emitir evento con la encuesta guardada
    emit('save', data)

    // Cerrar diálogo
    emit('update:modelValue', false)
  } catch (error) {
    console.error('Error al guardar encuesta:', error)

    // Mostrar mensaje de error
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'Error al guardar la encuesta',
      position: 'top',
      icon: 'error'
    })
  } finally {
    submitting.value = false
  }
}

// CONFIRMACIÓN DE CIERRE
function confirmClose() {
  $q.dialog({
    title: '¿Descartar cambios?',
    message: 'Tienes datos sin guardar. ¿Seguro que deseas cerrar?',
    ok: { label: 'Sí, cerrar', color: 'negative', unelevated: true },
    cancel: { label: 'Seguir editando', flat: true },
    persistent: true,
    dark: false,
    color: 'teal'
  }).onOk(() => {
    emit('update:modelValue', false)
  })
}

// Resetear formulario
function resetForm() {
  formData.value = {
    titulo: '',
    descripcion: '',
    fechaInicio: '',
    fechaFinal: '',
    activa: true,
    secciones: [
      {
        id: uid(),
        titulo: 'Sección 1',
        descripcion: '',
        preguntas: [
          { id: uid(), enunciado: '', tipo: 'text', obligatoria: true, previewValue: '', min: 0, max: 10 }
        ]
      }
    ]
  }

  // Refrescar animaciones después de resetear
  if (window.AOS) {
    setTimeout(() => {
      window.AOS.refresh()
    }, 200)
  }
}
</script>

<style scoped>
/* Estilos para el formulario de encuestas mejorado */

/* Paleta de colores */
:root {
  --purple: #663399;
  --teal: #009999;
  --light-teal: #00AAAA;
  --white: #FFFFFF;
  --light-gray: #f5f7fa;
  --border-color: #e5e7eb;
}

/* Estilos generales del diálogo */
.encuesta-dialog {
  border-radius: 12px;
  overflow: hidden;
}

/* Sección de encabezado */
.dialog-header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
}

.bg-purple {
  background-color: var(--purple);
}

.bg-teal {
  background-color: var(--teal);
}

.mode-toggle-btn {
  transition: transform 0.3s ease;
}

.mode-toggle-btn:hover {
  transform: scale(1.1);
}

/* Tarjetas y formularios */
.form-card {
  border-radius: 12px;
  border: 1px solid var(--border-color);
  background: white;
  margin-bottom: 20px;
  transition: box-shadow 0.3s ease, transform 0.3s ease;
  overflow: hidden;
}

/* Añade o actualiza estos estilos */
.bg-gradient {
  background: linear-gradient(135deg, var(--purple) 0%, var(--teal) 100%) !important;
  color: white !important;
  padding: 24px;
}

.bg-gradient * {
  color: white !important;
}

.preview-header {
  position: relative;
  z-index: 1;
}

.form-card:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

/* Secciones y expansión */
.section-expansion-item {
  border-radius: 10px;
  overflow: hidden;
  transition: transform 0.3s ease;
}

.expansion-header {
  background-color: #f9fafb;
  font-weight: 600;
}

/* Botones de acción */
.action-btn {
  transition: transform 0.2s ease;
  border-radius: 8px;
}

.action-btn:hover:not([disabled]) {
  transform: translateY(-2px);
}

.add-section-btn {
  border-radius: 8px;
  transition: all 0.3s ease;
}

.add-section-btn:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

/* Añade estas reglas específicas */
.preview-header {
  background: linear-gradient(135deg, #663399 0%, #009999 100%) !important;
  color: white !important;
  position: relative;
  z-index: 1;
}

.preview-header * {
  color: white !important;
  opacity: 1 !important;
}

.visible-text {
  color: white !important;
  opacity: 1 !important;
  font-weight: bold !important;
  text-shadow: 0 1px 2px rgba(0,0,0,0.3) !important;
}

.preview-header div, .preview-header p {
  color: white !important;
  opacity: 1 !important;
}

/* Preguntas */
.question-box {
  background-color: #fcfcfc;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  margin-top: 16px;
  transition: box-shadow 0.3s ease;
  overflow: hidden;
}

.question-box:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

/* Inputs personalizados */
.custom-input .q-field__control {
  background-color: #f9fafb;
  transition: background-color 0.2s ease;
}

.custom-input .q-field__control:hover {
  background-color: white;
}

.custom-input .q-field--focused .q-field__control {
  background-color: white;
  border-color: var(--teal);
}

.custom-option-group {
  transition: opacity 0.3s ease;
}

/* Vista previa */
.preview-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 16px;
}

.preview-card {
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.preview-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.bg-gradient {
  background: linear-gradient(135deg, var(--purple) 0%, var(--teal) 100%);
  color: white;
  padding: 24px;
}

.preview-section {
  padding: 24px;
  border-bottom: 1px solid var(--border-color);
  transition: background-color 0.3s ease;
}

.preview-section:hover {
  background-color: #fafafa;
}

.section-title {
  color: var(--purple);
  font-weight: 600;
  position: relative;
  padding-bottom: 8px;
}

.section-title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 60px;
  height: 3px;
  background-color: var(--teal);
  border-radius: 3px;
}

.question-text {
  font-weight: 500;
  line-height: 1.4;
}

.question-number {
  color: var(--teal);
  font-weight: 600;
}

.preview-question {
  padding: 12px 0;
  transition: transform 0.3s ease;
}

.preview-question:hover {
  transform: translateX(5px);
}

.scale-labels {
  color: var(--purple);
  font-weight: 500;
}

.preview-footer {
  background-color: #f5f7fa;
  padding: 20px;
  text-align: center;
}

/* Responsive */
@media (max-width: 768px) {
  .q-dialog__inner>div {
    max-width: 95vw !important;
  }

  .preview-container {
    padding: 8px;
  }

  .preview-section {
    padding: 16px;
  }
}

/* Animaciones AOS personalizadas */
[data-aos="zoom-in-subtle"] {
  transform: scale(0.95);
  opacity: 0;
  transition-property: transform, opacity;
}

[data-aos="zoom-in-subtle"].aos-animate {
  transform: scale(1);
  opacity: 1;
}

[data-aos="slide-up-subtle"] {
  transform: translateY(20px);
  opacity: 0;
  transition-property: transform, opacity;
}

[data-aos="slide-up-subtle"].aos-animate {
  transform: translateY(0);
  opacity: 1;
}

/* Efectos adicionales para campos */
.custom-input {
  transition: transform 0.3s ease;
}

.custom-input:focus-within {
  transform: translateY(-2px);
}

/* Estilo para los badges */
.q-badge {
  font-size: 0.7rem;
  padding: 2px 8px;
  transition: background 0.3s ease;
}

/* Estilo para los sliders */
.q-slider__track-container {
  background: rgba(102, 51, 153, 0.1);
}

.q-slider__pin-value-marker {
  background: var(--teal);
  color: white;
  font-weight: bold;
}

.q-slider__selection {
  background: var(--teal);
}

.q-slider__thumb {
  background: var(--teal);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.q-slider:hover .q-slider__thumb {
  transform: scale(1.2);
  box-shadow: 0 0 0 8px rgba(0, 153, 153, 0.2);
}

/* Mejorar aspecto de las fechas */
.q-date {
  color: var(--purple);
}

.q-date__today {
  background-color: var(--teal) !important;
  color: white !important;
}

.q-date__navigation {
  background: linear-gradient(to right, var(--purple), var(--teal));
  color: white;
}

/* Transiciones para cambios de estado */
.q-checkbox__inner {
  transition: all 0.3s ease;
}

.q-checkbox__inner--truthy {
  transform: scale(1.1);
}

.q-checkbox__bg {
  transition: background 0.3s ease, border-color 0.3s ease;
}

/* Mejoras en las notificaciones */
.q-notification {
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

/* Efectos para diálogos */
.q-dialog__backdrop {
  backdrop-filter: blur(3px);
  transition: backdrop-filter 0.3s ease;
}

/* Botones de acción del formulario */
.q-card__actions .q-btn {
  transition: all 0.3s ease;
}

.q-card__actions .q-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}
</style>
