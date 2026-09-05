<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { changeOwnPassword } from '../api/users'
import { getMyCoachee, updateOwnContact } from '../api/coachees'
import { obtenerUrlFoto } from '../api/perfilCoach'
import { ApiError } from '../api/client'
import { notifyError, notifySuccess } from '../lib/notify'
import { validateNewPassword } from '../lib/password'
import AppLogo from './AppLogo.vue'
import AppModal from './AppModal.vue'
import NavIcon from './NavIcon.vue'
import SkeletonBlock from './SkeletonBlock.vue'
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

// Solo el coach tiene un PerfilCoach con foto — para coachee/empresa el avatar se queda
// en iniciales. Se carga una vez al montar el shell (no hay store global de perfil hoy).
const avatarFotoUrl = ref<string | null>(null)
onMounted(async () => {
  if (auth.user?.role === 'coach') {
    avatarFotoUrl.value = await obtenerUrlFoto()
  }
})

interface NavItem {
  to: string
  label: string
  icon: string
}

interface NavGroup {
  // Sin label = va pegado al grupo anterior, sin separador ni título (para que el
  // primer grupo — Panorama solo — no lleve una línea encima de la nada).
  label?: string
  items: NavItem[]
}

// Agrupado por rol, mismo criterio que coachNavGroups: Mi Aprendizaje es el resumen
// (sin grupo, primero), "Mi proceso" es la relación de coaching en sí (plan/sesiones/
// progreso), "Estudiar" es todo el material y las herramientas de práctica — Biblioteca
// entra ahí también, es material de estudio igual que Quiz/Flashcards/Mapas, no "proceso".
const coacheeNavGroups: NavGroup[] = [
  { items: [{ to: '/coachee/mi-aprendizaje', label: 'Mi Aprendizaje', icon: 'dashboard' }] },
  {
    label: 'Mi proceso',
    items: [
      { to: '/coachee/plan', label: 'Plan', icon: 'planes' },
      { to: '/coachee/sesiones', label: 'Sesiones', icon: 'sesiones' },
      { to: '/coachee/progreso', label: 'Progreso', icon: 'progreso' },
      { to: '/coachee/mi-coach', label: 'Mi Coach', icon: 'contacto' },
    ],
  },
  {
    label: 'Estudiar',
    items: [
      { to: '/coachee/biblioteca', label: 'Biblioteca', icon: 'biblioteca' },
      // Quiz/Flashcards/Mapas/Ejercicios/Test de Estilo eran 5 ítems propios acá — ahora
      // conviven en /coachee/playground como pestañas (ver PlaygroundView.vue). Biblioteca
      // queda aparte: es material compartido por el coach, no una herramienta de práctica.
      { to: '/coachee/playground', label: 'Playground', icon: 'playground' },
    ],
  },
]

// Agrupado en 3 bloques, no alfabético: quién trabajas (Coachees/Empresas) primero
// porque son la entidad central de la app — todo lo demás (planes, recursos) es "de un
// coachee" —, después el trabajo de coaching en sí, y al final negocio/legal/admin.
const coachNavGroups: NavGroup[] = [
  { items: [{ to: '/coach/dashboard', label: 'Panorama', icon: 'dashboard' }] },
  {
    label: 'Coaching',
    items: [
      { to: '/coach/coachees', label: 'Coachees', icon: 'coachees' },
      { to: '/coach/empresas', label: 'Empresas', icon: 'empresas' },
      { to: '/coach/agenda', label: 'Mi agenda', icon: 'sesiones' },
    ],
  },
  {
    label: 'Trabajo',
    items: [
      { to: '/coach/planes', label: 'Planes', icon: 'planes' },
      { to: '/coach/recursos', label: 'Recursos', icon: 'recursos' },
      // Quiz/Flashcards/Mapas/Ejercicios/Test de Estilo eran 5 ítems propios acá — muy
      // parecidos entre sí (misma pantalla lista→detalle), ahora conviven en /coach/estudio
      // como pestañas (ver EstudioView.vue), mismo label que ya usa el grupo "Estudiar" del
      // coachee para este mismo tipo de contenido.
      { to: '/coach/estudio', label: 'Estudiar', icon: 'biblioteca' },
    ],
  },
  {
    label: 'Administración',
    items: [
      { to: '/coach/negocio', label: 'Negocio', icon: 'negocio' },
      { to: '/coach/legal', label: 'Legal y auditoría', icon: 'legal' },
      { to: '/coach/usuarios', label: 'Usuarios', icon: 'usuarios' },
      { to: '/coach/configuracion', label: 'Configuración', icon: 'configuracion' },
      { to: '/coach/perfil', label: 'Mi perfil', icon: 'contacto' },
    ],
  },
]

const empresaNavGroups: NavGroup[] = [
  {
    items: [
      { to: '/empresa/dashboard', label: 'Resumen', icon: 'dashboard' },
      { to: '/empresa/coachees', label: 'Coachees', icon: 'coachees' },
      { to: '/empresa/finanzas', label: 'Finanzas', icon: 'negocio' },
      { to: '/empresa/informe', label: 'Informe', icon: 'certificado' },
      { to: '/empresa/satisfaccion', label: 'Satisfacción', icon: 'satisfaccion' },
      { to: '/empresa/coach', label: 'Mi Coach', icon: 'contacto' },
    ],
  },
]

const navGroups = computed<NavGroup[]>(() => {
  if (auth.user?.role === 'coachee') return coacheeNavGroups
  if (auth.user?.role === 'coach') return coachNavGroups
  if (auth.user?.role === 'empresa') return empresaNavGroups
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

      <nav class="flex-1 select-none overflow-y-auto px-3 py-3">
        <div
          v-for="(group, i) in navGroups"
          :key="i"
          :class="i > 0 ? 'mt-3 border-t border-white/10 pt-3' : ''"
        >
          <p
            v-if="group.label"
            class="mb-1 px-3 text-[10px] font-medium uppercase tracking-wide text-[var(--color-parchment)]/40"
          >
            {{ group.label }}
          </p>
          <div class="space-y-0.5">
            <RouterLink
              v-for="item in group.items"
              :key="item.to"
              :to="item.to"
              class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-[var(--color-parchment)]/80 transition-colors hover:bg-white/10 hover:text-[var(--color-parchment)]"
              active-class="bg-[var(--color-sage)]/20 text-[var(--color-parchment)] font-medium"
              @click="closeOnMobileNav"
            >
              <NavIcon :name="item.icon" />
              {{ item.label }}
            </RouterLink>
          </div>
        </div>
      </nav>
    </aside>

    <main
      class="print:pl-0!"
      :class="{ 'sm:pl-64': sidebarOpen }"
    >
      <header class="sticky top-0 z-20 flex items-center gap-3 border-b border-[var(--color-line)] bg-[var(--color-ivory)] px-4 py-3 sm:px-8 print:hidden">
        <button
          v-if="!sidebarOpen"
          aria-label="Abrir menú"
          class="rounded-lg p-1.5 hover:bg-[var(--color-parchment)]/60"
          @click="sidebarOpen = true"
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
              class="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[var(--color-ink)] text-xs font-semibold text-[var(--color-parchment)]"
              @click="userPanelOpen = !userPanelOpen"
            >
              <img
                v-if="avatarFotoUrl"
                :src="avatarFotoUrl"
                alt=""
                class="h-full w-full object-cover"
              >
              <template v-else>
                {{ avatarInitials }}
              </template>
            </button>
            <button
              v-if="userPanelOpen"
              aria-label="Cerrar panel de cuenta"
              class="fixed inset-0 z-20 cursor-default"
              @click="userPanelOpen = false"
            />
            <div
              v-if="userPanelOpen"
              class="absolute right-0 top-full z-30 mt-2 w-72 rounded-xl border border-[var(--color-line)] bg-white p-4 shadow-xl"
            >
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-ink)] text-sm font-semibold text-[var(--color-parchment)]">
                  <img
                    v-if="avatarFotoUrl"
                    :src="avatarFotoUrl"
                    alt=""
                    class="h-full w-full object-cover"
                  >
                  <template v-else>
                    {{ avatarInitials }}
                  </template>
                </div>
                <div class="min-w-0">
                  <p class="truncate font-[family-name:var(--font-heading)] text-sm font-semibold">
                    {{ auth.user.nombre || rolLabels[auth.user.role] }}
                  </p>
                  <span class="mt-0.5 inline-block rounded-full bg-[var(--color-parchment)] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--color-ink)]/70">
                    {{ rolLabels[auth.user.role] }}
                  </span>
                </div>
              </div>
              <p class="mt-2 truncate text-xs text-[var(--color-ink)]/60">
                {{ auth.user.email }}
              </p>

              <div class="mt-3 space-y-0.5 border-t border-[var(--color-line)] pt-2">
                <button
                  type="button"
                  class="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm hover:bg-[var(--color-parchment)]/50"
                  @click="abrirCambiarPassword"
                >
                  <NavIcon name="password" />
                  Cambiar contraseña
                </button>
                <button
                  v-if="auth.user.role === 'coachee'"
                  type="button"
                  class="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm hover:bg-[var(--color-parchment)]/50"
                  @click="abrirEditarContacto"
                >
                  <NavIcon name="contacto" />
                  Editar mis datos de contacto
                </button>
              </div>

              <div class="mt-2 space-y-0.5 border-t border-[var(--color-line)] pt-2">
                <button
                  type="button"
                  class="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm text-[var(--color-bronze)] hover:bg-[var(--color-bronze)]/10"
                  @click="handleLogout"
                >
                  <NavIcon name="logout" />
                  Cerrar sesión
                </button>
              </div>
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
              class="mt-1 block text-xs text-[var(--color-danger)]"
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
            class="mt-1 block text-xs text-[var(--color-danger)]"
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
      <SkeletonBlock
        v-if="cargandoContacto"
        :rows="2"
      />
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
