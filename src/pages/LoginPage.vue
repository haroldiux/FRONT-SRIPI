<template>
  <q-page class="q-pa-md flex flex-center">
    <q-card style="width: 380px; max-width: 90vw" class="q-pa-lg">
      <q-form @submit.prevent="onSubmit">
        <div class="text-h6 q-mb-md">Iniciar sesión</div>
        <q-input v-model="email" type="email" label="Correo" outlined dense class="q-mb-sm" />
        <q-input
          v-model="password"
          type="password"
          label="Contraseña"
          outlined
          dense
          class="q-mb-md"
        />
        <q-btn type="submit" label="Entrar" color="primary" class="full-width" />
      </q-form>
    </q-card>
  </q-page>
</template>
<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from 'src/stores/auth.store'
const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const email = ref('admin@sripi.tld')
const password = ref('123456')
async function onSubmit() {
  await auth.login({ email: email.value, password: password.value })
  router.push(route.query.redirect || '/')
}
</script>
