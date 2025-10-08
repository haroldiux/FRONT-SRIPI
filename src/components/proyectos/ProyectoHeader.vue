<template>
  <div class="row items-center q-mb-md">
    <div class="col">
      <div class="text-h6">{{ item?.title }}</div>
    </div>
    <div class="col-auto">
      <q-badge :color="item?.status === 'activo' ? 'green' : 'grey'">{{ item?.status }}</q-badge>
    </div>
  </div>
  <div class="text-subtitle1">Código: {{ item?.code }}</div>
  <div class="text-caption">{{ item?.start_date }} → {{ item?.end_date }}</div>
</template>
<script setup>
defineProps({ item: { type: Object, default: () => ({}) } })
</script>
