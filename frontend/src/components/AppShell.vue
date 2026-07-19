<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import AppLogo from './AppLogo.vue'
import NavIcon from './NavIcon.vue'
import BusquedaGlobal from './BusquedaGlobal.vue'

const auth = useAuthStore()
const router = useRouter()
const sidebarOpen = ref(false)

interface NavItem {
  to: string
  label: string
  icon: string
}

const coacheeNav: NavItem[] = [
  { to: '/coachee/plan', label: 'Plan', icon: 'planes' },
  { to: '/coachee/sesiones', label: 'Sesiones', icon: 'sesiones' },
  { to: '/coachee/progreso', label: 'Progreso', icon: 'progreso' },
  { to: '/coachee/biblioteca', label: 'Biblioteca', icon: 'biblioteca' },
]

const coachNav: NavItem[] = [
  { to: '/coach/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/coach/planes', label: 'Planes', icon: 'planes' },
  { to: '/coach/recursos', label: 'Recursos', icon: 'recursos' },
  { to: '/coach/negocio', label: 'Negocio', icon: 'negocio' },
  { to: '/coach/legal', label: 'Legal', icon: 'legal' },
  { to: '/coach/auditoria', label: 'Auditoría', icon: 'auditoria' },
  { to: '/coach/comercial', label: 'Comercial', icon: 'comercial' },
  { to: '/coach/empresas', label: 'Empresas', icon: 'empresas' },
  { to: '/coach/coachees', label: 'Coachees', icon: 'coachees' },
  { to: '/coach/usuarios', label: 'Usuarios', icon: 'usuarios' },
]

const empresaNav: NavItem[] = [
  { to: '/empresa/coachees', label: 'Coachees', icon: 'coachees' },
  { to: '/empresa/satisfaccion', label: 'Satisfacción', icon: 'satisfaccion' },
]

const navItems = computed<NavItem[]>(() => {
  if (auth.user?.role === 'coachee') return coacheeNav
  if (auth.user?.role === 'coach') return coachNav
  if (auth.user?.role === 'empresa') return empresaNav
  return []
})

async function handleLogout() {
  await auth.logout()
  await router.push({ name: 'login' })
}
</script>

<template>
  <div class="min-h-screen bg-[var(--color-ivory)] text-[var(--color-ink)]">
    <div
      class="flex items-center justify-between border-b border-[var(--color-line)] bg-[var(--color-ink)] px-4 py-3 text-[var(--color-parchment)] sm:hidden print:hidden"
    >
      <button
        aria-label="Abrir menú"
        class="rounded-lg p-1.5 hover:bg-white/10"
        @click="sidebarOpen = true"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        ><path d="M4 6h16M4 12h16M4 18h16" /></svg>
      </button>
      <AppLogo
        :size="26"
        dark
      />
      <div class="w-[30px]" />
    </div>

    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-30 bg-black/40 sm:hidden"
      @click="sidebarOpen = false"
    />

    <aside
      class="fixed inset-y-0 left-0 z-40 flex w-64 -translate-x-full flex-col bg-[var(--color-ink)] text-[var(--color-parchment)] transition-transform duration-200 sm:translate-x-0 print:hidden"
      :class="{ 'translate-x-0': sidebarOpen }"
    >
      <div class="flex items-center justify-between px-5 py-5">
        <AppLogo
          :size="30"
          dark
        />
        <button
          aria-label="Cerrar menú"
          class="rounded-lg p-1 hover:bg-white/10 sm:hidden"
          @click="sidebarOpen = false"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          ><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>

      <nav class="flex-1 space-y-0.5 overflow-y-auto px-3">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-[var(--color-parchment)]/80 transition-colors hover:bg-white/10 hover:text-[var(--color-parchment)]"
          active-class="bg-[var(--color-sage)]/20 text-[var(--color-parchment)] font-medium"
          @click="sidebarOpen = false"
        >
          <NavIcon :name="item.icon" />
          {{ item.label }}
        </RouterLink>
      </nav>

      <div
        v-if="auth.user"
        class="border-t border-white/10 px-3 py-4"
      >
        <BusquedaGlobal
          v-if="auth.user.role === 'coach'"
          class="mb-3 px-1"
        />
        <p class="truncate px-3 text-xs text-[var(--color-parchment)]/60">
          {{ auth.user.email }}
        </p>
        <button
          class="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-[var(--color-parchment)]/80 transition-colors hover:bg-white/10 hover:text-[var(--color-parchment)]"
          @click="handleLogout"
        >
          <NavIcon name="logout" />
          Cerrar sesión
        </button>
      </div>
    </aside>

    <main class="sm:pl-64">
      <div class="mx-auto max-w-3xl px-4 py-6 sm:px-8 sm:py-8">
        <slot />
      </div>
    </main>
  </div>
</template>
