<template>
  <div class="q-pa-lg flex flex-center column text-center">
    <q-icon :name="icon || 'inbox'" size="48px" class="q-mb-sm" />
    <div class="text-subtitle1 q-mb-xs">{{ title }}</div>
    <div class="text-caption text-grey-7">{{ subtitle }}</div>
    <slot />
  </div>
</template>
<script setup>
defineProps({ title: String, subtitle: String, icon: String })
</script>
