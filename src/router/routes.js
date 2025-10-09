// routes.js - SOLUCIÓN DE EMERGENCIA PARA BUCLE INFINITO
const routes = [
  // RUTAS PRINCIPALES
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    // QUITAR EL BEFOREENTER PARA EVITAR REDIRECCIONES INFINITAS
    children: [
      {
        path: '',
        name: 'dashboard',
        component: () => import('pages/IndexPage.vue'),
      },
      {
        path: 'proyectos',
        name: 'proyectos.list',
        component: () => import('pages/ProyectosListPage.vue'),
      },
      {
        path: 'proyectos/nuevo',
        name: 'proyectos.new',
        component: () => import('pages/ProyectoFormPage.vue'),
      },
      {
        path: 'proyectos/:id',
        name: 'proyectos.detail',
        component: () => import('pages/ProyectoDetailPage.vue'),
      },
      {
        path: 'encuestadores',
        name: 'encuestadores.list',
        component: () => import('pages/EncuestadoresListPage.vue'),
      },
      {
        path: 'usuarios',
        name: 'usuarios.list',
        component: () => import('pages/ListaUsuarioPage.vue'),
      }
    ],
  },

  // Ruta de login
  {
    path: '/login',  // Esto es correcto, siempre debe comenzar con /
    component: () => import('layouts/AuthLayout.vue'),
    children: [
      {
        path: '',  // Ruta vacía para indicar la ruta padre
        name: 'login-page',
        component: () => import('pages/LoginPage.vue'),
        meta: { guest: true },          // <- importante
      }
    ]
  },

  // Redirección
  {
    path: '/:catchAll(.*)*',
    redirect: '/login'  // Esto es correcto
  },

  // CAMBIO DE CONTRASEÑA - SIMPLIFICADO SIN REDIRECTS
  {
    path: '/change-password',
    name: 'change-password',
    component: () => import('pages/ChangePasswordPage.vue'),
    meta: { guest: true },          // <- importante
  },

]

export default routes
