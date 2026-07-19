import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '../stores/auth'

declare module 'vue-router' {
  interface RouteMeta {
    public?: boolean
    roles?: Array<'coach' | 'coachee' | 'empresa'>
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
    meta: { public: true },
  },
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomeRedirectView.vue'),
  },
  {
    path: '/coachee/plan',
    name: 'coachee-plan',
    component: () => import('../views/coachee/PlanDesarrolloView.vue'),
    meta: { roles: ['coachee'] },
  },
  {
    path: '/coachee/sesiones',
    name: 'coachee-sesiones',
    component: () => import('../views/coachee/SesionesView.vue'),
    meta: { roles: ['coachee'] },
  },
  {
    path: '/coachee/progreso',
    name: 'coachee-progreso',
    component: () => import('../views/coachee/ProgresoView.vue'),
    meta: { roles: ['coachee'] },
  },
  {
    path: '/coachee/biblioteca',
    name: 'coachee-biblioteca',
    component: () => import('../views/coachee/BibliotecaView.vue'),
    meta: { roles: ['coachee'] },
  },
  {
    path: '/coachee/ciclos/:cicloId/certificado',
    name: 'coachee-certificado',
    component: () => import('../views/coachee/CertificadoView.vue'),
    meta: { roles: ['coachee'] },
    props: true,
  },
  {
    path: '/coach/dashboard',
    name: 'coach-dashboard',
    component: () => import('../views/coach/DashboardView.vue'),
    meta: { roles: ['coach'] },
  },
  {
    path: '/coach/planes',
    name: 'coach-planes',
    component: () => import('../views/coach/PlanesListView.vue'),
    meta: { roles: ['coach'] },
  },
  {
    path: '/coach/recursos',
    name: 'coach-recursos',
    component: () => import('../views/coach/RecursosView.vue'),
    meta: { roles: ['coach'] },
  },
  {
    path: '/coach/planes/:coacheeId',
    name: 'coach-plan-detail',
    component: () => import('../views/coach/PlanDetailView.vue'),
    meta: { roles: ['coach'] },
    props: true,
  },
  {
    path: '/coach/coachees/:coacheeId/seguimiento',
    name: 'coach-coachee-seguimiento',
    component: () => import('../views/coach/CoacheeSeguimientoView.vue'),
    meta: { roles: ['coach'] },
    props: true,
  },
  {
    path: '/coach/coachees/:coacheeId/ciclo',
    name: 'coach-ciclo',
    component: () => import('../views/coach/CicloView.vue'),
    meta: { roles: ['coach'] },
    props: true,
  },
  {
    path: '/coach/negocio',
    name: 'coach-negocio',
    component: () => import('../views/coach/NegocioView.vue'),
    meta: { roles: ['coach'] },
  },
  {
    path: '/coach/legal',
    name: 'coach-legal',
    component: () => import('../views/coach/LegalView.vue'),
    meta: { roles: ['coach'] },
  },
  {
    path: '/coach/auditoria',
    name: 'coach-auditoria',
    component: () => import('../views/coach/AuditoriaView.vue'),
    meta: { roles: ['coach'] },
  },
  {
    path: '/coach/comercial',
    name: 'coach-comercial',
    component: () => import('../views/coach/GestionComercialView.vue'),
    meta: { roles: ['coach'] },
  },
  {
    path: '/coach/empresas',
    name: 'coach-empresas',
    component: () => import('../views/coach/EmpresasView.vue'),
    meta: { roles: ['coach'] },
  },
  {
    path: '/coach/coachees',
    name: 'coach-coachees',
    component: () => import('../views/coach/CoacheesView.vue'),
    meta: { roles: ['coach'] },
  },
  {
    path: '/coach/usuarios',
    name: 'coach-usuarios',
    component: () => import('../views/coach/UsuariosView.vue'),
    meta: { roles: ['coach'] },
  },
  {
    path: '/empresa/coachees',
    name: 'empresa-coachees',
    component: () => import('../views/empresa/CoacheesView.vue'),
    meta: { roles: ['empresa'] },
  },
  {
    path: '/empresa/satisfaccion',
    name: 'empresa-satisfaccion',
    component: () => import('../views/empresa/SatisfaccionView.vue'),
    meta: { roles: ['empresa'] },
  },
  {
    path: '/empresa/coachees/:coacheeId/ciclo',
    name: 'empresa-ciclo',
    component: () => import('../views/empresa/CicloView.vue'),
    meta: { roles: ['empresa'] },
    props: true,
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

function homeFor(role: string): string {
  if (role === 'coach') return '/coach/dashboard'
  if (role === 'coachee') return '/coachee/plan'
  return '/empresa/coachees'
}

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (auth.accessToken && !auth.user) {
    await auth.restoreSession()
  }

  if (to.meta.public) {
    if (auth.isAuthenticated) {
      return homeFor(auth.user!.role)
    }
    return true
  }

  if (!auth.isAuthenticated) {
    return { name: 'login' }
  }

  if (to.name === 'home') {
    return homeFor(auth.user!.role)
  }

  const allowedRoles = to.meta.roles
  if (allowedRoles && !allowedRoles.includes(auth.user!.role)) {
    return homeFor(auth.user!.role)
  }

  return true
})
