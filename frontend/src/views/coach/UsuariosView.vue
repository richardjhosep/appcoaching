<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import AppShell from '../../components/AppShell.vue'
import AppModal from '../../components/AppModal.vue'
import Pagination from '../../components/Pagination.vue'
import StatusToggle from '../../components/StatusToggle.vue'
import IconButton from '../../components/IconButton.vue'
import { createEmpresaUser, deleteUser, listUsers, resetPassword, setUserActivo, type UserAccount } from '../../api/users'
import { listEmpresas, type Empresa } from '../../api/empresas'
import { ApiError } from '../../api/client'
import { notifyError, notifySuccess, confirmDialog, showCredential } from '../../lib/notify'

const PAGE_SIZE = 12

const loading = ref(true)
const usuarios = ref<UserAccount[]>([])
const empresas = ref<Empresa[]>([])
const search = ref('')
const filtroRol = ref<'' | 'coach' | 'coachee' | 'empresa'>('')
const filtroEstado = ref<'' | 'activas' | 'inactivas'>('')
const page = ref(1)

async function load() {
  loading.value = true
  const [u, e] = await Promise.all([listUsers(), listEmpresas()])
  usuarios.value = u
  empresas.value = e
  loading.value = false
}

onMounted(load)

const rolLabels: Record<UserAccount['role'], string> = {
  coach: 'Coach',
  coachee: 'Coachee',
  empresa: 'Empresa',
}

const filtradas = computed(() => {
  const q = search.value.trim().toLowerCase()
  return usuarios.value.filter((u) => {
    if (q && !u.email.toLowerCase().includes(q)) return false
    if (filtroRol.value && u.role !== filtroRol.value) return false
    if (filtroEstado.value === 'activas' && !u.isActive) return false
    if (filtroEstado.value === 'inactivas' && u.isActive) return false
    return true
  })
})

const paginadas = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE
  return filtradas.value.slice(start, start + PAGE_SIZE)
})

function limpiarFiltros() {
  search.value = ''
  filtroRol.value = ''
  filtroEstado.value = ''
  page.value = 1
}

// --- Modal de creación (cuenta Empresa) ---
const modalOpen = ref(false)
const guardando = ref(false)
const form = reactive({ email: '', empresaId: '' })
const errors = reactive<{ email?: string; empresaId?: string }>({})

function abrirCrear() {
  form.email = ''
  form.empresaId = ''
  errors.email = undefined
  errors.empresaId = undefined
  modalOpen.value = true
}

function validar(): boolean {
  errors.email = /.+@.+\..+/.test(form.email.trim()) ? undefined : 'Ingresa un email válido.'
  errors.empresaId = form.empresaId ? undefined : 'Selecciona una empresa.'
  return !errors.email && !errors.empresaId
}

async function guardar() {
  if (!validar()) return
  guardando.value = true
  try {
    const resultado = await createEmpresaUser(form.email, form.empresaId)
    modalOpen.value = false
    await load()
    await showCredential(resultado.email, resultado.temporaryPassword)
  } catch (err) {
    await notifyError('No se pudo crear la cuenta', err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.')
  } finally {
    guardando.value = false
  }
}

async function toggleActivo(usuario: UserAccount) {
  const activar = !usuario.isActive
  const confirmado = await confirmDialog({
    title: activar ? '¿Activar esta cuenta?' : '¿Desactivar esta cuenta?',
    text: activar
      ? `${usuario.email} podrá volver a iniciar sesión.`
      : `${usuario.email} no podrá iniciar sesión mientras esté inactiva.`,
    confirmText: activar ? 'Activar' : 'Desactivar',
    danger: !activar,
  })
  if (!confirmado) return
  try {
    await setUserActivo(usuario.id, activar)
    await load()
    await notifySuccess(activar ? 'Cuenta activada' : 'Cuenta desactivada')
  } catch (err) {
    await notifyError('No se pudo cambiar el estado', err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.')
  }
}

const restableciendo = ref<string | null>(null)

async function restablecer(usuario: UserAccount) {
  const confirmado = await confirmDialog({
    title: '¿Restablecer contraseña?',
    text: `Se generará una nueva contraseña temporal para ${usuario.email}.`,
    confirmText: 'Restablecer',
  })
  if (!confirmado) return
  restableciendo.value = usuario.id
  try {
    const { temporaryPassword } = await resetPassword(usuario.id)
    await showCredential(usuario.email, temporaryPassword)
  } catch (err) {
    await notifyError('No se pudo restablecer la contraseña', err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.')
  } finally {
    restableciendo.value = null
  }
}

async function eliminar(usuario: UserAccount) {
  const confirmado = await confirmDialog({
    title: '¿Eliminar esta cuenta?',
    text: `Esta acción no se puede deshacer. Se eliminará ${usuario.email} de forma definitiva.`,
    confirmText: 'Eliminar',
    danger: true,
  })
  if (!confirmado) return
  try {
    await deleteUser(usuario.id)
    await load()
    await notifySuccess('Cuenta eliminada')
  } catch (err) {
    await notifyError('No se pudo eliminar', err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.')
  }
}
</script>

<template>
  <AppShell>
    <div class="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="font-[family-name:var(--font-heading)] text-xl font-semibold">
          Mantenedor de Usuarios
        </h1>
        <p class="text-sm text-[var(--color-ink)]/60">
          Gestión y administración de las cuentas del sistema.
        </p>
      </div>
      <button
        class="rounded-lg bg-[var(--color-ink)] px-4 py-2 text-sm font-medium text-[var(--color-parchment)]"
        @click="abrirCrear"
      >
        + Nuevo Usuario
      </button>
    </div>

    <div
      v-if="loading"
      class="text-sm text-[var(--color-ink)]/60"
    >
      Cargando…
    </div>
    <div
      v-else
      class="space-y-3"
    >
      <div class="flex flex-wrap items-center gap-2">
        <select
          v-model="filtroRol"
          class="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-sm"
          @change="page = 1"
        >
          <option value="">
            Rol: Todos
          </option>
          <option value="coach">
            Coach
          </option>
          <option value="coachee">
            Coachee
          </option>
          <option value="empresa">
            Empresa
          </option>
        </select>
        <select
          v-model="filtroEstado"
          class="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-sm"
          @change="page = 1"
        >
          <option value="">
            Estado: Todos
          </option>
          <option value="activas">
            Activos
          </option>
          <option value="inactivas">
            Inactivos
          </option>
        </select>
        <button
          v-if="filtroRol || filtroEstado || search"
          class="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-xs hover:bg-[var(--color-parchment)]/50"
          @click="limpiarFiltros"
        >
          × Limpiar
        </button>
        <span class="ml-auto text-xs text-[var(--color-ink)]/50">{{ filtradas.length }} registro(s)</span>
      </div>

      <input
        v-model="search"
        type="search"
        placeholder="Buscar por email…"
        class="w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
        @input="page = 1"
      >

      <div class="overflow-x-auto rounded-2xl border border-[var(--color-line)] bg-white">
        <table class="w-full text-left text-sm">
          <thead>
            <tr class="border-b border-[var(--color-line)] bg-[var(--color-parchment)] text-xs text-[var(--color-ink)]/60">
              <th class="px-4 py-3">
                Email
              </th>
              <th class="px-4 py-3">
                Rol
              </th>
              <th class="px-4 py-3">
                Empresa
              </th>
              <th class="px-4 py-3">
                Estado
              </th>
              <th class="px-4 py-3">
                Creado
              </th>
              <th class="px-4 py-3">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-if="paginadas.length === 0"
              class="border-b border-[var(--color-line)] last:border-0"
            >
              <td
                colspan="6"
                class="px-4 py-6 text-center text-sm text-[var(--color-ink)]/50"
              >
                Sin resultados.
              </td>
            </tr>
            <tr
              v-for="u in paginadas"
              :key="u.id"
              class="border-b border-[var(--color-line)] last:border-0"
            >
              <td class="px-4 py-3 font-medium">
                {{ u.email }}
              </td>
              <td class="px-4 py-3">
                {{ rolLabels[u.role] }}
              </td>
              <td class="px-4 py-3 text-[var(--color-ink)]/70">
                {{ u.empresa?.nombre ?? '—' }}
              </td>
              <td class="px-4 py-3">
                <StatusToggle
                  :active="u.isActive"
                  @toggle="toggleActivo(u)"
                />
              </td>
              <td class="px-4 py-3 text-xs text-[var(--color-ink)]/60">
                {{ u.createdAt ? new Date(u.createdAt).toLocaleDateString('es-CL') : '—' }}
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <button
                    :disabled="restableciendo === u.id"
                    class="rounded-lg border border-[var(--color-line)] px-2 py-1 text-xs hover:bg-[var(--color-parchment)]/50 disabled:opacity-50"
                    @click="restablecer(u)"
                  >
                    Restablecer contraseña
                  </button>
                  <IconButton
                    icon="eliminar"
                    title="Eliminar"
                    @click="eliminar(u)"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Pagination
        v-model:page="page"
        :total-items="filtradas.length"
        :page-size="PAGE_SIZE"
      />
    </div>

    <AppModal
      v-if="modalOpen"
      title="Nuevo usuario (cuenta Empresa)"
      @close="modalOpen = false"
    >
      <form
        class="space-y-4"
        @submit.prevent="guardar"
      >
        <label class="block text-sm">
          Email
          <input
            v-model="form.email"
            type="email"
            class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            :class="errors.email ? 'border-[var(--color-bronze)]' : 'border-[var(--color-line)]'"
          >
          <span
            v-if="errors.email"
            class="mt-1 block text-xs text-[var(--color-bronze)]"
          >{{ errors.email }}</span>
        </label>

        <label class="block text-sm">
          Empresa
          <select
            v-model="form.empresaId"
            class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            :class="errors.empresaId ? 'border-[var(--color-bronze)]' : 'border-[var(--color-line)]'"
          >
            <option value="">
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
          <span
            v-if="errors.empresaId"
            class="mt-1 block text-xs text-[var(--color-bronze)]"
          >{{ errors.empresaId }}</span>
        </label>

        <div class="flex justify-end gap-2 pt-2">
          <button
            type="button"
            class="rounded-lg border border-[var(--color-line)] px-4 py-2 text-sm"
            @click="modalOpen = false"
          >
            Cancelar
          </button>
          <button
            type="submit"
            :disabled="guardando"
            class="rounded-lg bg-[var(--color-ink)] px-4 py-2 text-sm text-[var(--color-parchment)] disabled:opacity-60"
          >
            {{ guardando ? 'Guardando…' : 'Guardar' }}
          </button>
        </div>
      </form>
    </AppModal>
  </AppShell>
</template>
