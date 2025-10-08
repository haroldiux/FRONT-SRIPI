<template>
  <q-card>
    <q-table :rows="rows" :columns="cols" row-key="id" flat>
      <template #top>
        <div class="row q-col-gutter-md q-pa-md">
          <div class="col-12 col-md-4">
            <q-input v-model="q" dense outlined placeholder="Buscar por nombre/correo" />
          </div>
        </div>
      </template>
    </q-table>
  </q-card>
</template>
<script setup>
import { ref, computed } from 'vue'
const props = defineProps({ rows: { type: Array, default: () => [] } })
const q = ref('')
const cols = [
  { name: 'name', label: 'Nombre', field: 'name', align: 'left' },
  { name: 'email', label: 'Correo', field: 'email' },
  { name: 'phone', label: 'Teléfono', field: 'phone' },
  { name: 'status', label: 'Estado', field: 'status' },
]
const rows = computed(() =>
  props.rows.filter((e) => (e.name + e.email).toLowerCase().includes(q.value.toLowerCase())),
)
</script>
