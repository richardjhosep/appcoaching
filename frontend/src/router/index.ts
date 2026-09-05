import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '../stores/auth'

declare module 'vue-router' {
  interface RouteMeta {
    public?: boolean
    /** Página que se ve igual estando o no logueado — sin AppShell, sin rebote de auth. */
    standalone?: boolean
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
    path: '/consentimiento/:token',
    name: 'consentimiento-publico',
    component: () => import('../views/public/ConsentimientoView.vue'),
    meta: { standalone: true },
    props: true,
  },
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomeRedirectView.vue'),
  },
  {
    path: '/cambiar-password',
    name: 'cambiar-password',
    component: () => import('../views/CambiarPasswordView.vue'),
  },
  {
    path: '/coachee/mi-aprendizaje',
    name: 'coachee-mi-aprendizaje',
    component: () => import('../views/coachee/MiAprendizajeView.vue'),
    meta: { roles: ['coachee'] },
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
    path: '/coachee/playground',
    name: 'coachee-playground',
    component: () => import('../views/coachee/PlaygroundView.vue'),
    meta: { roles: ['coachee'] },
  },
  // Quiz/Flashcards/Mapas/Ejercicios/Test de Estilo eran 5 rutas propias, consolidadas en
  // /coachee/playground con pestañas — mismo patrón de redirect que el lado coach.
  { path: '/coachee/quiz', redirect: '/coachee/playground?tab=quiz' },
  { path: '/coachee/flashcards', redirect: '/coachee/playground?tab=flashcards' },
  { path: '/coachee/mapas', redirect: '/coachee/playground?tab=mapas' },
  { path: '/coachee/ejercicios', redirect: '/coachee/playground?tab=ejercicios' },
  { path: '/coachee/test-estilo', redirect: '/coachee/playground?tab=test-estilo' },
  {
    path: '/coachee/ciclos/:cicloId/certificado',
    name: 'coachee-certificado',
    component: () => import('../views/coachee/CertificadoView.vue'),
    meta: { roles: ['coachee'] },
    props: true,
  },
  {
    path: '/coachee/resumen',
    name: 'coachee-resumen',
    component: () => import('../views/coachee/EstadoProcesoView.vue'),
    meta: { roles: ['coachee'] },
  },
  {
    path: '/coachee/mi-coach',
    name: 'coachee-mi-coach',
    component: () => import('../views/coachee/MiCoachView.vue'),
    meta: { roles: ['coachee'] },
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
    path: '/coach/estudio',
    name: 'coach-estudio',
    component: () => import('../views/coach/EstudioView.vue'),
    meta: { roles: ['coach'] },
  },
  // Quiz/Flashcards/Mapas/Ejercicios/Test de Estilo eran 5 rutas propias, consolidadas en
  // /coach/estudio con pestañas — mismo patrón de redirect que /coach/auditoria y
  // /coach/comercial más abajo, para no romper links/bookmarks viejos.
  { path: '/coach/quiz', redirect: '/coach/estudio?tab=quiz' },
  { path: '/coach/flashcards', redirect: '/coach/estudio?tab=flashcards' },
  { path: '/coach/mapas', redirect: '/coach/estudio?tab=mapas' },
  { path: '/coach/ejercicios', redirect: '/coach/estudio?tab=ejercicios' },
  { path: '/coach/test-estilo', redirect: '/coach/estudio?tab=test-estilo' },
  {
    path: '/coach/agenda',
    name: 'coach-agenda',
    component: () => import('../views/coach/AgendaView.vue'),
    meta: { roles: ['coach'] },
  },
  {
    path: '/coach/coachees/:coacheeId',
    name: 'coach-coachee-detail',
    component: () => import('../views/coach/CoacheeDetailView.vue'),
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
    redirect: '/coach/legal?tab=auditoria',
  },
  {
    path: '/coach/comercial',
    redirect: '/coach/negocio?tab=comercial',
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
    path: '/coach/configuracion',
    name: 'coach-configuracion',
    component: () => import('../views/coach/ConfiguracionView.vue'),
    meta: { roles: ['coach'] },
  },
  {
    path: '/coach/perfil',
    name: 'coach-perfil',
    component: () => import('../views/coach/PerfilView.vue'),
    meta: { roles: ['coach'] },
  },
  {
    path: '/empresa/dashboard',
    name: 'empresa-dashboard',
    component: () => import('../views/empresa/DashboardView.vue'),
    meta: { roles: ['empresa'] },
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
    path: '/empresa/coach',
    name: 'empresa-coach',
    component: () => import('../views/empresa/PerfilCoachView.vue'),
    meta: { roles: ['empresa'] },
  },
  {
    path: '/empresa/finanzas',
    name: 'empresa-finanzas',
    component: () => import('../views/empresa/FinanzasView.vue'),
    meta: { roles: ['empresa'] },
  },
  {
    path: '/empresa/informe',
    name: 'empresa-informe',
    component: () => import('../views/empresa/InformeEjecutivoView.vue'),
    meta: { roles: ['empresa'] },
  },
  {
    path: '/empresa/coachees/:coacheeId/ciclos/:cicloId/certificado',
    name: 'empresa-certificado',
    component: () => import('../views/empresa/CertificadoView.vue'),
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
  // Mi Aprendizaje es el resumen pensado como aterrizaje (próxima sesión, tareas pendientes,
  // progreso) — antes el login mandaba directo al plan, sin ese panorama general primero.
  if (role === 'coachee') return '/coachee/mi-aprendizaje'
  return '/empresa/dashboard'
}

router.beforeEach(async (to) => {
  if (to.meta.standalone) {
    return true
  }

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

  if (auth.user!.mustChangePassword) {
    return to.name === 'cambiar-password' ? true : { name: 'cambiar-password' }
  }
  if (to.name === 'cambiar-password') {
    return homeFor(auth.user!.role)
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
