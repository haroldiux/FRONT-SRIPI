<template>
  <div class="proyecto-form-container">
    <q-form ref="formRef" @submit="onSubmit" class="proyecto-form">
      <!-- Información del Proyecto -->
      <q-card flat bordered class="form-card">
        <q-card-section>
          <h3 class="section-title">Información del Proyecto</h3>

          <!-- Título -->
          <div class="form-group">
            <label class="form-label">
              Título del Proyecto <span class="required">*</span>
            </label>
            <q-input v-model="formData.titulo" placeholder="Ej: Estudio de Odontofobia 2024" outlined dense
              class="form-input" :rules="[(v) => !!v || 'El título es requerido']" />
          </div>

          <!-- Descripción -->
          <div class="form-group">
            <label class="form-label">Descripción</label>
            <q-input v-model="formData.descripcion" type="textarea" placeholder="Describe el objetivo del proyecto..."
              outlined dense rows="3" class="form-input" />
          </div>

          <!-- Fechas + Estado -->
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">
                Fecha de Inicio <span class="required">*</span>
              </label>
              <q-input v-model="formData.fechaInicio" outlined dense class="form-input" mask="##/##/####"
                placeholder="dd/mm/aaaa" :rules="[(v) => !!v || 'La fecha de inicio es requerida']">
                <template #append>
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
              <q-input v-model="formData.fechaFin" outlined dense class="form-input" mask="##/##/####"
                placeholder="dd/mm/aaaa">
                <template #append>
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

          <div class="form-group">
            <q-toggle v-model="formData.activo" color="primary" left-label label="Proyecto activo" />
          </div>
        </q-card-section>
      </q-card>

      <!-- Botones de acción -->
      <div class="form-actions">
        <q-btn label="Cancelar" flat color="grey-8" class="btn-cancel" @click="onCancel" />
        <q-btn label="Crear Proyecto" type="submit" unelevated color="primary" class="btn-submit" />
      </div>
    </q-form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
// import api from 'src/boot/axios' // <-- descomenta y usa esto cuando conectes backend real

const emit = defineEmits(['save'])

const router = useRouter()
const $q = useQuasar()
const formRef = ref(null)

const formData = ref({
  titulo: '',
  descripcion: '',
  fechaInicio: '',
  fechaFin: '',
  activo: true
})

/** dd/mm/aaaa -> aaaa-mm-dd */
function toISODateFromDMY(dmy) {
  if (!dmy) return null
  const [d, m, y] = dmy.split('/')
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
}

const onSubmit = async () => {
  const isValid = await formRef.value.validate()
  if (!isValid) return

  // Payload para backend
  const payload = {
    titulo: formData.value.titulo.trim(),
    descripcion: formData.value.descripcion?.trim() || null,
    fecha_inicio: toISODateFromDMY(formData.value.fechaInicio),
    fecha_fin: toISODateFromDMY(formData.value.fechaFin),
    activo: !!formData.value.activo
  }

  // ⇩⇩ Cuando tengas backend real, usa axios:
  // const { data } = await api.post('/proyectos', payload)
  // emit('save', data.id)

  const response = await mockSaveProject(payload)

  $q.notify({
    type: 'positive',
    message: 'Proyecto creado exitosamente',
    position: 'top'
  })

  emit('save', response.id)
}

// Mock de guardado (reemplazar con llamada real al backend)
const mockSaveProject = async (payload) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: Date.now(),
        ...payload
      })
    }, 400)
  })
}

const onCancel = () => {
  router.push({ name: 'proyectos' })
}
</script>

<style lang="scss" scoped>
.proyecto-form-container {
  max-width: 800px;
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

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 20px 0;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }
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
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
