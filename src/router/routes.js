// routes.js
const routes = [
  // RUTAS PRINCIPALES
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
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
      },

      // Nuevas rutas para el sistema de encuestas
      {
        path: 'encuestadores/encuestar/:id',
        name: 'encuestadores.encuestar',
        component: () => import('pages/EncuestaResolver.vue'),
      },
      {
        path: 'encuestadores/envios',
        name: 'encuestadores.envios',
        component: () => import('pages/EnviosListPage.vue'),
      },
      {
        path: 'encuestadores/envio/:id',
        name: 'encuestadores.envio.detalle',
        component: () => import('pages/EnvioDetailPage.vue'),
      }
    ],
  },

  // Ruta de login
  {
    path: '/login',
    component: () => import('layouts/AuthLayout.vue'),
    children: [
      {
        path: '',
        name: 'login-page',
        component: () => import('pages/LoginPage.vue'),
        meta: { guest: true },
      }
    ]
  },

  // Redirección
  {
    path: '/:catchAll(.*)*',
    redirect: '/login'
  },

  // CAMBIO DE CONTRASEÑA
  {
    path: '/change-password',
    name: 'change-password',
    component: () => import('pages/ChangePasswordPage.vue'),
    meta: { guest: true },
  },
]

export default routes
