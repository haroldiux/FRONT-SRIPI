<template>
  <q-dialog v-model="isOpen" persistent transition-show="scale" transition-hide="scale">
    <!-- Card principal -->
    <q-card class="bg-white" style="width: 1000px; max-width: 95vw; max-height: 92vh;">

      <!-- Header -->
      <q-card-section class="row items-center q-pb-none bg-grey-1">
        <div class="text-h6 text-primary">🧾 Nueva Encuesta</div>
        <q-space />
        <q-btn flat round dense icon="close" @click="confirmClose" />
      </q-card-section>

      <q-separator />

      <!-- BODY con scroll -->
      <q-card-section class="q-pa-md" style="max-height: 70vh; overflow: auto;">
        <q-form ref="formRef" @submit="onSubmit" class="q-gutter-lg">

          <!-- INFORMACIÓN GENERAL -->
          <q-card flat bordered class="form-card">
            <q-card-section>
              <div class="row items-center">
                <q-icon name="description" color="purple-6" size="24px" class="q-mr-sm" />
                <div class="text-subtitle1 text-weight-bold">Información de la Encuesta</div>
              </div>

              <q-input filled dense class="col-12 col-md-6" v-model="formData.titulo" label="Título de la Encuesta *"
                placeholder="Ej: Estudio de Odontofobia 2025" :rules="[req]" />


              <q-input filled autogrow class="q-mt-md" v-model="formData.descripcion" label="Descripción"
                type="textarea" placeholder="Describe el propósito o contexto del estudio..." />

              <div class="row q-col-gutter-md q-mt-md">


                <q-input filled dense class="col-12 col-md-3" v-model="formData.fechaInicio" label="Fecha de Inicio *"
                  mask="##/##/####" placeholder="dd/mm/aaaa" :rules="[req]">
                  <template #append>
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

                <q-input filled dense class="col-12 col-md-3" v-model="formData.fechaFin" label="Fecha de Fin"
                  mask="##/##/####" placeholder="dd/mm/aaaa">
                  <template #append>
                    <q-icon name="event" class="cursor-pointer">
                      <q-popup-proxy transition-show="scale" transition-hide="scale">
                        <q-date v-model="formData.fechaFin" mask="DD/MM/YYYY">
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
                  <q-toggle v-model="formData.activo" color="primary" label="Encuesta activa" left-label />
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
                <q-btn color="primary" icon="add" label="Agregar sección" size="sm" unelevated @click="addSection()" />
              </div>

              <!-- KEY para forzar re-render tras eliminar/mover -->
              <div class="q-mt-md" :key="sectionsKey">
                <q-banner v-if="!formData.secciones.length" class="bg-grey-2 text-grey-8 rounded-12 q-pa-md">
                  Agrega tu primera sección (por ejemplo: <em>Datos personales</em>).
                </q-banner>

                <div v-for="(sec, si) in formData.secciones" :key="sec.id" class="q-mb-md">
                  <q-expansion-item dense expand-separator :label="sec.titulo || `Sección ${si + 1}`"
                    :caption="`${sec.preguntas.length} pregunta(s)`" icon="folder" header-class="text-primary"
                    default-opened class="rounded-borders bordered">
                    <!-- Header sección -->
                    <div class="row q-col-gutter-md q-mt-sm">
                      <q-input filled dense class="col-12 col-md-6" v-model="sec.titulo" label="Nombre de la sección *"
                        :rules="[req]" />
                      <q-input filled dense class="col-12 col-md-6" v-model="sec.descripcion"
                        label="Descripción (opcional)" />
                    </div>

                    <div class="row q-gutter-sm q-mt-sm">
                      <q-btn color="primary" icon="add" label="Agregar pregunta" size="sm" unelevated
                        @click="addQuestion(si)" />
                      <q-btn outline icon="arrow_upward" label="Subir" size="sm" :disable="si === 0"
                        @click="moveSection(si, -1)" />
                      <q-btn outline icon="arrow_downward" label="Bajar" size="sm"
                        :disable="si === formData.secciones.length - 1" @click="moveSection(si, 1)" />
                      <q-space />
                      <q-btn flat color="negative" icon="delete" label="Eliminar sección" size="sm"
                        @click="removeSection(si)" />
                    </div>

                    <!-- Preguntas de la sección -->
                    <div class="q-mt-md">
                      <div v-for="(preg, qi) in sec.preguntas" :key="preg.id" class="q-mb-md">
                        <q-separator spaced />
                        <div class="row items-center justify-between q-mb-sm">
                          <div class="text-body1 text-weight-medium">Pregunta {{ qi + 1 }}</div>
                          <div class="row q-gutter-xs">
                            <q-btn dense flat round icon="arrow_upward" :disable="qi === 0"
                              @click="moveQuestion(si, qi, -1)" />
                            <q-btn dense flat round icon="arrow_downward" :disable="qi === sec.preguntas.length - 1"
                              @click="moveQuestion(si, qi, 1)" />
                            <q-btn dense flat round color="negative" icon="delete" v-if="sec.preguntas.length > 1"
                              @click="removeQuestion(si, qi)" />
                          </div>
                        </div>

                        <q-input filled dense v-model="preg.texto" label="Texto de la pregunta *"
                          placeholder="Escriba la pregunta…" :rules="[req]" />

                        <div class="row q-col-gutter-md q-mt-sm">
                          <q-select class="col-12 col-md-6" filled dense emit-value map-options v-model="preg.tipo"
                            :options="tiposPreguntas" label="Tipo de pregunta"
                            @update:model-value="(v) => typeChanged(si, qi, v)" />
                          <div class="col-12 col-md-6 flex items-center">
                            <q-checkbox v-model="preg.requerida" label="Requerida" color="primary" />
                          </div>
                        </div>

                        <!-- Opciones (radio/checkbox) -->
                        <div v-if="['opcion_multiple', 'casillas'].includes(preg.tipo)" class="q-mt-sm q-pl-md">
                          <div class="row items-center q-col-gutter-sm q-mb-xs" v-for="(opt, oi) in preg.opciones"
                            :key="oi">
                            <q-input dense outlined class="col" v-model="opt.label" placeholder="Texto de la opción" />
                            <q-btn dense flat round icon="remove" color="negative" @click="removeOpcion(si, qi, oi)" />
                          </div>
                          <q-btn outline dense icon="add" size="sm" label="Agregar opción" color="primary"
                            @click="addOpcion(si, qi)" />
                        </div>

                        <!-- Escala -->
                        <div v-else-if="preg.tipo === 'escala'" class="q-mt-md q-pl-md">
                          <div class="row q-col-gutter-md">
                            <q-input dense outlined class="col-3" v-model.number="preg.escala.min" label="Mín"
                              type="number" />
                            <q-input dense outlined class="col-3" v-model.number="preg.escala.max" label="Máx"
                              type="number" />
                            <q-input dense outlined class="col-3" v-model.number="preg.escala.step" label="Paso"
                              type="number" />
                          </div>
                          <q-slider v-model="preg.previewValue" :min="preg.escala.min" :max="preg.escala.max"
                            :step="preg.escala.step" color="purple-6" markers label />
                        </div>

                        <!-- Fecha -->
                        <div v-else-if="preg.tipo === 'fecha'" class="q-mt-sm q-pl-md">
                          <q-input v-model="preg.previewValue" dense outlined mask="##/##/####"
                            placeholder="dd/mm/aaaa">
                            <template #append>
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
                        <div v-else-if="preg.tipo === 'texto_largo'" class="q-mt-sm q-pl-md">
                          <q-input v-model="preg.previewValue" type="textarea" rows="3" dense outlined
                            placeholder="Respuesta larga…" />
                        </div>

                        <!-- Texto corto (default) -->
                        <div v-else class="q-mt-sm q-pl-md">
                          <q-input v-model="preg.previewValue" dense outlined placeholder="Respuesta…" />
                        </div>
                      </div>
                    </div>
                  </q-expansion-item>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </q-form>
      </q-card-section>

      <!-- Actions -->
      <q-separator />
      <q-card-actions align="right" class="q-pa-md bg-grey-1">
        <q-btn flat color="grey-7" label="Cancelar" @click="confirmClose" />
        <q-btn unelevated color="primary" label="Guardar Encuesta" @click="onSubmit" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useQuasar, uid, Dialog } from 'quasar'
import api from 'src/boot/axios' // <-- ajusta si tu boot tiene otro export

/* Props/Emits */
const props = defineProps({ modelValue: Boolean, proyectoId: Number })
const emit = defineEmits(['update:modelValue', 'save'])

const $q = useQuasar()
const isOpen = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

/* Validación simple */
const req = (v) => !!v || 'Requerido'

/* Estado del formulario */
const formRef = ref(null)
const formData = ref({
  titulo: '',
  descripcion: '',
  fechaInicio: '',
  fechaFin: '',
  activo: true, // <-- NUEVO
  secciones: [
    {
      id: uid(),
      titulo: 'Sección 1',
      descripcion: '',
      preguntas: [
        { id: uid(), texto: '', tipo: 'texto_corto', requerida: true, previewValue: '' }
      ]
    }
  ]
})

/* Tipos de pregunta */
const tiposPreguntas = [
  { label: 'Texto corto', value: 'texto_corto' },
  { label: 'Texto largo', value: 'texto_largo' },
  { label: 'Opción múltiple', value: 'opcion_multiple' },
  { label: 'Casillas', value: 'casillas' },
  { label: 'Escala', value: 'escala' },
  { label: 'Fecha', value: 'fecha' }
]

/* ——— Secciones ——— */
const sectionsKey = ref(0)

function addSection() {
  formData.value.secciones.push({
    id: uid(),
    titulo: `Sección ${formData.value.secciones.length + 1}`,
    descripcion: '',
    preguntas: [{ id: uid(), texto: '', tipo: 'texto_corto', requerida: true, previewValue: '' }]
  })
}

function removeSection(si) {
  Dialog.create({
    title: 'Eliminar sección',
    message: '¿Deseas eliminar esta sección y todas sus preguntas?',
    ok: { label: 'Eliminar', color: 'negative', unelevated: true },
    cancel: { flat: true, label: 'Cancelar' },
    persistent: true
  }).onOk(() => {
    formData.value.secciones.splice(si, 1)
    sectionsKey.value++ // fuerza re-render de la lista
  })
}

function moveSection(si, dir) {
  const arr = formData.value.secciones
  const ni = si + dir
  if (ni < 0 || ni >= arr.length) return
  const [item] = arr.splice(si, 1)
  arr.splice(ni, 0, item)
}

/* ——— Preguntas ——— */
function addQuestion(si) {
  formData.value.secciones[si].preguntas.push({
    id: uid(),
    texto: '',
    tipo: 'texto_corto',
    requerida: true,
    previewValue: ''
  })
}

function removeQuestion(si, qi) {
  formData.value.secciones[si].preguntas.splice(qi, 1)
}

function moveQuestion(si, qi, dir) {
  const arr = formData.value.secciones[si].preguntas
  const ni = qi + dir
  if (ni < 0 || ni >= arr.length) return
  const [q] = arr.splice(qi, 1)
  arr.splice(ni, 0, q)
}

/* Cambios de tipo y opciones */
function typeChanged(si, qi, val) {
  const q = formData.value.secciones[si].preguntas[qi]
  q.tipo = val
  if (['opcion_multiple', 'casillas'].includes(val)) {
    q.opciones = q.opciones || [{ label: 'Opción 1' }, { label: 'Opción 2' }]
    delete q.escala
    q.previewValue = val === 'opcion_multiple' ? null : []
  } else if (val === 'escala') {
    q.escala = q.escala || { min: 0, max: 10, step: 1 }
    delete q.opciones
    q.previewValue = q.escala.min
  } else if (val === 'fecha') {
    delete q.opciones
    delete q.escala
    q.previewValue = ''
  } else {
    delete q.opciones
    delete q.escala
    q.previewValue = ''
  }
}

function addOpcion(si, qi) {
  formData.value.secciones[si].preguntas[qi].opciones.push({
    label: `Opción ${formData.value.secciones[si].preguntas[qi].opciones.length + 1}`
  })
}

function removeOpcion(si, qi, oi) {
  formData.value.secciones[si].preguntas[qi].opciones.splice(oi, 1)
}

/* ——— Helpers de fechas y payloads ——— */
function toISODateFromDMY(dmy) {
  if (!dmy) return null
  const [d, m, y] = dmy.split('/')
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
}

function buildEncuestaPayload() {
  return {
    proyecto_id: props.proyectoId ?? null,
    titulo: formData.value.titulo?.trim(),
    descripcion: formData.value.descripcion?.trim(),
    fecha_inicio: toISODateFromDMY(formData.value.fechaInicio),
    fecha_fin: toISODateFromDMY(formData.value.fechaFin),
    activo: !!formData.value.activo,
    // si necesitas enviar además:
    // ubicacion: formData.value.ubicacion,
    // zona: formData.value.zona,
  }
}

function buildSeccionesPayload(encuestaId) {
  return formData.value.secciones.map(s => ({
    encuesta_id: encuestaId,
    titulo: String(s.titulo || '').trim()
  }))
}

function buildPreguntasPayload(mapSeccionId) {
  const out = []
  formData.value.secciones.forEach((sec, si) => {
    const seccion_id = mapSeccionId[si]
    sec.preguntas.forEach(p => {
      const base = {
        seccion_id,
        texto: String(p.texto || '').trim(),
        tipo: p.tipo,
        requerida: !!p.requerida
      }
      if (p.tipo === 'opcion_multiple' || p.tipo === 'casillas') {
        base.opciones = (p.opciones || []).map(o => ({ texto: String(o.label || '').trim() }))
      } else if (p.tipo === 'escala') {
        base.escala_min = p.escala?.min ?? 0
        base.escala_max = p.escala?.max ?? 10
        base.escala_step = p.escala?.step ?? 1
      }
      out.push(base)
    })
  })
  return out
}

/* ——— Guardado (3 pasos) ——— */
async function saveToBackend() {
  // 1) Crear encuesta
  const encuestaPayload = buildEncuestaPayload()
  const { data: creada } = await api.post('/encuestas', encuestaPayload)
  const encuestaId = creada?.id

  // 2) Crear secciones
  const seccionesPayload = buildSeccionesPayload(encuestaId)
  const { data: seccionesCreadas } = await api.post(`/encuestas/${encuestaId}/secciones`, { secciones: seccionesPayload })

  // mapear índice de sección -> id real
  const mapSeccionId = {}
  seccionesCreadas.forEach((s, idx) => { mapSeccionId[idx] = s.id })

  // 3) Crear preguntas (si hay)
  const preguntasPayload = buildPreguntasPayload(mapSeccionId)
  if (preguntasPayload.length) {
    await api.post(`/encuestas/${encuestaId}/preguntas`, { preguntas: preguntasPayload })
  }

  return { id: encuestaId, ...creada }
}

/* ——— Submit ——— */
async function onSubmit() {
  const valid = await formRef.value.validate()
  if (!valid) return

  // Validaciones mínimas por secciones
  if (!formData.value.secciones.length) {
    return $q.notify({ type: 'warning', message: 'Agrega al menos una sección', position: 'top' })
  }
  for (const s of formData.value.secciones) {
    if (!s.titulo) return $q.notify({ type: 'warning', message: 'Hay secciones sin título', position: 'top' })
    if (!s.preguntas.length) return $q.notify({ type: 'warning', message: `La sección "${s.titulo}" no tiene preguntas`, position: 'top' })
  }

  try {
    const saved = await saveToBackend()
    $q.notify({ type: 'positive', message: 'Encuesta creada exitosamente', position: 'top' })
    emit('save', saved)  // retorna al padre el id de la encuesta creada
    isOpen.value = false
  } catch (err) {
    console.error(err)
    $q.notify({ type: 'negative', message: 'No se pudo guardar la encuesta', position: 'top' })
  }
}

/* ——— Cierre con confirmación ——— */
const snapshot = JSON.stringify(formData.value)
function hasChanges() {
  return JSON.stringify(formData.value) !== snapshot
}
function confirmClose() {
  if (!hasChanges()) {
    isOpen.value = false
    return
  }
  Dialog.create({
    title: '¿Descartar cambios?',
    message: 'Tienes datos sin guardar. ¿Seguro que deseas cerrar?',
    ok: { label: 'Sí, cerrar', color: 'negative', unelevated: true },
    cancel: { label: 'Seguir editando', flat: true },
    persistent: true
  }).onOk(() => (isOpen.value = false))
}
</script>

<style scoped>
.form-card {
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: white;
}

.rounded-borders {
  border-radius: 10px;
}

.bordered {
  border: 1px solid #e5e7eb;
}

.q-dialog__inner {
  overflow: hidden;
}
</style>
