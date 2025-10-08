<template>
  <q-page class="q-pa-md">
    <div class="text-h6 q-mb-md">Encuestadores</div>
    <EncuestadoresTable :rows="rows" />
  </q-page>
</template>
<script setup>
import { computed, ref } from 'vue'
import { db } from 'src/services/mock'
import EncuestadoresTable from 'components/encuestadores/EncuestadoresTable.vue'
const q = ref('')
const rows = computed(() =>
  db.encuestadores.filter((e) => (e.name + e.email).toLowerCase().includes(q.value.toLowerCase())),
)
</script>
