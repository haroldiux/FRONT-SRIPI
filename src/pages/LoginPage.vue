<template>
  <div class="modern-login-container">
    <!-- Animated background with improved patterns -->
    <div class="animated-bg">
      <div class="gradient-overlay"></div>
      <div class="geometric-pattern"></div>
      <div class="floating-elements">
        <div class="float-element e1"></div>
        <div class="float-element e2"></div>
        <div class="float-element e3"></div>
        <div class="float-element e4"></div>
        <div class="float-element e5"></div>
      </div>
    </div>

    <!-- Login panel -->
    <div class="login-panel">
      <!-- Logo and brand section with animation -->
      <div class="brand-section">
        <div class="logo-container" data-aos="zoom-in" data-aos-duration="800">
          <div class="logo">SRIPI</div>
        </div>
        <div class="title-container" data-aos="fade-up" data-aos-delay="300">
          <h1 class="app-title">
            <span class="title-line">Sistema de Registro de</span>
            <span class="title-line">Información de Proyectos de</span>
            <span class="title-line">Investigación</span>
          </h1>
          <div class="title-underline"></div>
        </div>
      </div>

      <!-- Form card with shadow and animation -->
      <div class="form-card" data-aos="fade-up" data-aos-delay="500">
        <div class="card-accent-border"></div>
        <h2 class="form-title">Iniciar Sesión</h2>
        <q-form ref="loginForm" @submit="onSubmit">
          <!-- Username field with icon and animation -->
          <div class="input-group" data-aos="fade-right" data-aos-delay="600">
            <q-input
              v-model="form.usuario"
              outlined
              autocomplete="username"
              placeholder="Usuario"
              class="modern-input"
              :rules="[val => !!val || 'El usuario es obligatorio']"
            >
              <template v-slot:prepend>
                <q-icon name="person" />
              </template>
            </q-input>
          </div>

          <!-- Password field with icon and animation -->
          <div class="input-group" data-aos="fade-right" data-aos-delay="700">
            <q-input
              v-model="form.password"
              outlined
              autocomplete="current-password"
              placeholder="Contraseña"
              :type="isPwd ? 'password' : 'text'"
              class="modern-input"
              :rules="[val => !!val || 'La contraseña es obligatoria']"
            >
              <template v-slot:prepend>
                <q-icon name="lock" />
              </template>
              <template v-slot:append>
                <q-icon
                  :name="isPwd ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  @click="isPwd = !isPwd"
                />
              </template>
            </q-input>
          </div>

          <!-- Submit button with animation -->
          <div class="action-group" data-aos="fade-up" data-aos-delay="800">
            <q-btn
              type="submit"
              class="login-btn"
              :loading="loading"
            >
              INICIAR SESIÓN
              <div class="btn-hover-effect"></div>
            </q-btn>
          </div>
        </q-form>

        <!-- Success notification with animation -->
        <div v-if="logoutSuccess" class="success-notification" data-aos="zoom-in">
          <q-icon name="check_circle" />
          <span>Sesión cerrada exitosamente</span>
        </div>
      </div>

      <!-- Copyright footer -->
      <div class="footer" data-aos="fade-up" data-aos-delay="900">
        © {{ new Date().getFullYear() }} SRIPI - Todos los derechos reservados
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useAuthStore } from 'src/stores/auth.store'
import { useQuasar } from 'quasar'
import AOS from 'aos'
import 'aos/dist/aos.css'

export default {
  name: 'LoginPage',

  setup() {
    const $q = useQuasar()
    const auth = useAuthStore()
    const loginForm = ref(null)

    const isPwd = ref(true)
    const loading = ref(false)
    const logoutSuccess = ref(false)
    const form = ref({
      usuario: '',
      password: ''
    })

    // Iniciar animaciones en componentes montados
    onMounted(() => {
      // Inicializar biblioteca de animaciones
      AOS.init({
        duration: 800,
        easing: 'ease-out',
        once: true
      })

      // Iniciar animaciones de elementos flotantes
      initFloatingElements()

      // Limpiar datos de sesión previos
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('lastActivity')

      // Verificar parámetro logout
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get('logout') === 'success') {
        logoutSuccess.value = true
      }
    })

    // Inicializar animaciones personalizadas
    const initFloatingElements = () => {
      const elements = document.querySelectorAll('.float-element')
      elements.forEach((el, index) => {
        // Aplicar retrasos escalonados para un efecto más natural
        el.style.animationDelay = `${index * 0.8}s`
      })
    }

    const onSubmit = async () => {
      try {
        if (loginForm.value && !loginForm.value.validate()) {
          return
        }

        loading.value = true
        logoutSuccess.value = false

        // Usar el store de autenticación para iniciar sesión
        const { user } = await auth.login(form.value)

        // Mostrar animación de éxito
        $q.notify({
          type: 'positive',
          message: `Bienvenido, ${user?.nombres ?? 'usuario'}`,
          position: 'top-right',
          classes: 'modern-notification'
        })

        // Verificar si es el primer inicio de sesión
        if (auth.isFirstLogin()) {
          // Redireccionar a cambio de contraseña
          console.log("Redirigiendo a cambio de contraseña (primer inicio)")
          window.location.href = '/#/change-password'
        } else {
          // Animar la transición al dashboard
          document.querySelector('.login-panel').classList.add('fade-out')

          // Redireccionar después de la animación
          setTimeout(() => {
            window.location.href = '/#/'
          }, 800)
        }
      } catch (error) {
        console.error('Error de inicio de sesión:', error)

        // Limpiar cualquier dato de sesión parcial
        auth.logout()

        // Mostrar notificación de error con animación
        $q.notify({
          type: 'negative',
          message: error.message || 'Error al iniciar sesión',
          position: 'top',
          classes: 'error-notification'
        })
      } finally {
        loading.value = false
      }
    }

    return {
      form,
      isPwd,
      loading,
      logoutSuccess,
      loginForm,
      onSubmit
    }
  }
}
</script>

<style lang="scss">
// Importar fuentes elegantes
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

// Variables de la paleta de colores
:root {
  --primary-color: #663399; /* Purple */
  --secondary-color: #009999; /* Teal */
  --accent-color: #00AAAA; /* Light Teal */
  --white: #FFFFFF;
  --primary-dark: #4B0082; /* Darker purple */
  --secondary-dark: #007777; /* Darker teal */
  --primary-gradient: linear-gradient(135deg, #663399 0%, #4B0082 100%);
  --secondary-gradient: linear-gradient(135deg, #009999 0%, #00AAAA 100%);
  --accent-gradient: linear-gradient(135deg, #00AAAA 0%, #00CCCC 100%);
  --mixed-gradient: linear-gradient(135deg, #663399 0%, #009999 100%);
  --text-color: #333333;
  --text-light: rgba(255, 255, 255, 0.9);
  --shadow-sm: 0 4px 6px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 10px 20px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 15px 30px rgba(0, 0, 0, 0.1);
  --transition-fast: 0.3s ease;
  --transition-slow: 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

// Estilos generales y reset
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'Poppins', sans-serif;
}

// Contenedor principal
.modern-login-container {
  min-height: 100vh;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
}

// Fondo animado mejorado
.animated-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  overflow: hidden;
}

// Superposición de gradiente
.gradient-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--mixed-gradient);
  opacity: 0.95;
  z-index: 1;
}

// Patrón geométrico
.geometric-pattern {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: transparent;
  background-image:
    linear-gradient(30deg, rgba(0, 153, 153, 0.1) 12%, transparent 12.5%, transparent 87%, rgba(0, 153, 153, 0.1) 87.5%, rgba(0, 153, 153, 0.1)),
    linear-gradient(150deg, rgba(0, 153, 153, 0.1) 12%, transparent 12.5%, transparent 87%, rgba(0, 153, 153, 0.1) 87.5%, rgba(0, 153, 153, 0.1)),
    linear-gradient(30deg, rgba(0, 153, 153, 0.1) 12%, transparent 12.5%, transparent 87%, rgba(0, 153, 153, 0.1) 87.5%, rgba(0, 153, 153, 0.1)),
    linear-gradient(150deg, rgba(0, 153, 153, 0.1) 12%, transparent 12.5%, transparent 87%, rgba(0, 153, 153, 0.1) 87.5%, rgba(0, 153, 153, 0.1)),
    linear-gradient(60deg, rgba(102, 51, 153, 0.1) 25%, transparent 25.5%, transparent 75%, rgba(102, 51, 153, 0.1) 75%, rgba(102, 51, 153, 0.1)),
    linear-gradient(60deg, rgba(102, 51, 153, 0.1) 25%, transparent 25.5%, transparent 75%, rgba(102, 51, 153, 0.1) 75%, rgba(102, 51, 153, 0.1));
  background-position: 0 0, 0 0, 25px 25px, 25px 25px, 0 0, 25px 25px;
  background-size: 50px 50px;
  z-index: 2;
}

// Elementos flotantes
.floating-elements {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 3;
}

.float-element {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 15s infinite ease-in-out;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 50%;
    padding: 2px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0) 50%);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
  }

  &.e1 {
    width: 200px;
    height: 200px;
    top: 15%;
    left: 10%;
    background: rgba(0, 153, 153, 0.07);
    animation-duration: 18s;
  }

  &.e2 {
    width: 150px;
    height: 150px;
    top: 60%;
    left: 20%;
    background: rgba(102, 51, 153, 0.05);
    animation-duration: 25s;
  }

  &.e3 {
    width: 180px;
    height: 180px;
    top: 30%;
    right: 15%;
    background: rgba(0, 170, 170, 0.07);
    animation-duration: 20s;
    animation-delay: 2s;
  }

  &.e4 {
    width: 120px;
    height: 120px;
    bottom: 20%;
    right: 25%;
    background: rgba(102, 51, 153, 0.05);
    animation-duration: 22s;
    animation-delay: 1s;
  }

  &.e5 {
    width: 250px;
    height: 250px;
    bottom: 10%;
    right: 5%;
    background: rgba(0, 170, 170, 0.03);
    animation-duration: 30s;
    animation-delay: 3s;
  }
}

// Panel de login
.login-panel {
  width: 100%;
  max-width: 450px;
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 10;
  padding: 2rem;
  transition: opacity 0.8s ease, transform 0.8s ease;

  &.fade-out {
    opacity: 0;
    transform: translateY(-20px);
  }
}

// Sección de marca
.brand-section {
  text-align: center;
  margin-bottom: 2.5rem;
}

.logo-container {
  margin-bottom: 1.5rem;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    width: 140px;
    height: 15px;
    background: rgba(0, 153, 153, 0.2);
    bottom: -15px;
    left: 50%;
    transform: translateX(-50%);
    filter: blur(15px);
    border-radius: 50%;
  }
}

.logo {
  width: 120px;
  height: 120px;
  background-color: var(--white);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 700;
  color: var(--primary-color);
  margin: 0 auto;
  box-shadow: var(--shadow-md);
  position: relative;
  overflow: hidden;
  letter-spacing: 1px;
  transform: rotate(-5deg);
  transition: transform 0.5s ease;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 5px;
    background: var(--secondary-gradient);
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to bottom right,
      rgba(255, 255, 255, 0.7) 0%,
      rgba(255, 255, 255, 0) 70%
    );
  }

  &:hover {
    transform: rotate(0deg) scale(1.05);
  }
}

// Estilos específicos para el título en múltiples líneas
.title-container {
  text-align: center;
  margin-bottom: 1rem;
}

.app-title {
  color: var(--white);
  font-size: 1.8rem;
  font-weight: 600;
  margin: 0 auto;
  line-height: 1.3;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.title-line {
  display: block;
  white-space: nowrap;
}

.title-underline {
  width: 60px;
  height: 3px;
  background: var(--secondary-color);
  margin: 10px auto 0;
  border-radius: 2px;
}

// Tarjeta de formulario
.form-card {
  width: 100%;
  background: var(--white);
  border-radius: 16px;
  padding: 2.5rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  transform: translateZ(0);
  overflow: hidden;
  position: relative;
  backdrop-filter: blur(10px);

  .card-accent-border {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 6px;
    background: var(--secondary-gradient);
    z-index: 1;
  }
}

.form-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--primary-color);
  margin-bottom: 2rem;
  text-align: center;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    width: 30px;
    height: 2px;
    background-color: var(--secondary-color);
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%);
  }
}

// Campos de entrada
.input-group {
  margin-bottom: 1.8rem;
}

.modern-input {
  width: 100%;

  .q-field__control {
    border-radius: 12px;
    height: 56px;
    border: 2px solid rgba(102, 51, 153, 0.15);
    transition: all 0.3s ease;
  }

  .q-field__native {
    padding: 0.75rem 0;
    font-size: 16px;
    letter-spacing: 0.3px;
  }

  &.q-field--focused {
    .q-field__control {
      border-color: var(--secondary-color);
      box-shadow: 0 0 0 3px rgba(0, 153, 153, 0.2);
    }
  }

  .q-field__prepend {
    padding-left: 15px;
    color: var(--primary-color);
  }

  .q-field__append {
    padding-right: 15px;
    color: var(--secondary-color);
  }
}

// Botón de inicio de sesión
.action-group {
  margin-top: 2.5rem;
}

.login-btn {
  width: 100%;
  height: 56px;
  border-radius: 12px;
  background: var(--secondary-gradient);
  color: var(--white);
  font-weight: 600;
  font-size: 16px;
  letter-spacing: 1.5px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 4px 10px rgba(0, 153, 153, 0.3);

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 7px 15px rgba(0, 153, 153, 0.4);
    background: var(--accent-gradient);
  }

  &:active {
    transform: translateY(-1px);
    box-shadow: 0 3px 8px rgba(0, 153, 153, 0.3);
  }

  .btn-hover-effect {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      to right,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.3) 50%,
      rgba(255, 255, 255, 0) 100%
    );
    transform: skewX(-25deg) translateX(-100%);
    transition: transform 0.7s ease;
  }

  &:hover .btn-hover-effect {
    transform: skewX(-25deg) translateX(100%);
  }
}

// Notificación de éxito
.success-notification {
  display: flex;
  align-items: center;
  background: var(--secondary-gradient);
  color: white;
  padding: 1.2rem;
  border-radius: 12px;
  margin-top: 1.8rem;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);

  i {
    margin-right: 10px;
    font-size: 22px;
  }

  span {
    font-weight: 500;
  }
}

// Footer
.footer {
  color: var(--text-light);
  margin-top: 2.5rem;
  font-size: 0.9rem;
  text-align: center;
  letter-spacing: 0.5px;
}

// Animaciones
@keyframes float {
  0%, 100% {
    transform: translate(0, 0) rotate(0deg);
  }
  25% {
    transform: translate(10px, -15px) rotate(2deg);
  }
  50% {
    transform: translate(-5px, -25px) rotate(-1deg);
  }
  75% {
    transform: translate(-15px, -10px) rotate(1deg);
  }
}

// Clases de notificación
.modern-notification {
  border-radius: 8px;
  font-weight: 500;
  box-shadow: var(--shadow-md);
  background: var(--secondary-gradient) !important;
}

.error-notification {
  border-radius: 8px;
  font-weight: 500;
  box-shadow: var(--shadow-md);
  background: var(--primary-gradient) !important;
}

// Adaptabilidad para dispositivos móviles
@media (max-width: 768px) {
  .login-panel {
    padding: 1.5rem;
    max-width: 380px;
  }

  .logo {
    width: 100px;
    height: 100px;
    font-size: 18px;
  }

  .app-title {
    font-size: 1.5rem;
  }

  .form-card {
    padding: 1.8rem;
  }
}

@media (max-width: 480px) {
  .title-line {
    white-space: normal;
    text-align: center;
  }
}
</style>
