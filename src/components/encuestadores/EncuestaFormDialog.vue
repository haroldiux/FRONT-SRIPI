<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    persistent
    transition-show="scale"
    transition-hide="scale"
    maximized
  >
    <q-card class="bg-white">
      <!-- Header -->
      <q-card-section class="row items-center q-pb-none" :class="previewMode ? 'bg-green-8' : 'bg-primary'" style="color: white;">
        <div class="text-h6">
          <q-icon :name="previewMode ? 'visibility' : 'assignment'" class="q-mr-sm" />
          {{ previewMode ? 'Vista Previa de Encuesta' : 'Nueva Encuesta' }}
        </div>
        <q-space />
        <q-btn
          flat
          round
          dense
          :icon="previewMode ? 'edit' : 'visibility'"
          @click="togglePreviewMode"
          class="q-mr-sm"
          :color="previewMode ? 'white' : 'white'"
        >
          <q-tooltip>
            {{ previewMode ? 'Volver a Edición' : 'Ver Vista Previa' }}
          </q-tooltip>
        </q-btn>
        <q-btn flat round dense icon="close" @click="confirmClose" />
      </q-card-section>

      <q-separator />

      <!-- BODY con scroll -->
      <q-card-section class="q-pa-md" style="max-height: 80vh; overflow: auto;">
        <!-- MODO EDICIÓN -->
        <q-form ref="formRef" @submit="onSubmit" class="q-gutter-lg" v-if="!previewMode">
          <!-- INFORMACIÓN GENERAL -->
          <q-card flat bordered class="form-card">
            <q-card-section>
              <div class="row items-center">
                <q-icon name="description" color="purple-6" size="24px" class="q-mr-sm" />
                <div class="text-subtitle1 text-weight-bold">Información de la Encuesta</div>
              </div>

              <q-input
                filled
                dense
                class="col-12 col-md-6 q-mt-md"
                v-model="formData.titulo"
                label="Título de la Encuesta *"
                placeholder="Ej: Estudio de Satisfacción 2025"
                :rules="[val => !!val || 'El título es requerido']"
              />

              <q-input
                filled
                autogrow
                class="q-mt-md"
                v-model="formData.descripcion"
                label="Descripción"
                type="textarea"
                placeholder="Describe el propósito o contexto del estudio..."
              />

              <div class="row q-col-gutter-md q-mt-md">
                <q-input
                  filled
                  dense
                  class="col-12 col-md-3"
                  v-model="formData.fechaInicio"
                  label="Fecha de Inicio *"
                  mask="##/##/####"
                  placeholder="dd/mm/aaaa"
                  :rules="[val => !!val || 'La fecha es requerida']"
                >
                  <template v-slot:append>
                    <q-icon name="event" class="cursor-pointer">
                      <q-popup-proxy transition-show="scale" transition-hide="scale">
                        <q-date v-model="formData.fechaInicio" mask="DD/MM/YYYY">
                          <div class="row justify-end">
                            <q-btn v-close-popup flat label="Cerrar" color="primary" />
                          </div>
                        </q-date>
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>

                <q-input
                  filled
                  dense
                  class="col-12 col-md-3"
                  v-model="formData.fechaFinal"
                  label="Fecha de Fin"
                  mask="##/##/####"
                  placeholder="dd/mm/aaaa"
                >
                  <template v-slot:append>
                    <q-icon name="event" class="cursor-pointer">
                      <q-popup-proxy transition-show="scale" transition-hide="scale">
                        <q-date v-model="formData.fechaFinal" mask="DD/MM/YYYY">
                          <div class="row justify-end">
                            <q-btn v-close-popup flat label="Cerrar" color="primary" />
                          </div>
                        </q-date>
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>

                <!-- Estado activo/inactivo -->
                <div class="col-12 col-md-3 flex items-center">
                  <q-toggle v-model="formData.activa" color="primary" label="Encuesta activa" left-label />
                </div>
              </div>
            </q-card-section>
          </q-card>

          <!-- SECCIONES -->
          <q-card flat bordered class="form-card">
            <q-card-section>
              <div class="row items-center">
                <q-icon name="view_list" color="purple-6" size="24px" class="q-mr-sm" />
                <div class="text-subtitle1 text-weight-bold">Secciones (encabezados)</div>
                <q-space />
                <q-btn
                  color="primary"
                  icon="add"
                  label="Agregar sección"
                  size="sm"
                  unelevated
                  @click="addSection"
                />
              </div>

              <!-- KEY para forzar re-render tras eliminar/mover -->
              <div class="q-mt-md" :key="sectionsKey">
                <q-banner v-if="!formData.secciones.length" class="bg-grey-2 text-grey-8 rounded-12 q-pa-md">
                  Agrega tu primera sección (por ejemplo: <em>Datos personales</em>).
                </q-banner>

                <div v-for="(sec, si) in formData.secciones" :key="sec.id" class="q-mb-md">
                  <q-expansion-item
                    dense
                    expand-separator
                    :label="sec.titulo || `Sección ${si + 1}`"
                    :caption="`${sec.preguntas.length} pregunta(s)`"
                    icon="folder"
                    header-class="text-primary"
                    default-opened
                    class="rounded-borders bordered"
                  >
                    <!-- Header sección -->
                    <div class="row q-col-gutter-md q-mt-sm">
                      <q-input
                        filled
                        dense
                        class="col-12 col-md-6"
                        v-model="sec.titulo"
                        label="Nombre de la sección *"
                        :rules="[val => !!val || 'El título es requerido']"
                      />
                      <q-input
                        filled
                        dense
                        class="col-12 col-md-6"
                        v-model="sec.descripcion"
                        label="Descripción (opcional)"
                      />
                    </div>

                    <div class="row q-gutter-sm q-mt-sm">
                      <q-btn
                        color="primary"
                        icon="add"
                        label="Agregar pregunta"
                        size="sm"
                        unelevated
                        @click="addQuestion(si)"
                      />
                      <q-btn
                        outline
                        icon="arrow_upward"
                        label="Subir"
                        size="sm"
                        :disable="si === 0"
                        @click="moveSection(si, -1)"
                      />
                      <q-btn
                        outline
                        icon="arrow_downward"
                        label="Bajar"
                        size="sm"
                        :disable="si === formData.secciones.length - 1"
                        @click="moveSection(si, 1)"
                      />
                      <q-space />
                      <q-btn
                        flat
                        color="negative"
                        icon="delete"
                        label="Eliminar sección"
                        size="sm"
                        @click="removeSection(si)"
                      />
                    </div>

                    <!-- Preguntas de la sección -->
                    <div class="q-mt-md">
                      <div v-for="(preg, qi) in sec.preguntas" :key="preg.id" class="q-mb-md">
                        <q-separator spaced />
                        <div class="row items-center justify-between q-mb-sm">
                          <div class="text-body1 text-weight-medium">Pregunta {{ qi + 1 }}</div>
                          <div class="row q-gutter-xs">
                            <q-btn
                              dense
                              flat
                              round
                              icon="arrow_upward"
                              :disable="qi === 0"
                              @click="moveQuestion(si, qi, -1)"
                            />
                            <q-btn
                              dense
                              flat
                              round
                              icon="arrow_downward"
                              :disable="qi === sec.preguntas.length - 1"
                              @click="moveQuestion(si, qi, 1)"
                            />
                            <q-btn
                              dense
                              flat
                              round
                              color="negative"
                              icon="delete"
                              v-if="sec.preguntas.length > 1"
                              @click="removeQuestion(si, qi)"
                            />
                          </div>
                        </div>

                        <q-input
                          filled
                          dense
                          v-model="preg.enunciado"
                          label="Texto de la pregunta *"
                          placeholder="Escriba la pregunta…"
                          :rules="[val => !!val || 'El enunciado es requerido']"
                        />

                        <div class="row q-col-gutter-md q-mt-sm">
                          <q-select
                            class="col-12 col-md-6"
                            filled
                            dense
                            emit-value
                            map-options
                            v-model="preg.tipo"
                            :options="tiposPreguntas"
                            label="Tipo de pregunta"
                            @update:model-value="(v) => typeChanged(si, qi, v)"
                          />
                          <div class="col-12 col-md-6 flex items-center">
                            <q-checkbox
                              v-model="preg.obligatoria"
                              label="Pregunta obligatoria"
                              color="primary"
                            />
                          </div>
                        </div>

                        <!-- Opciones (radio/checkbox) -->
                        <div v-if="['single', 'multi'].includes(preg.tipo)" class="q-mt-sm q-pl-md">
                          <div
                            class="row items-center q-col-gutter-sm q-mb-xs"
                            v-for="(opt, oi) in preg.opciones"
                            :key="oi"
                          >
                            <q-input
                              dense
                              outlined
                              class="col"
                              v-model="opt.texto"
                              placeholder="Texto de la opción"
                            />
                            <q-btn
                              dense
                              flat
                              round
                              icon="remove"
                              color="negative"
                              @click="removeOpcion(si, qi, oi)"
                            />
                          </div>
                          <q-btn
                            outline
                            dense
                            icon="add"
                            size="sm"
                            label="Agregar opción"
                            color="primary"
                            @click="addOpcion(si, qi)"
                          />
                        </div>

                        <!-- Escala -->
                        <div v-else-if="preg.tipo === 'scale'" class="q-mt-md q-pl-md">
                          <div class="row q-col-gutter-md">
                            <q-input
                              dense
                              outlined
                              class="col-3"
                              v-model.number="preg.min"
                              label="Mín"
                              type="number"
                            />
                            <q-input
                              dense
                              outlined
                              class="col-3"
                              v-model.number="preg.max"
                              label="Máx"
                              type="number"
                            />
                          </div>
                          <q-slider
                            v-model="preg.previewValue"
                            :min="preg.min"
                            :max="preg.max"
                            color="purple-6"
                            markers
                            label
                          />
                        </div>

                        <!-- Fecha -->
                        <div v-else-if="preg.tipo === 'date'" class="q-mt-sm q-pl-md">
                          <q-input
                            v-model="preg.previewValue"
                            dense
                            outlined
                            mask="##/##/####"
                            placeholder="dd/mm/aaaa"
                          >
                            <template v-slot:append>
                              <q-icon name="event" class="cursor-pointer">
                                <q-popup-proxy transition-show="scale" transition-hide="scale">
                                  <q-date v-model="preg.previewValue" mask="DD/MM/YYYY">
                                    <div class="row justify-end">
                                      <q-btn v-close-popup flat label="Cerrar" color="primary" />
                                    </div>
                                  </q-date>
                                </q-popup-proxy>
                              </q-icon>
                            </template>
                          </q-input>
                        </div>

                        <!-- Texto largo -->
                        <div v-else-if="preg.tipo === 'textarea'" class="q-mt-sm q-pl-md">
                          <q-input
                            v-model="preg.previewValue"
                            type="textarea"
                            rows="3"
                            dense
                            outlined
                            placeholder="Respuesta larga…"
                          />
                        </div>

                        <!-- Texto corto -->
                        <div v-else-if="preg.tipo === 'text'" class="q-mt-sm q-pl-md">
                          <q-input
                            v-model="preg.previewValue"
                            dense
                            outlined
                            placeholder="Respuesta corta…"
                          />
                        </div>

                        <!-- Número -->
                        <div v-else-if="preg.tipo === 'number'" class="q-mt-sm q-pl-md">
                          <q-input
                            v-model="preg.previewValue"
                            type="number"
                            dense
                            outlined
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>
                  </q-expansion-item>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </q-form>

        <!-- MODO VISTA PREVIA -->
        <div v-else class="preview-container">
          <q-card class="preview-card">
            <q-card-section class="preview-header">
              <div class="text-h5 q-mb-xs">{{ formData.titulo }}</div>
              <p class="q-ma-none text-body1">{{ formData.descripcion }}</p>
            </q-card-section>

            <q-card-section v-for="(seccion, i) in formData.secciones" :key="seccion.id" class="preview-section">
              <div class="text-h6 q-mb-md">{{ i + 1 }}. {{ seccion.titulo }}</div>
              <p v-if="seccion.descripcion" class="q-mb-lg text-grey-8">{{ seccion.descripcion }}</p>

              <div v-for="(pregunta, pregIndex) in seccion.preguntas" :key="pregunta.id" class="preview-question q-mb-lg">
                <div class="row items-center q-mb-sm">
                  <div class="text-subtitle1">{{ i + 1 }}.{{ pregIndex + 1 }}. {{ pregunta.enunciado }}</div>
                  <q-badge v-if="pregunta.obligatoria" color="negative" class="q-ml-sm">Obligatoria</q-badge>
                </div>

                <!-- Componente según el tipo de pregunta -->
                <div class="q-pl-md q-mt-sm">
                  <!-- Texto corto -->
                  <q-input
                    v-if="pregunta.tipo === 'text'"
                    outlined
                    dense
                    placeholder="Escriba su respuesta aquí"
                  />

                  <!-- Texto largo -->
                  <q-input
                    v-else-if="pregunta.tipo === 'textarea'"
                    type="textarea"
                    outlined
                    autogrow
                    placeholder="Escriba su respuesta aquí"
                  />

                  <!-- Número -->
                  <q-input
                    v-else-if="pregunta.tipo === 'number'"
                    type="number"
                    outlined
                    dense
                    placeholder="0"
                  />

                  <!-- Opciones simples (radio) -->
                  <div v-else-if="pregunta.tipo === 'single'" class="q-mt-sm">
                    <q-option-group
                      v-model="pregunta.previewValue"
                      :options="pregunta.opciones.map(opt => ({ label: opt.texto, value: opt.id }))"
                      type="radio"
                      color="primary"
                    />
                  </div>

                  <!-- Opciones múltiples (checkbox) -->
                  <div v-else-if="pregunta.tipo === 'multi'" class="q-mt-sm">
                    <q-option-group
                      v-model="pregunta.previewValue"
                      :options="pregunta.opciones.map(opt => ({ label: opt.texto, value: opt.id }))"
                      type="checkbox"
                      color="primary"
                    />
                  </div>

                  <!-- Escala -->
                  <div v-else-if="pregunta.tipo === 'scale'" class="q-mt-md">
                    <div class="row justify-between q-mb-xs">
                      <div class="text-caption">{{ pregunta.min }}</div>
                      <div class="text-caption">{{ pregunta.max }}</div>
                    </div>
                    <q-slider
                      v-model="pregunta.previewValue"
                      :min="pregunta.min"
                      :max="pregunta.max"
                      :step="1"
                      label
                      markers
                      color="primary"
                    />
                  </div>

                  <!-- Fecha -->
                  <div v-else-if="pregunta.tipo === 'date'" class="q-mt-sm">
                    <q-input
                      outlined
                      dense
                      placeholder="dd/mm/aaaa"
                      mask="##/##/####"
                    >
                      <template v-slot:append>
                        <q-icon name="event" class="cursor-pointer">
                          <q-popup-proxy transition-show="scale" transition-hide="scale">
                            <q-date mask="DD/MM/YYYY">
                              <div class="row justify-end">
                                <q-btn v-close-popup flat label="Cerrar" color="primary" />
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

            <q-card-section class="preview-footer">
              <q-btn unelevated color="primary" label="Enviar Respuestas" class="q-mr-sm" disable />
              <q-btn outline color="grey-7" label="Borrar Todo" disable />
            </q-card-section>
          </q-card>
        </div>
      </q-card-section>

      <!-- Actions -->
      <q-separator />
      <q-card-actions align="right" class="q-pa-md bg-grey-1">
        <q-btn flat color="grey-7" label="Cancelar" @click="confirmClose" />
        <q-btn
          v-if="!previewMode"
          unelevated
          color="primary"
          label="Guardar Encuesta"
          @click="onSubmit"
          :loading="submitting"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useQuasar, uid } from 'quasar'
import { api } from 'src/boot/axios'
import { useAuthStore } from 'src/stores/auth.store'

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

// Toggle entre modo edición y vista previa
function togglePreviewMode() {
  // Validar datos mínimos antes de permitir la vista previa
  if (!previewMode.value) {
    // Verificar que hay datos básicos
    if (!formData.value.titulo.trim()) {
      $q.notify({
        type: 'warning',
        message: 'Agregue al menos un título a la encuesta antes de ver la vista previa',
        position: 'top'
      })
      return
    }

    // Verificar que hay al menos una sección
    if (formData.value.secciones.length === 0) {
      $q.notify({
        type: 'warning',
        message: 'Agregue al menos una sección a la encuesta antes de ver la vista previa',
        position: 'top'
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
          position: 'top'
        })
        return
      }

      // Verificar que cada pregunta tiene al menos un enunciado
      for (let j = 0; j < section.preguntas.length; j++) {
        if (!section.preguntas[j].enunciado.trim()) {
          $q.notify({
            type: 'warning',
            message: `La pregunta ${j + 1} en la sección "${section.titulo}" debe tener un enunciado`,
            position: 'top'
          })
          return
        }
      }
    }
  }

  // Cambiar al modo opuesto
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
      { id: uid(), enunciado: '', tipo: 'text', obligatoria: true, previewValue: '' }
    ]
  })
}

function removeSection(sectionIndex) {
  if (formData.value.secciones.length <= 1) {
    $q.notify({
      type: 'warning',
      message: 'La encuesta debe tener al menos una sección',
      position: 'top'
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
  })
}

function moveSection(sectionIndex, direction) {
  const arr = formData.value.secciones
  const newIndex = sectionIndex + direction

  if (newIndex < 0 || newIndex >= arr.length) return

  const [item] = arr.splice(sectionIndex, 1)
  arr.splice(newIndex, 0, item)
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
}

function removeQuestion(sectionIndex, questionIndex) {
  if (formData.value.secciones[sectionIndex].preguntas.length <= 1) {
    $q.notify({
      type: 'warning',
      message: 'La sección debe tener al menos una pregunta',
      position: 'top'
    })
    return
  }

  formData.value.secciones[sectionIndex].preguntas.splice(questionIndex, 1)
}

function moveQuestion(sectionIndex, questionIndex, direction) {
  const arr = formData.value.secciones[sectionIndex].preguntas
  const newIndex = questionIndex + direction

  if (newIndex < 0 || newIndex >= arr.length) return

  const [item] = arr.splice(questionIndex, 1)
  arr.splice(newIndex, 0, item)
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
    delete question.min
    delete question.max

    // Valor por defecto según tipo
    question.previewValue = value === 'single' ? null : []
  }
  else if (value === 'scale') {
    // Inicializar escala
    question.min = 0
    question.max = 10
    delete question.opciones

    // Valor por defecto para escala
    question.previewValue = question.min
  }
  else {
    // Limpiar opciones/escala para otros tipos
    delete question.opciones
    delete question.min
    delete question.max

    // Valor por defecto según tipo
    question.previewValue = value === 'number' ? 0 : ''
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
}

function removeOpcion(sectionIndex, questionIndex, optionIndex) {
  const opciones = formData.value.secciones[sectionIndex].preguntas[questionIndex].opciones

  if (opciones.length <= 2) {
    $q.notify({
      type: 'warning',
      message: 'La pregunta debe tener al menos dos opciones',
      position: 'top'
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
      position: 'top'
    })
    return false
  }

  if (!formData.value.fechaInicio) {
    $q.notify({
      type: 'warning',
      message: 'La fecha de inicio es obligatoria',
      position: 'top'
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
        position: 'top'
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
          position: 'top'
        })
        return false
      }

      // Validar opciones para preguntas de tipo selección
      if (['single', 'multi'].includes(question.tipo)) {
        if (!question.opciones || question.opciones.length < 2) {
          $q.notify({
            type: 'warning',
            message: `La pregunta ${j + 1} de la sección "${section.titulo}" debe tener al menos 2 opciones`,
            position: 'top'
          })
          return false
        }

        for (let k = 0; k < question.opciones.length; k++) {
          if (!question.opciones[k].texto.trim()) {
            $q.notify({
              type: 'warning',
              message: `La opción ${k + 1} de la pregunta ${j + 1} en la sección "${section.titulo}" debe tener texto`,
              position: 'top'
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
            position: 'top'
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
    secciones: formData.value.secciones.map(seccion => ({
      titulo: seccion.titulo.trim(),
      preguntas: seccion.preguntas.map((pregunta, index) => ({
        enunciado: pregunta.enunciado.trim(),
        tipo: mapTipoToBackend(pregunta.tipo),
        obligatoria: !!pregunta.obligatoria,
        orden: index + 1,
        min: pregunta.tipo === 'scale' ? pregunta.min : null,
        max: pregunta.tipo === 'scale' ? pregunta.max : null,
        opciones: ['single', 'multi'].includes(pregunta.tipo)
          ? pregunta.opciones.map(opcion => ({
              texto: opcion.texto.trim(),
              valor: opcion.valor
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
    const response = await api.post('/api/encuestas', payload)
    const data = response.data.data || response.data

    // Notificar éxito
    $q.notify({
      type: 'positive',
      message: 'Encuesta creada exitosamente',
      position: 'top'
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
      position: 'top'
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
    persistent: true
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
          { id: uid(), enunciado: '', tipo: 'text', obligatoria: true, previewValue: '' }
        ]
      }
    ]
  }
}
</script>

<style scoped>
.form-card {
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: white;
  margin-bottom: 20px;
}

.rounded-borders {
  border-radius: 10px;
}

.bordered {
  border: 1px solid #e5e7eb;
}

/* Estilizar encabezados y botones */
.q-expansion-item :deep(.q-item) {
  padding: 12px 16px;
  background-color: #f9fafb;
}

/* Estilizar campos de formulario */
.q-input :deep(.q-field__control) {
  background-color: #f9fafb;
}

.q-input :deep(.q_field__control):hover {
  background-color: white;
}

.q-input :deep(.q-field--focused .q-field__control) {
  background-color: white;
}

/* Estilos para el modo de vista previa */
.preview-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 16px;
}

.preview-card {
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.preview-header {
  background-color: #f5f7fa;
  border-bottom: 1px solid #e5e7eb;
  padding: 20px;
}

.preview-section {
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
}

.preview-question {
  padding: 12px 0;
}

.preview-footer {
  background-color: #f5f7fa;
  padding: 16px;
  text-align: center;
}

/* Responsive */
@media (max-width: 768px) {
  .q-dialog__inner > div {
    max-width: 95vw !important;
  }
}
</style>
