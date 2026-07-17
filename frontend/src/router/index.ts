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
    path: '/no-disponible',
    name: 'not-available',
    component: () => import('../views/NotAvailableView.vue'),
    meta: { roles: ['empresa'] },
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

function homeFor(role: string): string {
  if (role === 'coach') return '/coach/planes'
  if (role === 'coachee') return '/coachee/plan'
  return '/no-disponible'
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
