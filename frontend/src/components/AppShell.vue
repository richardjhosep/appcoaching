<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { changeOwnPassword } from '../api/users'
import { getMyCoachee, updateOwnContact } from '../api/coachees'
import { ApiError } from '../api/client'
import { notifyError, notifySuccess } from '../lib/notify'
import { validateNewPassword } from '../lib/password'
import AppLogo from './AppLogo.vue'
import AppModal from './AppModal.vue'
import NavIcon from './NavIcon.vue'
import BusquedaGlobal from './BusquedaGlobal.vue'
import NotificationBell from './NotificationBell.vue'
import PasswordField from './PasswordField.vue'
import PasswordStrengthMeter from './PasswordStrengthMeter.vue'

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

const avatarInitials = computed(() => {
  const nombre = auth.user?.nombre
  if (nombre) {
    const partes = nombre.trim().split(/\s+/)
    const primera = partes[0]?.[0] ?? ''
    const ultima = partes.length > 1 ? partes[partes.length - 1][0] : ''
    return (primera + ultima).toUpperCase()
  }
  return auth.user?.email.slice(0, 2).toUpperCase() ?? '?'
})

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
  userPanelOpen.value = false
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
  passwordErrors.newPassword = validateNewPassword(passwordForm.newPassword)
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

// --- Editar mis datos de contacto (coachee) ---
const contactModalOpen = ref(false)
const cargandoContacto = ref(false)
const guardandoContacto = ref(false)
const contactForm = reactive({ telefono: '', emailContacto: '' })

async function abrirEditarContacto() {
  userPanelOpen.value = false
  contactModalOpen.value = true
  cargandoContacto.value = true
  try {
    const coachee = await getMyCoachee()
    contactForm.telefono = coachee.telefono ?? ''
    contactForm.emailContacto = coachee.emailContacto ?? ''
  } catch (err) {
    contactModalOpen.value = false
    await notifyError(
      'No se pudieron cargar tus datos de contacto',
      err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.',
    )
  } finally {
    cargandoContacto.value = false
  }
}

async function guardarContacto() {
  guardandoContacto.value = true
  try {
    await updateOwnContact({
      telefono: contactForm.telefono || undefined,
      emailContacto: contactForm.emailContacto || undefined,
    })
    contactModalOpen.value = false
    await notifySuccess('Datos de contacto actualizados')
  } catch (err) {
    await notifyError('No se pudo guardar', err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.')
  } finally {
    guardandoContacto.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-[var(--color-ivory)] text-[var(--color-ink)]">
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

      <div
        v-if="auth.user?.role === 'coach'"
        class="border-b border-white/10 px-4 py-3"
      >
        <BusquedaGlobal />
      </div>

      <nav class="flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
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
    </aside>

    <main :class="{ 'sm:pl-64': sidebarOpen }">
      <header class="sticky top-0 z-20 flex items-center gap-3 border-b border-[var(--color-line)] bg-[var(--color-ivory)] px-4 py-3 sm:px-8 print:hidden">
        <button
          aria-label="Alternar menú"
          class="rounded-lg p-1.5 hover:bg-[var(--color-parchment)]/60"
          @click="sidebarOpen = !sidebarOpen"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          ><path d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
        <div class="flex-1" />
        <template v-if="auth.user">
          <NotificationBell />
          <div class="relative">
            <button
              type="button"
              aria-label="Cuenta"
              class="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-ink)] text-xs font-semibold text-[var(--color-parchment)]"
              @click="userPanelOpen = !userPanelOpen"
            >
              {{ avatarInitials }}
            </button>
            <button
              v-if="userPanelOpen"
              aria-label="Cerrar panel de cuenta"
              class="fixed inset-0 z-20 cursor-default"
              @click="userPanelOpen = false"
            />
            <div
              v-if="userPanelOpen"
              class="absolute right-0 top-full z-30 mt-2 w-64 rounded-xl border border-[var(--color-line)] bg-white p-4 shadow-xl"
            >
              <p class="font-[family-name:var(--font-heading)] text-sm font-semibold">
                {{ auth.user.nombre || rolLabels[auth.user.role] }}
              </p>
              <p class="mt-0.5 truncate text-xs text-[var(--color-ink)]/60">
                {{ auth.user.email }}
              </p>
              <span class="mt-2 inline-block rounded-full bg-[var(--color-parchment)] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--color-ink)]/70">
                {{ rolLabels[auth.user.role] }}
              </span>
              <button
                type="button"
                class="mt-3 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-left text-xs hover:bg-[var(--color-parchment)]/50"
                @click="abrirCambiarPassword"
              >
                Cambiar contraseña
              </button>
              <button
                v-if="auth.user.role === 'coachee'"
                type="button"
                class="mt-2 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-left text-xs hover:bg-[var(--color-parchment)]/50"
                @click="abrirEditarContacto"
              >
                Editar mis datos de contacto
              </button>
              <button
                type="button"
                class="mt-2 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-left text-xs hover:bg-[var(--color-parchment)]/50"
                @click="handleLogout"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </template>
      </header>
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
        <PasswordField
          v-model="passwordForm.currentPassword"
          label="Contraseña actual"
          autocomplete="current-password"
        />

        <div>
          <PasswordField
            v-model="passwordForm.newPassword"
            label="Nueva contraseña"
            autocomplete="new-password"
            :minlength="12"
            :invalid="!!passwordErrors.newPassword"
          >
            <span
              v-if="passwordErrors.newPassword"
              class="mt-1 block text-xs text-[var(--color-bronze)]"
            >{{ passwordErrors.newPassword }}</span>
          </PasswordField>
          <PasswordStrengthMeter :password="passwordForm.newPassword" />
        </div>

        <PasswordField
          v-model="passwordForm.confirmPassword"
          label="Confirmar nueva contraseña"
          autocomplete="new-password"
          :minlength="12"
          :invalid="!!passwordErrors.confirmPassword"
        >
          <span
            v-if="passwordErrors.confirmPassword"
            class="mt-1 block text-xs text-[var(--color-bronze)]"
          >{{ passwordErrors.confirmPassword }}</span>
        </PasswordField>

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

    <AppModal
      v-if="contactModalOpen"
      title="Editar mis datos de contacto"
      @close="contactModalOpen = false"
    >
      <p
        v-if="cargandoContacto"
        class="text-sm text-[var(--color-ink)]/60"
      >
        Cargando…
      </p>
      <form
        v-else
        class="space-y-4"
        @submit.prevent="guardarContacto"
      >
        <label class="block text-sm">
          Teléfono
          <input
            v-model="contactForm.telefono"
            type="tel"
            class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
          >
        </label>

        <label class="block text-sm">
          Email de contacto
          <input
            v-model="contactForm.emailContacto"
            type="email"
            class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
          >
        </label>

        <div class="flex justify-end gap-2 pt-2">
          <button
            type="button"
            class="rounded-lg border border-[var(--color-line)] px-4 py-2 text-sm"
            @click="contactModalOpen = false"
          >
            Cancelar
          </button>
          <button
            type="submit"
            :disabled="guardandoContacto"
            class="rounded-lg bg-[var(--color-ink)] px-4 py-2 text-sm text-[var(--color-parchment)] disabled:opacity-60"
          >
            {{ guardandoContacto ? 'Guardando…' : 'Guardar' }}
          </button>
        </div>
      </form>
    </AppModal>
  </div>
</template>
