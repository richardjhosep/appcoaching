<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { changeOwnPassword } from '../api/users'
import { ApiError } from '../api/client'
import { notifyError, notifySuccess } from '../lib/notify'
import AppLogo from './AppLogo.vue'
import AppModal from './AppModal.vue'
import NavIcon from './NavIcon.vue'
import BusquedaGlobal from './BusquedaGlobal.vue'

const auth = useAuthStore()
const router = useRouter()

const SIDEBAR_KEY = 'coaching.sidebarOpen'
function initialSidebarOpen(): boolean {
  const stored = localStorage.getItem(SIDEBAR_KEY)
  if (stored !== null) return stored === 'true'
  return window.matchMedia('(min-width: 640px)').matches
}
const sidebarOpen = ref(initialSidebarOpen())
watch(sidebarOpen, (value) => localStorage.setItem(SIDEBAR_KEY, String(value)))

const userPanelOpen = ref(false)

const rolLabels: Record<'coach' | 'coachee' | 'empresa', string> = {
  coach: 'Coach',
  coachee: 'Coachee',
  empresa: 'Empresa',
}

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

function closeOnMobileNav() {
  if (!window.matchMedia('(min-width: 640px)').matches) {
    sidebarOpen.value = false
  }
}

async function handleLogout() {
  await auth.logout()
  await router.push({ name: 'login' })
}

// --- Cambiar contraseña ---
const changePasswordModalOpen = ref(false)
const guardandoPassword = ref(false)
const passwordForm = reactive({ currentPassword: '', newPassword: '', confirmPassword: '' })
const passwordErrors = reactive<{ newPassword?: string; confirmPassword?: string }>({})

function abrirCambiarPassword() {
  userPanelOpen.value = false
  passwordForm.currentPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
  passwordErrors.newPassword = undefined
  passwordErrors.confirmPassword = undefined
  changePasswordModalOpen.value = true
}

function validarPassword(): boolean {
  passwordErrors.newPassword = passwordForm.newPassword.length < 8
    ? 'La nueva contraseña debe tener al menos 8 caracteres.'
    : undefined
  passwordErrors.confirmPassword = passwordForm.confirmPassword !== passwordForm.newPassword
    ? 'Las contraseñas no coinciden.'
    : undefined
  return !passwordErrors.newPassword && !passwordErrors.confirmPassword
}

async function guardarPassword() {
  if (!validarPassword()) return
  guardandoPassword.value = true
  try {
    await changeOwnPassword(passwordForm.currentPassword, passwordForm.newPassword)
    changePasswordModalOpen.value = false
    await notifySuccess('Contraseña actualizada')
  } catch (err) {
    await notifyError('No se pudo cambiar la contraseña', err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.')
  } finally {
    guardandoPassword.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-[var(--color-ivory)] text-[var(--color-ink)]">
    <div
      v-if="!sidebarOpen"
      class="flex items-center justify-between border-b border-[var(--color-line)] bg-[var(--color-ink)] px-4 py-3 text-[var(--color-parchment)] print:hidden"
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
      class="fixed inset-y-0 left-0 z-40 flex w-64 -translate-x-full flex-col bg-[var(--color-ink)] text-[var(--color-parchment)] transition-transform duration-200 print:hidden"
      :class="{ 'translate-x-0': sidebarOpen }"
    >
      <div class="flex items-center justify-between px-5 py-5">
        <AppLogo
          :size="30"
          dark
        />
        <button
          aria-label="Cerrar menú"
          class="rounded-lg p-1 hover:bg-white/10"
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
          @click="closeOnMobileNav"
        >
          <NavIcon :name="item.icon" />
          {{ item.label }}
        </RouterLink>
      </nav>

      <div
        v-if="auth.user"
        class="relative border-t border-white/10 px-3 py-4"
      >
        <BusquedaGlobal
          v-if="auth.user.role === 'coach'"
          class="mb-3 px-1"
        />

        <div
          v-if="userPanelOpen"
          class="absolute bottom-full left-3 right-3 z-10 mb-2 rounded-xl border border-white/10 bg-[var(--color-ink)] p-4 shadow-xl"
        >
          <p class="font-[family-name:var(--font-heading)] text-sm font-semibold text-[var(--color-parchment)]">
            {{ auth.user.nombre || rolLabels[auth.user.role] }}
          </p>
          <p class="mt-0.5 truncate text-xs text-[var(--color-parchment)]/60">
            {{ auth.user.email }}
          </p>
          <span class="mt-2 inline-block rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--color-parchment)]/70">
            {{ rolLabels[auth.user.role] }}
          </span>
          <button
            type="button"
            class="mt-3 w-full rounded-lg border border-white/10 px-3 py-2 text-left text-xs text-[var(--color-parchment)]/80 hover:bg-white/10"
            @click="abrirCambiarPassword"
          >
            Cambiar contraseña
          </button>
        </div>
        <button
          v-if="userPanelOpen"
          aria-label="Cerrar panel de usuario"
          class="fixed inset-0 z-0 cursor-default"
          @click="userPanelOpen = false"
        />

        <button
          type="button"
          class="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-1.5 text-left hover:bg-white/10"
          @click="userPanelOpen = !userPanelOpen"
        >
          <span class="truncate text-xs text-[var(--color-parchment)]/60">{{ auth.user.email }}</span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="shrink-0 transition-transform"
            :class="{ 'rotate-180': userPanelOpen }"
          ><path d="M6 9l6 6 6-6" /></svg>
        </button>
        <button
          class="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-[var(--color-parchment)]/80 transition-colors hover:bg-white/10 hover:text-[var(--color-parchment)]"
          @click="handleLogout"
        >
          <NavIcon name="logout" />
          Cerrar sesión
        </button>
      </div>
    </aside>

    <main :class="{ 'sm:pl-64': sidebarOpen }">
      <div class="max-w-[1600px] px-4 py-6 sm:px-8 sm:py-8">
        <slot />
      </div>
    </main>

    <AppModal
      v-if="changePasswordModalOpen"
      title="Cambiar contraseña"
      @close="changePasswordModalOpen = false"
    >
      <form
        class="space-y-4"
        @submit.prevent="guardarPassword"
      >
        <label class="block text-sm">
          Contraseña actual
          <input
            v-model="passwordForm.currentPassword"
            type="password"
            required
            autocomplete="current-password"
            class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
          >
        </label>

        <label class="block text-sm">
          Nueva contraseña
          <input
            v-model="passwordForm.newPassword"
            type="password"
            required
            autocomplete="new-password"
            class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            :class="passwordErrors.newPassword ? 'border-[var(--color-bronze)]' : 'border-[var(--color-line)]'"
          >
          <span
            v-if="passwordErrors.newPassword"
            class="mt-1 block text-xs text-[var(--color-bronze)]"
          >{{ passwordErrors.newPassword }}</span>
        </label>

        <label class="block text-sm">
          Confirmar nueva contraseña
          <input
            v-model="passwordForm.confirmPassword"
            type="password"
            required
            autocomplete="new-password"
            class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            :class="passwordErrors.confirmPassword ? 'border-[var(--color-bronze)]' : 'border-[var(--color-line)]'"
          >
          <span
            v-if="passwordErrors.confirmPassword"
            class="mt-1 block text-xs text-[var(--color-bronze)]"
          >{{ passwordErrors.confirmPassword }}</span>
        </label>

        <div class="flex justify-end gap-2 pt-2">
          <button
            type="button"
            class="rounded-lg border border-[var(--color-line)] px-4 py-2 text-sm"
            @click="changePasswordModalOpen = false"
          >
            Cancelar
          </button>
          <button
            type="submit"
            :disabled="guardandoPassword"
            class="rounded-lg bg-[var(--color-ink)] px-4 py-2 text-sm text-[var(--color-parchment)] disabled:opacity-60"
          >
            {{ guardandoPassword ? 'Guardando…' : 'Guardar' }}
          </button>
        </div>
      </form>
    </AppModal>
  </div>
</template>
