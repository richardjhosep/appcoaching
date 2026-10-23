<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import AppShell from '../../components/AppShell.vue'
import AppModal from '../../components/AppModal.vue'
import Pagination from '../../components/Pagination.vue'
import StatusToggle from '../../components/StatusToggle.vue'
import IconButton from '../../components/IconButton.vue'
import { useAuthStore } from '../../stores/auth'
import { useRouter } from 'vue-router'
import SkeletonBlock from '../../components/SkeletonBlock.vue'
import ErrorState from '../../components/ErrorState.vue'
import AppButton from '../../components/AppButton.vue'
import FormField from '../../components/FormField.vue'
import StatusBadge from '../../components/StatusBadge.vue'
import { createEmpresaUser, deleteUser, listUsers, resetPassword, setUserActivo, type UserAccount } from '../../api/users'
import { listEmpresas, type Empresa } from '../../api/empresas'
import { ApiError } from '../../api/client'
import { notifyError, notifySuccess, confirmDialog } from '../../lib/notify'
import { dentroDeRango } from '../../lib/dateRange'
import { useCarga } from '../../lib/useCarga'
import { enfocarPrimerInvalido } from '../../lib/enfocarInvalido'

const PAGE_SIZE = 12

const usuarios = ref<UserAccount[]>([])
const empresas = ref<Empresa[]>([])
const search = ref('')
const filtroRol = ref<'' | 'coach' | 'coachee' | 'empresa'>('')
const filtroEstado = ref<'' | 'activas' | 'inactivas'>('')
// Vacío por defecto — un mantenedor debe mostrar todo hasta que el coach acote, nunca ocultar
// registros existentes solo porque se creó antes del 1° del mes actual.
const fechaDesde = ref('')
const fechaHasta = ref('')
const page = ref(1)

async function load() {
  // Las empresas solo alimentan el selector del alta: si fallan, la lista sigue siendo útil.
  const [u, e] = await Promise.all([listUsers(), tolerar(listEmpresas())])
  u.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
  usuarios.value = u
  empresas.value = e ?? []
}

const { loading, error, fallos, recargar, tolerar } = useCarga(load)

onMounted(recargar)

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
    if (!dentroDeRango(u.createdAt, fechaDesde.value, fechaHasta.value)) return false
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
  fechaDesde.value = ''
  fechaHasta.value = ''
  page.value = 1
}

// --- Modal de creación (cuenta Empresa) ---
const modalOpen = ref(false)
const guardando = ref(false)
const form = reactive({ email: '', empresaId: '' })
const errors = reactive<{ email?: string; empresaId?: string }>({})
const serverErrors = ref<Record<string, string>>({})

function abrirCrear() {
  form.email = ''
  form.empresaId = ''
  errors.email = undefined
  errors.empresaId = undefined
  serverErrors.value = {}
  modalOpen.value = true
}

function validar(): boolean {
  errors.email = /.+@.+\..+/.test(form.email.trim()) ? undefined : 'Ingresa un email válido.'
  errors.empresaId = form.empresaId ? undefined : 'Selecciona una empresa.'
  const valido = !errors.email && !errors.empresaId
  if (!valido) void enfocarPrimerInvalido()
  return valido
}

async function guardar() {
  if (!validar()) return
  guardando.value = true
  serverErrors.value = {}
  try {
    const resultado = await createEmpresaUser(form.email, form.empresaId)
    modalOpen.value = false
    await recargar()
    await notifySuccess('Cuenta creada', `Se envió un correo a ${resultado.email} con las instrucciones de acceso.`)
  } catch (err) {
    serverErrors.value = err instanceof ApiError ? (err.fieldErrors ?? {}) : {}
    void enfocarPrimerInvalido()
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
    await recargar()
    await notifySuccess(activar ? 'Cuenta activada' : 'Cuenta desactivada')
  } catch (err) {
    await notifyError('No se pudo cambiar el estado', err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.')
  }
}

const restableciendo = ref<string | null>(null)

// "Ver como": solo visible para el superadmin (auth.user.superadmin, decidido en el backend).
const auth = useAuthStore()
const router = useRouter()
const entrandoVerComo = ref<string | null>(null)
async function verComo(usuario: UserAccount) {
  entrandoVerComo.value = usuario.id
  try {
    await auth.iniciarVerComo(usuario.id, '/coach/usuarios')
    await router.push('/')
  } catch (err) {
    await notifyError('No se pudo entrar en modo "Ver como"', err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.')
  } finally {
    entrandoVerComo.value = null
  }
}

async function restablecer(usuario: UserAccount) {
  const confirmado = await confirmDialog({
    title: '¿Restablecer contraseña?',
    text: `Se generará una nueva contraseña temporal para ${usuario.email}.`,
    confirmText: 'Restablecer',
  })
  if (!confirmado) return
  restableciendo.value = usuario.id
  try {
    await resetPassword(usuario.id)
    await notifySuccess('Contraseña restablecida', `Se envió un correo a ${usuario.email} con la nueva contraseña.`)
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
    await recargar()
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
        <p class="text-sm text-[var(--color-muted)]">
          Gestión y administración de las cuentas del sistema.
        </p>
      </div>
      <AppButton @click="abrirCrear">
        + Nuevo Usuario
      </AppButton>
    </div>

    <SkeletonBlock
      v-if="loading"
      variant="table"
      :rows="6"
    />
    <ErrorState
      v-else-if="error"
      @retry="recargar"
    />
    <div
      v-else
      class="space-y-3"
    >
      <div
        v-if="fallos > 0"
        role="status"
        class="rounded-xl border border-[var(--color-bronze)]/40 bg-[var(--color-bronze)]/10 px-4 py-3 text-sm"
      >
        No pudimos cargar la lista de empresas: no podrás crear cuentas de empresa hasta que cargue (recarga la página).
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <select
          v-model="filtroRol"
          aria-label="Filtrar por rol"
          class="field-input w-auto"
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
          aria-label="Filtrar por estado"
          class="field-input w-auto"
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
        <label class="flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
          Desde
          <input
            v-model="fechaDesde"
            type="date"
            class="field-input w-auto"
            @change="page = 1"
          >
        </label>
        <label class="flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
          Hasta
          <input
            v-model="fechaHasta"
            type="date"
            class="field-input w-auto"
            @change="page = 1"
          >
        </label>
        <AppButton
          variant="secondary"
          size="sm"
          @click="limpiarFiltros"
        >
          × Limpiar filtros
        </AppButton>
        <span class="ml-auto text-xs text-[var(--color-muted)]">{{ filtradas.length }} registro(s)</span>
      </div>

      <input
        v-model="search"
        type="search"
        aria-label="Buscar usuarios"
        placeholder="Buscar por email…"
        class="field-input"
        @input="page = 1"
      >

      <div class="data-table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th scope="col">
                Email
              </th>
              <th scope="col">
                Rol
              </th>
              <th scope="col">
                Empresa
              </th>
              <th scope="col">
                Estado
              </th>
              <th scope="col">
                Creado
              </th>
              <th scope="col">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="paginadas.length === 0">
              <td
                colspan="6"
                class="py-6 text-center text-sm text-[var(--color-muted)]"
              >
                Sin resultados.
              </td>
            </tr>
            <tr
              v-for="u in paginadas"
              :key="u.id"
            >
              <td class="font-medium">
                {{ u.email }}
              </td>
              <td>
                <StatusBadge :tone="u.role === 'coach' ? 'sage' : u.role === 'empresa' ? 'bronze' : 'neutral'">
                  {{ rolLabels[u.role] }}
                </StatusBadge>
              </td>
              <td class="text-[var(--color-muted)]">
                {{ u.empresa?.nombre ?? '—' }}
              </td>
              <td>
                <StatusToggle
                  :active="u.isActive"
                  @toggle="toggleActivo(u)"
                />
              </td>
              <td class="text-xs text-[var(--color-muted)]">
                {{ u.createdAt ? new Date(u.createdAt).toLocaleDateString('es-CL') : '—' }}
              </td>
              <td>
                <div class="flex items-center gap-2">
                  <IconButton
                    v-if="auth.user?.superadmin && u.role !== 'coach'"
                    icon="ver"
                    title="Ver como este usuario (solo lectura)"
                    :disabled="entrandoVerComo === u.id"
                    @click="verComo(u)"
                  />
                  <!-- Mismo ancho que el botón "Ver como" en las filas de coach, para que
                       las demás acciones queden alineadas en columna. -->
                  <span
                    v-else-if="auth.user?.superadmin"
                    class="inline-block w-8"
                    aria-hidden="true"
                  />
                  <IconButton
                    icon="llave"
                    title="Restablecer contraseña"
                    :disabled="restableciendo === u.id"
                    @click="restablecer(u)"
                  />
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
        novalidate
        @submit.prevent="guardar"
      >
        <FormField
          v-slot="{ id, describedby, invalid }"
          label="Email"
          :error="errors.email || serverErrors.email"
        >
          <input
            :id="id"
            v-model="form.email"
            type="email"
            class="field-input"
            :aria-describedby="describedby"
            :aria-invalid="invalid"
          >
        </FormField>

        <FormField
          v-slot="{ id, describedby, invalid }"
          label="Empresa"
          :error="errors.empresaId || serverErrors.empresaId"
        >
          <select
            :id="id"
            v-model="form.empresaId"
            class="field-input"
            :aria-describedby="describedby"
            :aria-invalid="invalid"
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
        </FormField>

        <div class="flex justify-end gap-2 pt-2">
          <AppButton
            variant="secondary"
            @click="modalOpen = false"
          >
            Cancelar
          </AppButton>
          <AppButton
            type="submit"
            :loading="guardando"
          >
            {{ guardando ? 'Guardando…' : 'Guardar' }}
          </AppButton>
        </div>
      </form>
    </AppModal>
  </AppShell>
</template>
