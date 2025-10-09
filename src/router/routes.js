const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'dashboard',
        component: () => import('pages/IndexPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'proyectos',
        name: 'proyectos.list',
        component: () => import('pages/ProyectosListPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'proyectos/nuevo',
        name: 'proyectos.new',
        component: () => import('pages/ProyectoFormPage.vue'),
        meta: { requiresAuth: true, requiresRole: 'admin' },
      },
      {
        path: 'proyectos/:id',
        name: 'proyectos.detail',
        component: () => import('pages/ProyectoDetailPage.vue'),
        meta: { requiresAuth: true },
      },
      {
        path: 'encuestadores',
        name: 'encuestadores.list',
        component: () => import('pages/EncuestadoresListPage.vue'),
        meta: { requiresAuth: true, requiresRole: 'admin' },
      },
      // Ruta para usuarios - la creación se maneja con modal en la misma página
      {
        path: 'usuarios',
        name: 'usuarios.list',
        component: () => import('pages/ListaUsuarioPage.vue'),
        meta: { requiresAuth: true },
      },
    ],
  },
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'), // si tienes AuthLayout, cámbialo aquí
    children: [{ path: 'login', name: 'login', component: () => import('pages/LoginPage.vue') }],
  },
  { path: '/:catchAll(.*)*', component: () => import('pages/ErrorNotFound.vue') },
]
export default routes
