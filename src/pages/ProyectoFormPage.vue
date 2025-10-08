<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <div class="col"><div class="text-h6">Proyectos</div></div>
      <div class="col-auto">
        <q-btn color="primary" icon="add" label="Nuevo Proyecto" @click="open = true" />
      </div>
    </div>

    <!-- puedes listar proyectos debajo si quieres -->

    <ProyectoForm v-model="open" @save="goDetail" @cancel="open = false" />
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import ProyectoForm from 'components/proyectos/ProyectoForm.vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const open = ref(true) // abre de una para maquetar; pon en false luego

function goDetail(id) {
  router.push({ name: 'proyectos.detail', params: { id } })
}
</script>
