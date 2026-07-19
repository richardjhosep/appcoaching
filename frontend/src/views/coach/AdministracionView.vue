<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppShell from '../../components/AppShell.vue'
import { createEmpresa, listEmpresas, type Empresa } from '../../api/empresas'
import { createCoachee, listCoachees, type CoacheeListItem } from '../../api/coachees'
import { createEmpresaUser, listUsers, resetPassword, type UserAccount } from '../../api/users'
import { ApiError } from '../../api/client'

const loading = ref(true)
const empresas = ref<Empresa[]>([])
const coachees = ref<CoacheeListItem[]>([])
const usuarios = ref<UserAccount[]>([])
const error = ref<string | null>(null)
const credencialGenerada = ref<{ email: string; temporaryPassword: string } | null>(null)

async function load() {
  loading.value = true
  const [e, c, u] = await Promise.all([listEmpresas(), listCoachees(), listUsers()])
  empresas.value = e
  coachees.value = c
  usuarios.value = u
  loading.value = false
}

onMounted(load)

const nombreEmpresa = ref('')
const tarifaHoraEmpresa = ref<number | null>(null)
const creandoEmpresa = ref(false)

async function crearEmpresa() {
  if (!nombreEmpresa.value.trim() || tarifaHoraEmpresa.value === null) return
  error.value = null
  creandoEmpresa.value = true
  try {
    await createEmpresa(nombreEmpresa.value, tarifaHoraEmpresa.value)
    nombreEmpresa.value = ''
    tarifaHoraEmpresa.value = null
    empresas.value = await listEmpresas()
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'No se pudo crear la empresa.'
  } finally {
    creandoEmpresa.value = false
  }
}

const nombreCoachee = ref('')
const emailCoachee = ref('')
const empresaIdCoachee = ref('')
const jefeDirecto = ref('')
const objetivoProceso = ref('')
const tarifaPropiaCoachee = ref<number | null>(null)
const areaGerencia = ref('')
const creandoCoachee = ref(false)

async function crearCoachee() {
  if (!nombreCoachee.value.trim() || !emailCoachee.value.trim()) return
  error.value = null
  creandoCoachee.value = true
  try {
    const resultado = await createCoachee({
      nombre: nombreCoachee.value,
      email: emailCoachee.value,
      empresaId: empresaIdCoachee.value || undefined,
      jefeDirecto: jefeDirecto.value || undefined,
      objetivoProceso: objetivoProceso.value || undefined,
      tarifaPropia: tarifaPropiaCoachee.value ?? undefined,
      areaGerencia: areaGerencia.value || undefined,
    })
    if (resultado.temporaryPassword) {
      credencialGenerada.value = {
        email: emailCoachee.value,
        temporaryPassword: resultado.temporaryPassword,
      }
    }
    nombreCoachee.value = ''
    emailCoachee.value = ''
    empresaIdCoachee.value = ''
    jefeDirecto.value = ''
    objetivoProceso.value = ''
    tarifaPropiaCoachee.value = null
    areaGerencia.value = ''
    coachees.value = await listCoachees()
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'No se pudo crear el coachee.'
  } finally {
    creandoCoachee.value = false
  }
}

const emailUsuarioEmpresa = ref('')
const empresaIdUsuario = ref('')
const creandoUsuario = ref(false)

async function crearUsuarioEmpresa() {
  if (!emailUsuarioEmpresa.value.trim() || !empresaIdUsuario.value) return
  error.value = null
  creandoUsuario.value = true
  try {
    const resultado = await createEmpresaUser(emailUsuarioEmpresa.value, empresaIdUsuario.value)
    credencialGenerada.value = {
      email: resultado.email,
      temporaryPassword: resultado.temporaryPassword,
    }
    emailUsuarioEmpresa.value = ''
    empresaIdUsuario.value = ''
    usuarios.value = await listUsers()
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'No se pudo crear la cuenta.'
  } finally {
    creandoUsuario.value = false
  }
}

const restableciendo = ref<string | null>(null)

async function restablecerContrasena(usuario: UserAccount) {
  error.value = null
  restableciendo.value = usuario.id
  try {
    const { temporaryPassword } = await resetPassword(usuario.id)
    credencialGenerada.value = { email: usuario.email, temporaryPassword }
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'No se pudo restablecer la contraseña.'
  } finally {
    restableciendo.value = null
  }
}

const nombreEmpresaPorId = computed(() => {
  const mapa: Record<string, string> = {}
  for (const e of empresas.value) mapa[e.id] = e.nombre
  return mapa
})
</script>

<template>
  <AppShell>
    <h1 class="mb-4 font-[family-name:var(--font-heading)] text-xl font-semibold">
      Administración
    </h1>

    <div
      v-if="loading"
      class="text-sm text-[var(--color-ink)]/60"
    >
      Cargando…
    </div>
    <div
      v-else
      class="space-y-4"
    >
      <p
        v-if="error"
        class="text-sm text-[var(--color-bronze)]"
      >
        {{ error }}
      </p>
      <div
        v-if="credencialGenerada"
        class="flex items-center justify-between rounded-2xl border border-[var(--color-sage)] bg-[var(--color-sage)]/10 p-4 text-sm"
      >
        <div>
          <p class="font-medium">
            Credencial temporal para {{ credencialGenerada.email }}
          </p>
          <p class="font-[family-name:var(--font-mono)]">
            {{ credencialGenerada.temporaryPassword }}
          </p>
          <p class="text-xs text-[var(--color-ink)]/60">
            Compártela manualmente ahora — no se volverá a mostrar.
          </p>
        </div>
        <button
          class="shrink-0 rounded-lg border border-[var(--color-line)] px-2 py-1 text-xs"
          @click="credencialGenerada = null"
        >
          Cerrar
        </button>
      </div>

      <!-- Empresas -->
      <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
        <h2 class="mb-3 text-sm font-medium">
          Empresas ({{ empresas.length }})
        </h2>
        <ul
          v-if="empresas.length"
          class="mb-4 space-y-1 text-sm"
        >
          <li
            v-for="e in empresas"
            :key="e.id"
          >
            {{ e.nombre }} — ${{ e.tarifaHora.toLocaleString('es-CL') }}/hora
          </li>
        </ul>
        <p
          v-else
          class="mb-4 text-sm text-[var(--color-ink)]/60"
        >
          Todavía no hay empresas creadas.
        </p>
        <form
          class="flex flex-wrap items-end gap-2"
          @submit.prevent="crearEmpresa"
        >
          <label class="text-xs text-[var(--color-ink)]/60">
            Nombre
            <input
              v-model="nombreEmpresa"
              type="text"
              required
              class="mt-1 block w-40 rounded border border-[var(--color-line)] px-2 py-1 text-sm"
            >
          </label>
          <label class="text-xs text-[var(--color-ink)]/60">
            Tarifa/hora (CLP)
            <input
              v-model.number="tarifaHoraEmpresa"
              type="number"
              min="0"
              required
              class="mt-1 block w-28 rounded border border-[var(--color-line)] px-2 py-1 text-sm"
            >
          </label>
          <button
            type="submit"
            :disabled="creandoEmpresa"
            class="rounded-lg bg-[var(--color-ink)] px-3 py-2 text-xs text-[var(--color-parchment)] disabled:opacity-50"
          >
            Crear empresa
          </button>
        </form>
      </div>

      <!-- Coachees -->
      <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
        <h2 class="mb-3 text-sm font-medium">
          Coachees ({{ coachees.length }})
        </h2>
        <ul
          v-if="coachees.length"
          class="mb-4 space-y-1 text-sm"
        >
          <li
            v-for="c in coachees"
            :key="c.id"
          >
            {{ c.nombre }}
            <span
              v-if="c.empresaId"
              class="text-[var(--color-ink)]/60"
            >— {{ nombreEmpresaPorId[c.empresaId] ?? c.empresaId }}</span>
            <span
              v-else
              class="text-[var(--color-ink)]/60"
            >— independiente</span>
          </li>
        </ul>
        <p
          v-else
          class="mb-4 text-sm text-[var(--color-ink)]/60"
        >
          Todavía no hay coachees creados.
        </p>
        <form
          class="grid gap-2 sm:grid-cols-2"
          @submit.prevent="crearCoachee"
        >
          <label class="text-xs text-[var(--color-ink)]/60">
            Nombre
            <input
              v-model="nombreCoachee"
              type="text"
              required
              class="mt-1 block w-full rounded border border-[var(--color-line)] px-2 py-1 text-sm"
            >
          </label>
          <label class="text-xs text-[var(--color-ink)]/60">
            Email
            <input
              v-model="emailCoachee"
              type="email"
              required
              class="mt-1 block w-full rounded border border-[var(--color-line)] px-2 py-1 text-sm"
            >
          </label>
          <label class="text-xs text-[var(--color-ink)]/60">
            Empresa (opcional, independiente si se deja vacío)
            <select
              v-model="empresaIdCoachee"
              class="mt-1 block w-full rounded border border-[var(--color-line)] px-2 py-1 text-sm"
            >
              <option value="">
                Independiente
              </option>
              <option
                v-for="e in empresas"
                :key="e.id"
                :value="e.id"
              >
                {{ e.nombre }}
              </option>
            </select>
          </label>
          <label class="text-xs text-[var(--color-ink)]/60">
            Área/gerencia (opcional)
            <input
              v-model="areaGerencia"
              type="text"
              class="mt-1 block w-full rounded border border-[var(--color-line)] px-2 py-1 text-sm"
            >
          </label>
          <label class="text-xs text-[var(--color-ink)]/60">
            Jefe directo (opcional)
            <input
              v-model="jefeDirecto"
              type="text"
              class="mt-1 block w-full rounded border border-[var(--color-line)] px-2 py-1 text-sm"
            >
          </label>
          <label class="text-xs text-[var(--color-ink)]/60">
            Tarifa propia por hora, CLP (opcional)
            <input
              v-model.number="tarifaPropiaCoachee"
              type="number"
              min="0"
              class="mt-1 block w-full rounded border border-[var(--color-line)] px-2 py-1 text-sm"
            >
          </label>
          <label class="text-xs text-[var(--color-ink)]/60 sm:col-span-2">
            Objetivo del proceso (opcional)
            <textarea
              v-model="objetivoProceso"
              rows="2"
              class="mt-1 block w-full rounded border border-[var(--color-line)] px-2 py-1 text-sm"
            />
          </label>
          <button
            type="submit"
            :disabled="creandoCoachee"
            class="rounded-lg bg-[var(--color-ink)] px-3 py-2 text-xs text-[var(--color-parchment)] disabled:opacity-50 sm:col-span-2 sm:w-fit"
          >
            Crear coachee
          </button>
        </form>
      </div>

      <!-- Usuarios -->
      <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
        <h2 class="mb-3 text-sm font-medium">
          Cuentas de usuario ({{ usuarios.length }})
        </h2>
        <ul
          v-if="usuarios.length"
          class="mb-4 space-y-1 text-sm"
        >
          <li
            v-for="u in usuarios"
            :key="u.id"
            class="flex flex-wrap items-center justify-between gap-2"
          >
            <span>{{ u.email }} <span class="text-[var(--color-ink)]/60">({{ u.role }})</span></span>
            <button
              :disabled="restableciendo === u.id"
              class="shrink-0 rounded-lg border border-[var(--color-line)] px-2 py-1 text-xs hover:bg-[var(--color-parchment)]/50 disabled:opacity-50"
              @click="restablecerContrasena(u)"
            >
              Restablecer contraseña
            </button>
          </li>
        </ul>
        <p
          v-else
          class="mb-4 text-sm text-[var(--color-ink)]/60"
        >
          Todavía no hay cuentas de usuario creadas.
        </p>
        <form
          class="flex flex-wrap items-end gap-2"
          @submit.prevent="crearUsuarioEmpresa"
        >
          <label class="text-xs text-[var(--color-ink)]/60">
            Email de la cuenta Empresa
            <input
              v-model="emailUsuarioEmpresa"
              type="email"
              required
              class="mt-1 block w-56 rounded border border-[var(--color-line)] px-2 py-1 text-sm"
            >
          </label>
          <label class="text-xs text-[var(--color-ink)]/60">
            Empresa
            <select
              v-model="empresaIdUsuario"
              required
              class="mt-1 block w-40 rounded border border-[var(--color-line)] px-2 py-1 text-sm"
            >
              <option
                value=""
                disabled
              >
                Selecciona…
              </option>
              <option
                v-for="e in empresas"
                :key="e.id"
                :value="e.id"
              >
                {{ e.nombre }}
              </option>
            </select>
          </label>
          <button
            type="submit"
            :disabled="creandoUsuario"
            class="rounded-lg bg-[var(--color-ink)] px-3 py-2 text-xs text-[var(--color-parchment)] disabled:opacity-50"
          >
            Crear cuenta Empresa
          </button>
        </form>
      </div>
    </div>
  </AppShell>
</template>
