<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppShell from '../../components/AppShell.vue'
import AppModal from '../../components/AppModal.vue'
import Pagination from '../../components/Pagination.vue'
import StatusToggle from '../../components/StatusToggle.vue'
import IconButton from '../../components/IconButton.vue'
import SkeletonBlock from '../../components/SkeletonBlock.vue'
import ErrorState from '../../components/ErrorState.vue'
import EmptyState from '../../components/EmptyState.vue'
import AppButton from '../../components/AppButton.vue'
import FormField from '../../components/FormField.vue'
import SortableTh from '../../components/SortableTh.vue'
import { createCoachee, deleteCoachee, listCoachees, setCoacheeActivo, updateCoachee, type CoacheeListItem } from '../../api/coachees'
import { listEmpresas, type Empresa } from '../../api/empresas'
import { abrirCiclo, actualizarTotalSesiones, getCicloActualDeCoachee, type Ciclo } from '../../api/ciclos'
import { ApiError } from '../../api/client'
import { notifyError, notifySuccess, confirmDialog } from '../../lib/notify'
import { dentroDeRango } from '../../lib/dateRange'
import { formatCLP, formatUF, type Moneda } from '../../lib/moneda'
import TarifaInput from '../../components/TarifaInput.vue'
import { useCarga } from '../../lib/useCarga'
import { ordenarPor, useOrden } from '../../lib/ordenar'
import { armarQuery, leerEntero, leerTexto } from '../../lib/queryParams'
import { enfocarPrimerInvalido } from '../../lib/enfocarInvalido'

const PAGE_SIZE = 12

const route = useRoute()
const router = useRouter()

const coachees = ref<CoacheeListItem[]>([])
const empresas = ref<Empresa[]>([])
// Filtros, búsqueda, página y orden viven en la URL (?q=&empresa=&estado=&desde=&hasta=&page=
// &orden=&dir=): al volver desde la ficha de un coachee se restauran tal cual los dejó el coach.
const search = ref(leerTexto(route.query, 'q'))
const filtroEmpresa = ref(leerTexto(route.query, 'empresa'))
const filtroEstado = ref<'' | 'activos' | 'inactivos'>(
  (['activos', 'inactivos'] as const).find((v) => v === leerTexto(route.query, 'estado')) ?? '',
)
// Vacío por defecto — un mantenedor debe mostrar todo hasta que el coach acote, nunca ocultar
// registros existentes solo porque se creó antes del 1° del mes actual.
const fechaDesde = ref(leerTexto(route.query, 'desde'))
const fechaHasta = ref(leerTexto(route.query, 'hasta'))
const page = ref(leerEntero(route.query, 'page'))
const orden = useOrden(leerTexto(route.query, 'orden') || 'creado', leerTexto(route.query, 'dir') === 'asc' ? 'asc' : 'desc')

watch([search, filtroEmpresa, filtroEstado, fechaDesde, fechaHasta, page, orden.clave, orden.dir], () => {
  void router.replace({
    query: armarQuery(
      route.query,
      {
        q: search.value,
        empresa: filtroEmpresa.value,
        estado: filtroEstado.value,
        desde: fechaDesde.value,
        hasta: fechaHasta.value,
        page: page.value,
        orden: orden.clave.value,
        dir: orden.dir.value,
      },
      { page: 1, orden: 'creado', dir: 'desc' },
    ),
  })
})

async function load() {
  const [c, e] = await Promise.all([listCoachees(), listEmpresas()])
  coachees.value = c
  empresas.value = e
}

const { loading, error, recargar } = useCarga(load)

// Enlace desde "Crear coachee de esta empresa" (EmpresasView): /coach/coachees?crear=1&empresaId=…
// abre el formulario de alta con la empresa ya elegida.
function abrirCrearDesdeQuery() {
  if (leerTexto(route.query, 'crear') !== '1' || error.value) return
  const empresaId = leerTexto(route.query, 'empresaId')
  abrirCrear()
  if (empresas.value.some((e) => e.id === empresaId)) form.empresaId = empresaId
  void router.replace({ query: { ...route.query, crear: undefined, empresaId: undefined } })
}

onMounted(async () => {
  await recargar()
  abrirCrearDesdeQuery()
})

function estaActivo(c: CoacheeListItem): boolean {
  return c.activo !== false
}

function formatoTarifaPropia(c: CoacheeListItem): string {
  if (!c.tarifaPropia) return '—'
  return c.tarifaPropiaMoneda === 'uf' ? formatUF(c.tarifaPropia) : formatCLP(c.tarifaPropia)
}

const filtradas = computed(() => {
  const q = search.value.trim().toLowerCase()
  return coachees.value.filter((c) => {
    if (q && !c.nombre.toLowerCase().includes(q) && !(c.user?.email.toLowerCase().includes(q))) return false
    if (filtroEmpresa.value && c.empresaId !== filtroEmpresa.value) return false
    if (filtroEstado.value === 'activos' && !estaActivo(c)) return false
    if (filtroEstado.value === 'inactivos' && estaActivo(c)) return false
    if (!dentroDeRango(c.createdAt, fechaDesde.value, fechaHasta.value)) return false
    return true
  })
})

const VALOR_ORDEN: Record<string, (c: CoacheeListItem) => string | number | boolean | null | undefined> = {
  nombre: (c) => c.nombre,
  email: (c) => c.user?.email,
  empresa: (c) => c.empresa?.nombre ?? 'Independiente',
  area: (c) => c.areaGerencia,
  tarifa: (c) => c.tarifaPropia,
  estado: (c) => estaActivo(c),
  creado: (c) => c.createdAt,
}

const ordenadas = computed(() =>
  ordenarPor(filtradas.value, VALOR_ORDEN[orden.clave.value] ?? VALOR_ORDEN.creado, orden.dir.value),
)

const paginadas = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE
  return ordenadas.value.slice(start, start + PAGE_SIZE)
})

// Si la URL trae una página que ya no existe (o los filtros la dejan fuera de rango), se corrige.
watch(filtradas, (lista) => {
  const ultima = Math.max(1, Math.ceil(lista.length / PAGE_SIZE))
  if (!loading.value && page.value > ultima) page.value = ultima
})

function ordenarPorColumna(clave: string) {
  orden.alternar(clave)
  page.value = 1
}

function limpiarFiltros() {
  search.value = ''
  filtroEmpresa.value = ''
  filtroEstado.value = ''
  fechaDesde.value = ''
  fechaHasta.value = ''
  page.value = 1
}

// --- Modal de creación/edición ---
const modalOpen = ref(false)
const editando = ref<CoacheeListItem | null>(null)
const guardando = ref(false)
const form = reactive({
  nombre: '',
  email: '',
  empresaId: '',
  jefeDirecto: '',
  objetivoProceso: '',
  tarifaPropia: null as number | null,
  tarifaPropiaMoneda: 'clp' as Moneda,
  areaGerencia: '',
  cargo: '',
  // Sesiones del proceso: al crear (o si el coachee todavía no tiene ciclo) abre su ciclo; si ya
  // tiene uno abierto, edita su total. Antes solo se podía desde la pestaña Ciclo de la ficha y
  // el coach no lo encontraba.
  totalSesiones: null as number | null,
})
const cicloAbierto = ref<Ciclo | null>(null)
const errors = reactive<{ nombre?: string; email?: string; tarifaPropia?: string; totalSesiones?: string }>({})
const serverErrors = ref<Record<string, string>>({})

function abrirCrear() {
  editando.value = null
  form.nombre = ''
  form.email = ''
  form.empresaId = ''
  form.jefeDirecto = ''
  form.objetivoProceso = ''
  form.tarifaPropia = null
  form.tarifaPropiaMoneda = 'clp'
  form.areaGerencia = ''
  form.cargo = ''
  form.totalSesiones = null
  cicloAbierto.value = null
  errors.nombre = undefined
  errors.email = undefined
  errors.tarifaPropia = undefined
  serverErrors.value = {}
  modalOpen.value = true
}

async function abrirEditar(coachee: CoacheeListItem) {
  editando.value = coachee
  form.nombre = coachee.nombre
  form.email = coachee.user?.email ?? ''
  form.empresaId = coachee.empresaId ?? ''
  form.jefeDirecto = coachee.jefeDirecto ?? ''
  form.objetivoProceso = coachee.objetivoProceso ?? ''
  form.tarifaPropia = coachee.tarifaPropia ?? null
  form.tarifaPropiaMoneda = coachee.tarifaPropiaMoneda ?? 'clp'
  form.areaGerencia = coachee.areaGerencia ?? ''
  form.cargo = coachee.cargo ?? ''
  form.totalSesiones = null
  cicloAbierto.value = null
  errors.nombre = undefined
  errors.email = undefined
  errors.tarifaPropia = undefined
  errors.totalSesiones = undefined
  serverErrors.value = {}
  modalOpen.value = true
  cicloAbierto.value = await getCicloActualDeCoachee(coachee.id).catch(() => null)
  form.totalSesiones = cicloAbierto.value?.totalSesiones ?? null
}

// Segundo paso del guardado, aparte del coachee: si falla (p.ej. bajar el total por debajo
// de las sesiones ya realizadas), el coachee ya quedó guardado y se avisa solo de esto.
async function guardarSesionesDelProceso(coacheeId: string) {
  const total = form.totalSesiones
  if (!total || total < 1) return
  try {
    if (!cicloAbierto.value) await abrirCiclo(coacheeId, total)
    else if (cicloAbierto.value.totalSesiones !== total) await actualizarTotalSesiones(cicloAbierto.value.id, total)
  } catch (err) {
    await notifyError('No se pudo guardar el número de sesiones', err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.')
  }
}

function validar(): boolean {
  errors.nombre = form.nombre.trim().length < 2 ? 'El nombre debe tener al menos 2 caracteres.' : undefined
  errors.email = !editando.value && !/.+@.+\..+/.test(form.email.trim()) ? 'Ingresa un email válido.' : undefined
  // En UF el monto es fraccionario (ej. 3.5) — el entero solo se exige en CLP.
  // v-model.number deja '' (no null) cuando el campo se vacía — vacío = "no tocar el ciclo".
  errors.totalSesiones = typeof form.totalSesiones === 'number' && (form.totalSesiones < 1 || !Number.isInteger(form.totalSesiones))
    ? 'Debe ser un número entero mayor a 0.'
    : undefined
  errors.tarifaPropia = form.tarifaPropia !== null
    && (form.tarifaPropia <= 0 || (form.tarifaPropiaMoneda === 'clp' && !Number.isInteger(form.tarifaPropia)))
    ? 'La tarifa propia debe ser mayor a 0.'
    : undefined
  const valido = !errors.nombre && !errors.email && !errors.tarifaPropia && !errors.totalSesiones
  if (!valido) void enfocarPrimerInvalido()
  return valido
}

async function guardar() {
  if (!validar()) return
  guardando.value = true
  serverErrors.value = {}
  try {
    if (editando.value) {
      await updateCoachee(editando.value.id, {
        nombre: form.nombre,
        empresaId: form.empresaId || null,
        jefeDirecto: form.jefeDirecto || undefined,
        objetivoProceso: form.objetivoProceso || undefined,
        tarifaPropia: form.tarifaPropia ?? undefined,
        tarifaPropiaMoneda: form.tarifaPropiaMoneda,
        areaGerencia: form.areaGerencia || undefined,
        cargo: form.cargo || undefined,
      })
      await guardarSesionesDelProceso(editando.value.id)
      modalOpen.value = false
      await recargar()
      await notifySuccess('Coachee actualizado', `Los datos de ${form.nombre} se guardaron correctamente.`)
    } else {
      const resultado = await createCoachee({
        nombre: form.nombre,
        email: form.email,
        empresaId: form.empresaId || undefined,
        jefeDirecto: form.jefeDirecto || undefined,
        objetivoProceso: form.objetivoProceso || undefined,
        tarifaPropia: form.tarifaPropia ?? undefined,
        tarifaPropiaMoneda: form.tarifaPropiaMoneda,
        areaGerencia: form.areaGerencia || undefined,
        cargo: form.cargo || undefined,
      })
      await guardarSesionesDelProceso(resultado.coachee.id)
      modalOpen.value = false
      await recargar()
      if (resultado.temporaryPassword) {
        await notifySuccess('Coachee creado', `Se envió un correo a ${form.email} con las instrucciones de acceso.`)
      } else {
        await notifySuccess('Coachee creado', `${form.nombre} ya está disponible en el sistema.`)
      }
    }
  } catch (err) {
    serverErrors.value = err instanceof ApiError ? (err.fieldErrors ?? {}) : {}
    void enfocarPrimerInvalido()
    await notifyError('No se pudo guardar', err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.')
  } finally {
    guardando.value = false
  }
}

async function toggleActivo(coachee: CoacheeListItem) {
  const activar = !estaActivo(coachee)
  const confirmado = await confirmDialog({
    title: activar ? '¿Activar este coachee?' : '¿Desactivar este coachee?',
    text: activar
      ? `${coachee.nombre} volverá a estar disponible y podrá iniciar sesión.`
      : `${coachee.nombre} quedará marcado como inactivo y no podrá iniciar sesión. No se elimina ningún dato.`,
    confirmText: activar ? 'Activar' : 'Desactivar',
    danger: !activar,
  })
  if (!confirmado) return
  try {
    await setCoacheeActivo(coachee.id, activar)
    await recargar()
    await notifySuccess(activar ? 'Coachee activado' : 'Coachee desactivado')
  } catch (err) {
    await notifyError('No se pudo cambiar el estado', err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.')
  }
}

async function eliminar(coachee: CoacheeListItem) {
  const confirmado = await confirmDialog({
    title: '¿Eliminar este coachee?',
    text: `Esta acción no se puede deshacer. Se eliminará ${coachee.nombre} de forma definitiva.`,
    confirmText: 'Eliminar',
    danger: true,
  })
  if (!confirmado) return
  try {
    await deleteCoachee(coachee.id)
    await recargar()
    await notifySuccess('Coachee eliminado')
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
          Mantenedor de Coachees
        </h1>
        <p class="text-sm text-[var(--color-muted)]">
          Gestión y administración de los coachees del sistema.
        </p>
      </div>
      <AppButton @click="abrirCrear">
        + Nuevo Coachee
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
    <EmptyState
      v-else-if="coachees.length === 0"
      icon="coachees"
      title="Todavía no tienes coachees"
      description="Crea tu primer coachee para agendar sesiones y armar su plan de desarrollo. Si trabajas con una empresa, créala antes para poder asociarlo."
    >
      <div class="flex flex-wrap justify-center gap-2">
        <AppButton @click="abrirCrear">
          Crear primer coachee
        </AppButton>
        <RouterLink
          v-if="empresas.length === 0"
          to="/coach/empresas"
          class="inline-flex min-h-11 items-center rounded-lg border border-[var(--color-line)] bg-white px-4 text-sm font-medium hover:bg-[var(--color-parchment)]/60 sm:min-h-10"
        >
          Crear una empresa primero
        </RouterLink>
      </div>
    </EmptyState>
    <div
      v-else
      class="space-y-3"
    >
      <div class="flex flex-wrap items-center gap-2">
        <select
          v-model="filtroEmpresa"
          aria-label="Filtrar por empresa"
          class="field-input w-auto"
          @change="page = 1"
        >
          <option value="">
            Empresa: Todas
          </option>
          <option
            v-for="e in empresas"
            :key="e.id"
            :value="e.id"
          >
            {{ e.nombre }}
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
          <option value="activos">
            Activos
          </option>
          <option value="inactivos">
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
        aria-label="Buscar coachees"
        placeholder="Buscar por nombre o email…"
        class="field-input"
        @input="page = 1"
      >

      <div class="data-table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <SortableTh
                label="Nombre"
                :activo="orden.clave.value === 'nombre'"
                :dir="orden.dir.value"
                @ordenar="ordenarPorColumna('nombre')"
              />
              <SortableTh
                label="Email"
                :activo="orden.clave.value === 'email'"
                :dir="orden.dir.value"
                @ordenar="ordenarPorColumna('email')"
              />
              <SortableTh
                label="Empresa"
                :activo="orden.clave.value === 'empresa'"
                :dir="orden.dir.value"
                @ordenar="ordenarPorColumna('empresa')"
              />
              <SortableTh
                label="Área/Gerencia"
                :activo="orden.clave.value === 'area'"
                :dir="orden.dir.value"
                @ordenar="ordenarPorColumna('area')"
              />
              <SortableTh
                label="Tarifa"
                :activo="orden.clave.value === 'tarifa'"
                :dir="orden.dir.value"
                @ordenar="ordenarPorColumna('tarifa')"
              />
              <SortableTh
                label="Estado"
                :activo="orden.clave.value === 'estado'"
                :dir="orden.dir.value"
                @ordenar="ordenarPorColumna('estado')"
              />
              <SortableTh
                label="Creado"
                :activo="orden.clave.value === 'creado'"
                :dir="orden.dir.value"
                @ordenar="ordenarPorColumna('creado')"
              />
              <th scope="col">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="paginadas.length === 0">
              <td
                colspan="8"
                class="py-6 text-center text-sm text-[var(--color-muted)]"
              >
                Sin resultados.
              </td>
            </tr>
            <tr
              v-for="c in paginadas"
              :key="c.id"
            >
              <td class="font-medium">
                {{ c.nombre }}
                <span
                  v-if="c.cargo"
                  class="block text-xs font-normal text-[var(--color-muted)]"
                >{{ c.cargo }}</span>
              </td>
              <td class="text-[var(--color-muted)]">
                {{ c.user?.email ?? '—' }}
              </td>
              <td class="text-[var(--color-muted)]">
                {{ c.empresa?.nombre ?? 'Independiente' }}
              </td>
              <td class="text-[var(--color-muted)]">
                {{ c.areaGerencia ?? '—' }}
              </td>
              <td class="font-[family-name:var(--font-mono)] text-xs">
                {{ formatoTarifaPropia(c) }}
              </td>
              <td>
                <StatusToggle
                  :active="estaActivo(c)"
                  @toggle="toggleActivo(c)"
                />
              </td>
              <td class="text-xs text-[var(--color-muted)]">
                {{ c.createdAt ? new Date(c.createdAt).toLocaleDateString('es-CL') : '—' }}
              </td>
              <td>
                <div class="flex gap-2">
                  <IconButton
                    icon="ver"
                    title="Ver coachee"
                    :to="`/coach/coachees/${c.id}`"
                  />
                  <IconButton
                    icon="editar"
                    title="Editar"
                    @click="abrirEditar(c)"
                  />
                  <IconButton
                    icon="eliminar"
                    title="Eliminar"
                    @click="eliminar(c)"
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
      :title="editando ? 'Editar Coachee' : 'Nuevo Coachee'"
      @close="modalOpen = false"
    >
      <form
        class="space-y-4"
        novalidate
        @submit.prevent="guardar"
      >
        <FormField
          v-slot="{ id, describedby, invalid }"
          label="Nombre"
          :error="errors.nombre || serverErrors.nombre"
        >
          <input
            :id="id"
            v-model="form.nombre"
            type="text"
            class="field-input"
            :aria-describedby="describedby"
            :aria-invalid="invalid"
          >
        </FormField>

        <FormField
          v-if="!editando"
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
          v-slot="{ id }"
          label="Empresa (opcional, independiente si se deja vacío)"
        >
          <select
            :id="id"
            v-model="form.empresaId"
            class="field-input"
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
        </FormField>

        <FormField
          v-slot="{ id }"
          label="Cargo / posición (opcional)"
        >
          <input
            :id="id"
            v-model="form.cargo"
            type="text"
            placeholder="Ej. Jefe de Mantención"
            class="field-input"
          >
        </FormField>

        <FormField
          v-slot="{ id }"
          label="Área/gerencia (opcional)"
        >
          <input
            :id="id"
            v-model="form.areaGerencia"
            type="text"
            class="field-input"
          >
        </FormField>

        <FormField
          v-slot="{ id }"
          label="Jefe directo (opcional)"
        >
          <input
            :id="id"
            v-model="form.jefeDirecto"
            type="text"
            class="field-input"
          >
        </FormField>

        <TarifaInput
          v-model="form.tarifaPropia"
          v-model:moneda="form.tarifaPropiaMoneda"
          label="Tarifa propia por hora (opcional)"
          :error="errors.tarifaPropia || serverErrors.tarifaPropia"
        />

        <FormField
          v-slot="{ id, describedby, invalid }"
          label="Número de sesiones del proceso"
          :error="errors.totalSesiones"
          :hint="cicloAbierto ? 'Edita el total del ciclo abierto (también desde la pestaña Ciclo de su ficha).' : 'Abre el ciclo de coaching con este total de sesiones. Si lo dejas vacío, puedes abrirlo después desde la pestaña Ciclo.'"
        >
          <input
            :id="id"
            v-model.number="form.totalSesiones"
            type="number"
            min="1"
            step="1"
            placeholder="Ej. 8"
            class="field-input"
            :aria-describedby="describedby"
            :aria-invalid="invalid"
          >
        </FormField>

        <FormField
          v-slot="{ id }"
          label="Objetivo del proceso (opcional)"
        >
          <textarea
            :id="id"
            v-model="form.objetivoProceso"
            rows="2"
            class="field-input"
          />
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
