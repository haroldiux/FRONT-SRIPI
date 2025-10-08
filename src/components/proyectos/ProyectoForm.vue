<template>
  <!-- Dialog controlado por v-model -->
  <q-dialog v-model="isOpen" persistent transition-show="scale" transition-hide="scale">
    <q-card style="width: 680px; max-width: 95vw" class="q-pa-md q-pt-sm">
      <!-- Header -->
      <q-card-section class="q-pb-none">
        <div class="row items-center">
          <div class="col">
            <div class="text-h6">Crear Nuevo Proyecto</div>
            <div class="text-caption text-grey-7">
              Los proyectos te permiten organizar múltiples encuestas bajo un mismo estudio
            </div>
          </div>
          <div class="col-auto">
            <q-btn flat round dense icon="close" @click="onCancel" />
          </div>
        </div>
      </q-card-section>

      <!-- Body / Form -->
      <q-card-section class="q-gutter-md">
        <q-form @submit.prevent="onSubmit" ref="formRef" class="q-gutter-md">
          <q-input
            v-model="form.title"
            label="Nombre del Proyecto *"
            outlined
            dense
            :rules="[req]"
            placeholder="Ej: Estudio de Odontofobia 2025"
            autofocus
          />

          <q-input
            v-model="form.summary"
            type="textarea"
            outlined
            autogrow
            label="Descripción"
            placeholder="Describe el objetivo del estudio..."
          />

          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-input
                v-model="form.location"
                label="Ubicación *"
                outlined
                dense
                :rules="[req]"
                placeholder="Ej: Cochabamba"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                v-model="form.zone"
                label="Zona Específica"
                outlined
                dense
                placeholder="Ej: Facultad de Odontología"
              />
            </div>
          </div>

          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-input
                v-model="dateStart"
                label="Fecha de Inicio *"
                outlined
                dense
                mask="##/##/####"
                fill-mask
                :rules="[req, validDate]"
                placeholder="dd/mm/aaaa"
                hint="Formato: dd/mm/aaaa"
              >
                <template #prepend>
                  <q-icon name="event" />
                </template>
              </q-input>
            </div>

            <div class="col-12 col-md-6">
              <q-input
                v-model="dateEnd"
                label="Fecha de Fin"
                outlined
                dense
                mask="##/##/####"
                fill-mask
                :rules="[endAfterStart]"
                placeholder="dd/mm/aaaa"
                hint="Opcional, pero debe ser posterior a inicio"
              >
                <template #prepend>
                  <q-icon name="event" />
                </template>
              </q-input>
            </div>
          </div>

          <q-select
            v-model="form.status"
            label="Estado"
            outlined
            dense
            :options="['activo', 'borrador']"
            emit-value
            map-options
          />

          <!-- Actions -->
          <div class="row justify-end q-gutter-sm q-pt-sm">
            <q-btn flat label="Cancelar" @click="onCancel" />
            <q-btn color="purple-6" unelevated label="Crear Proyecto" type="submit" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'
import { db } from 'src/services/mock'

// Props: control externo del diálogo
const props = defineProps({
  modelValue: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'save', 'cancel'])

// Control del diálogo (two-way)
const isOpen = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

// Estado del formulario
const formRef = ref(null)
const form = reactive({
  title: '',
  summary: '',
  location: '',
  zone: '',
  status: 'borrador',
  start_date: '', // ISO
  end_date: '', // ISO
})

// Manejo de fechas con máscara dd/mm/aaaa -> ISO yyyy-mm-dd
const dateStart = ref('')
const dateEnd = ref('')

watch(dateStart, (v) => {
  form.start_date = toISO(v) || ''
})
watch(dateEnd, (v) => {
  form.end_date = toISO(v) || ''
})

function toISO(ddmmyyyy) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(ddmmyyyy || '')
  if (!m) return null
  const [, d, mth, y] = m
  const iso = `${y}-${mth}-${d}`
  // validación básica
  const dt = new Date(iso)
  return isNaN(dt.getTime()) ? null : iso
}

// Validaciones
const req = (v) => !!v || 'Requerido'
const validDate = (v) => !v || !!toISO(v) || 'Fecha inválida'
const endAfterStart = (v) => {
  if (!v) return true
  const s = toISO(dateStart.value)
  const e = toISO(v)
  if (!e) return 'Fecha inválida'
  if (s && e < s) return 'Debe ser posterior a la fecha de inicio'
  return true
}

// Acciones
async function onSubmit() {
  const ok = await formRef.value.validate()
  if (!ok) return

  // Guardado mock (puedes reemplazar por llamada Axios después)
  const id = db.proyectos.length + 1
  db.proyectos.push({
    id,
    title: form.title,
    code: `PRJ-${100 + id}`,
    summary: form.summary,
    status: form.status,
    start_date: form.start_date,
    end_date: form.end_date,
    location: form.location,
    zone: form.zone,
  })

  emit('save', id)
  isOpen.value = false
  reset()
}

function onCancel() {
  emit('cancel')
  isOpen.value = false
  reset()
}

function reset() {
  form.title = ''
  form.summary = ''
  form.location = ''
  form.zone = ''
  form.status = 'borrador'
  form.start_date = ''
  form.end_date = ''
  dateStart.value = ''
  dateEnd.value = ''
}
</script>

<style scoped>
/* toques suaves similares al mock */
.q-dialog__inner {
  backdrop-filter: blur(2px);
}
</style>
