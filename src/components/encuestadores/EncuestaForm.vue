<template>
  <div class="proyecto-form-container">
    <q-form ref="formRef" @submit="onSubmit" class="proyecto-form">
      <!-- Información Básica -->
      <q-card flat bordered class="form-card">
        <q-card-section>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">
                Título de la Encuesta <span class="required">*</span>
              </label>
              <q-input
                v-model="formData.titulo"
                placeholder="Ej: Estudio de Odontofobia 2025"
                outlined
                dense
                class="form-input"
                :rules="[(val) => !!val || 'El título es requerido']"
              />
            </div>

            <div class="form-group">
              <label class="form-label"> Ubicación <span class="required">*</span> </label>
              <q-input
                v-model="formData.ubicacion"
                placeholder="Ej: Clínica Universitaria"
                outlined
                dense
                class="form-input"
                :rules="[(val) => !!val || 'La ubicación es requerida']"
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Descripción</label>
            <q-input
              v-model="formData.descripcion"
              type="textarea"
              placeholder="Describe el propósito y contexto de esta encuesta..."
              outlined
              dense
              rows="3"
              class="form-input"
            />
          </div>

          <div class="form-row form-row-three">
            <div class="form-group">
              <label class="form-label">Zona</label>
              <q-input
                v-model="formData.zona"
                placeholder="Ej: Zona Norte"
                outlined
                dense
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label class="form-label"> Fecha de Inicio <span class="required">*</span> </label>
              <q-input
                v-model="formData.fechaInicio"
                outlined
                dense
                class="form-input"
                mask="##/##/####"
                placeholder="dd/mm/aaaa"
                :rules="[(val) => !!val || 'La fecha de inicio es requerida']"
              >
                <template v-slot:append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-date v-model="formData.fechaInicio" mask="DD/MM/YYYY">
                        <div class="row items-center justify-end">
                          <q-btn v-close-popup label="Cerrar" color="primary" flat />
                        </div>
                      </q-date>
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>

            <div class="form-group">
              <label class="form-label">Fecha de Fin</label>
              <q-input
                v-model="formData.fechaFin"
                outlined
                dense
                class="form-input"
                mask="##/##/####"
                placeholder="dd/mm/aaaa"
              >
                <template v-slot:append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-date v-model="formData.fechaFin" mask="DD/MM/YYYY">
                        <div class="row items-center justify-end">
                          <q-btn v-close-popup label="Cerrar" color="primary" flat />
                        </div>
                      </q-date>
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Preguntas -->
      <q-card flat bordered class="form-card">
        <q-card-section>
          <div class="questions-header">
            <h3 class="section-title">Preguntas</h3>
            <div class="questions-actions">
              <q-btn
                label="Usar Plantilla de Odontofobia"
                outline
                color="primary"
                icon="content_copy"
                size="sm"
                class="btn-template"
                @click="usarPlantilla"
              />
              <q-btn
                label="Agregar Pregunta"
                icon="add"
                color="primary"
                unelevated
                size="sm"
                class="btn-add-question"
                @click="agregarPregunta"
              />
            </div>
          </div>

          <div class="questions-list">
            <div v-for="(pregunta, index) in formData.preguntas" :key="index" class="question-card">
              <div class="question-header-card">
                <h4 class="question-title">Pregunta {{ index + 1 }}</h4>
                <q-btn
                  icon="remove"
                  flat
                  dense
                  round
                  color="negative"
                  size="sm"
                  @click="eliminarPregunta(index)"
                  v-if="formData.preguntas.length > 1"
                />
              </div>

              <div class="question-body">
                <q-input
                  v-model="pregunta.texto"
                  placeholder="Escriba su pregunta aquí..."
                  outlined
                  dense
                  class="form-input question-input"
                  :rules="[(val) => !!val || 'La pregunta es requerida']"
                />

                <div class="question-settings">
                  <div class="form-group">
                    <label class="form-label">Tipo:</label>
                    <q-select
                      v-model="pregunta.tipo"
                      :options="tiposPreguntas"
                      outlined
                      dense
                      class="form-input"
                      emit-value
                      map-options
                    />
                  </div>

                  <div class="question-required">
                    <q-checkbox v-model="pregunta.requerida" label="Requerida" color="primary" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Botones de acción -->
      <div class="form-actions">
        <q-btn label="Cancelar" flat color="grey-8" class="btn-cancel" @click="onCancel" />
        <q-btn label="Crear Encuesta" type="submit" unelevated color="primary" class="btn-submit" />
      </div>
    </q-form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'

const emit = defineEmits(['save'])

const router = useRouter()
const $q = useQuasar()
const formRef = ref(null)

const formData = ref({
  titulo: '',
  ubicacion: '',
  descripcion: '',
  zona: '',
  fechaInicio: '',
  fechaFin: '',
  preguntas: [
    {
      texto: '',
      tipo: 'texto_corto',
      requerida: true,
    },
    {
      texto: '',
      tipo: 'texto_corto',
      requerida: true,
    },
  ],
})

const tiposPreguntas = [
  { label: 'Texto corto', value: 'texto_corto' },
  { label: 'Texto largo', value: 'texto_largo' },
  { label: 'Opción múltiple', value: 'opcion_multiple' },
  { label: 'Casillas', value: 'casillas' },
  { label: 'Escala', value: 'escala' },
  { label: 'Fecha', value: 'fecha' },
]

const agregarPregunta = () => {
  formData.value.preguntas.push({
    texto: '',
    tipo: 'texto_corto',
    requerida: true,
  })
}

const eliminarPregunta = (index) => {
  formData.value.preguntas.splice(index, 1)
}

const usarPlantilla = () => {
  $q.dialog({
    title: 'Usar Plantilla MDAS',
    message: '¿Desea cargar la plantilla de Escala de Ansiedad Dental Modificada (MDAS)?',
    cancel: {
      label: 'Cancelar',
      flat: true,
      color: 'grey-8',
    },
    ok: {
      label: 'Cargar Plantilla',
      color: 'primary',
      unelevated: true,
    },
    persistent: true,
  }).onOk(() => {
    formData.value.preguntas = [
      {
        texto: '¿Cómo te sientes si tuvieras que ir al dentista mañana?',
        tipo: 'escala',
        requerida: true,
      },
      {
        texto: '¿Cómo te sientes cuando estás en la sala de espera del dentista?',
        tipo: 'escala',
        requerida: true,
      },
      {
        texto: '¿Cómo te sientes cuando te van a perforar un diente?',
        tipo: 'escala',
        requerida: true,
      },
      {
        texto: '¿Cómo te sientes cuando te van a hacer una limpieza dental?',
        tipo: 'escala',
        requerida: true,
      },
      {
        texto: '¿Cómo te sientes cuando te van a poner una inyección de anestesia?',
        tipo: 'escala',
        requerida: true,
      },
    ]

    $q.notify({
      type: 'positive',
      message: 'Plantilla MDAS cargada correctamente',
      position: 'top',
    })
  })
}

const onSubmit = async () => {
  const isValid = await formRef.value.validate()

  if (isValid) {
    // Aquí enviarías los datos al backend
    const response = await mockSaveProject()

    $q.notify({
      type: 'positive',
      message: 'Encuesta creada exitosamente',
      position: 'top',
    })

    // Emitir evento con el ID del proyecto creado
    emit('save', response.id)
  }
}

// Mock de guardado (reemplazar con llamada real al backend)
const mockSaveProject = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: Date.now(),
        ...formData.value,
      })
    }, 500)
  })
}

const onCancel = () => {
  router.push({ name: 'proyectos' })
}
</script>

<style lang="scss" scoped>
.proyecto-form-container {
  max-width: 1000px;
  margin: 0 auto;
}

.proyecto-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-card {
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }
}

.form-row-three {
  grid-template-columns: 1fr 1fr 1fr;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.required {
  color: #ef4444;
}

.form-input {
  :deep(.q-field__control) {
    border-radius: 8px;

    &:before {
      border-color: #d1d5db;
    }
  }

  :deep(.q-field__control:hover:before) {
    border-color: #7c3aed;
  }

  :deep(.q-field--focused .q-field__control:before) {
    border-color: #7c3aed;
  }

  :deep(input::placeholder),
  :deep(textarea::placeholder) {
    color: #9ca3af;
  }
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.questions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.questions-actions {
  display: flex;
  gap: 12px;
}

.btn-template {
  text-transform: none;
  font-weight: 500;
  border-radius: 8px;
  border: 1.5px solid #7c3aed;
  color: #7c3aed;
}

.btn-add-question {
  background: #7c3aed;
  color: white;
  text-transform: none;
  font-weight: 500;
  border-radius: 8px;
}

.questions-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.question-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
}

.question-header-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.question-title {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin: 0;
}

.question-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.question-input {
  :deep(.q-field__control) {
    background: white;
  }
}

.question-settings {
  display: flex;
  gap: 16px;
  align-items: flex-end;
}

.question-settings .form-group {
  flex: 1;
}

.question-required {
  display: flex;
  align-items: center;
  padding-bottom: 4px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 8px;
}

.btn-cancel {
  text-transform: none;
  font-weight: 500;
  padding: 8px 24px;
  border-radius: 8px;
}

.btn-submit {
  background: #7c3aed;
  color: white;
  text-transform: none;
  font-weight: 500;
  padding: 8px 32px;
  border-radius: 8px;

  &:hover {
    background: #6d28d9;
  }
}

:deep(.q-date) {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-radius: 8px;
}

:deep(.q-date__header) {
  background: #7c3aed;
}

@media (max-width: 768px) {
  .form-row,
  .form-row-three {
    grid-template-columns: 1fr;
  }

  .questions-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .questions-actions {
    flex-direction: column;
  }
}
</style>
