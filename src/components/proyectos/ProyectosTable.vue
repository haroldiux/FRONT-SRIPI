<template>
  <q-card>
    <q-table :rows="rows" :columns="cols" row-key="id" flat>
      <template #body-cell-status="p">
        <q-td :props="p"
          ><q-badge :color="p.row.status === 'activo' ? 'green' : 'grey'">{{
            p.row.status
          }}</q-badge></q-td
        >
      </template>
      <template #body-cell-actions="{ row }">
        <q-td
          ><q-btn
            flat
            dense
            icon="visibility"
            :to="{ name: 'proyectos.detail', params: { id: row.id } }"
        /></q-td>
      </template>
    </q-table>
  </q-card>
</template>
<script setup>
defineProps({ rows: { type: Array, default: () => [] } })
const cols = [
  { name: 'id', label: '#', field: 'id' },
  { name: 'title', label: 'Título', field: 'title', align: 'left' },
  { name: 'code', label: 'Código', field: 'code' },
  { name: 'status', label: 'Estado', field: 'status' },
  { name: 'actions', label: '', field: 'actions', align: 'right' },
]
</script>
