<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import * as XLSX from 'xlsx'
import { getResumenNegocio, getAlertas, getAvancePorArea, type ResumenNegocio, type Alertas, type AvancePorArea } from '../../../api/negocio'
import { updateEmpresa } from '../../../api/empresas'
import { getUfHoy } from '../../../api/indicadores'
import { ApiError } from '../../../api/client'
import NavIcon from '../../../components/NavIcon.vue'
import StatusBadge from '../../../components/StatusBadge.vue'
import SkeletonBlock from '../../../components/SkeletonBlock.vue'
import MonedaToggle from '../../../components/MonedaToggle.vue'
import { formatMonto, type Moneda } from '../../../lib/moneda'

const router = useRouter()

const loading = ref(true)
const resumen = ref<ResumenNegocio | null>(null)
const alertas = ref<Alertas | null>(null)
const avancePorArea = ref<AvancePorArea[]>([])
const error = ref<string | null>(null)

// Todo lo que se muestra acá vive en CLP (el backend ya convirtió cualquier tarifa en
// UF antes de sumar nada) — este selector es puramente de visualización.
const moneda = ref<Moneda>('clp')
const valorUf = ref<number | null>(null)
const fechaUf = ref<string | null>(null)
const ufDesactualizada = ref(false)
const errorUf = ref<string | null>(null)
function monto(clp: number): string {
  return formatMonto(clp, moneda.value, valorUf.value ?? 0)
}

const maxAvance = computed(() => Math.max(100, ...avancePorArea.value.map((a) => a.avancePromedio)))

async function load() {
  loading.value = true
  const [r, a, avp] = await Promise.all([getResumenNegocio(), getAlertas(), getAvancePorArea()])
  resumen.value = r
  alertas.value = a
  avancePorArea.value = avp
  loading.value = false
}

onMounted(async () => {
  await load()
  await getUfHoy()
    .then((v) => {
      valorUf.value = v.valorUf
      fechaUf.value = v.fecha
      ufDesactualizada.value = v.desactualizado
    })
    .catch(() => {
      errorUf.value = 'No se pudo obtener el valor UF — el selector de moneda queda solo en CLP.'
    })
})

async function togglePagada(empresaId: string, pagada: boolean) {
  try {
    await updateEmpresa(empresaId, { pagada })
    resumen.value = await getResumenNegocio()
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'No se pudo actualizar la empresa.'
  }
}

async function guardarHorasContratadas(empresaId: string, horas: number) {
  try {
    await updateEmpresa(empresaId, { horasContratadas: horas })
    resumen.value = await getResumenNegocio()
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'No se pudo actualizar la empresa.'
  }
}

function irASeguimiento(coacheeId: string) {
  void router.push({ name: 'coach-coachee-detail', params: { coacheeId }, query: { tab: 'sesiones' } })
}

function verCoachee(coacheeId: string) {
  void router.push({ name: 'coach-coachee-detail', params: { coacheeId } })
}

function imprimir() {
  window.print()
}

function exportarExcel() {
  if (!resumen.value) return
  const libro = XLSX.utils.book_new()

  const filasEmpresa = resumen.value.porEmpresa.map((e) => ({
    Empresa: e.nombre,
    Pagada: e.pagada ? 'Sí' : 'No',
    'Horas contratadas': e.horasContratadas ?? '',
    'Horas consumidas': e.horasConsumidas,
    'Ingreso del período': e.ingresoDelPeriodo,
    'Ingreso proyectado': e.ingresoProyectado,
  }))
  XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(filasEmpresa), 'Cobros por empresa')

  // Una fila por coachee activo de la cartera — incluye a los de empresa y a los
  // independientes, tengan o no sesiones este mes.
  const filasCoachee = resumen.value.carteraCoachees.map((c) => ({
    Coachee: c.nombre,
    Empresa: c.empresaNombre ?? 'Independiente',
    'Pago empresa': c.empresaPagada === null ? '—' : c.empresaPagada ? 'Confirmado' : 'Pendiente',
    'Sesiones del proceso': c.totalSesiones ?? '',
    'Sesiones realizadas': c.sesionesRealizadas,
    'Horas del período': c.horasDelPeriodo,
    'Agendado del período': c.montoAgendadoDelPeriodo,
    'Ingreso confirmado': c.ingresoConfirmadoDelPeriodo,
  }))
  XLSX.utils.book_append_sheet(libro, XLSX.utils.json_to_sheet(filasCoachee), 'Cartera de coachees')

  XLSX.writeFile(libro, `reporte-negocio-${new Date().toISOString().slice(0, 10)}.xlsx`)
}
</script>

<template>
  <div class="mb-4 flex items-center justify-end gap-2 print:hidden">
    <button
      class="rounded-lg border border-[var(--color-line)] px-3 py-2 text-xs hover:bg-[var(--color-parchment)]/50"
      @click="exportarExcel"
    >
      Exportar Excel
    </button>
    <button
      class="rounded-lg bg-[var(--color-ink)] px-3 py-2 text-xs text-[var(--color-parchment)]"
      @click="imprimir"
    >
      Imprimir / PDF
    </button>
  </div>

  <MonedaToggle
    v-if="!errorUf"
    v-model="moneda"
    :valor-uf="valorUf"
    :fecha="fechaUf"
    :desactualizado="ufDesactualizada"
    class="mb-4 print:hidden"
  />

  <SkeletonBlock v-if="loading" />
  <div
    v-else-if="resumen"
    class="space-y-4"
  >
    <p
      v-if="error"
      class="text-sm text-[var(--color-danger)]"
    >
      {{ error }}
    </p>

    <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
        <p class="text-xs text-[var(--color-muted)]">
          Horas realizadas (mes)
        </p>
        <p class="font-[family-name:var(--font-mono)] text-2xl">
          {{ resumen.horasRealizadasTotal }}
        </p>
      </div>
      <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
        <p class="text-xs text-[var(--color-muted)]">
          Ingreso del período
        </p>
        <p class="font-[family-name:var(--font-mono)] text-2xl text-[var(--color-sage)]">
          {{ monto(resumen.ingresoDelPeriodoTotal) }}
        </p>
      </div>
      <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
        <p class="text-xs text-[var(--color-muted)]">
          Ingreso proyectado
        </p>
        <p class="font-[family-name:var(--font-mono)] text-2xl">
          {{ monto(resumen.ingresoProyectadoTotal) }}
        </p>
      </div>
      <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
        <p class="text-xs text-[var(--color-muted)]">
          Coachees activos
        </p>
        <p class="font-[family-name:var(--font-mono)] text-2xl">
          {{ resumen.coacheesActivos }}
        </p>
      </div>
      <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
        <p class="text-xs text-[var(--color-muted)]">
          Satisfacción promedio
        </p>
        <p class="font-[family-name:var(--font-mono)] text-2xl">
          {{ resumen.satisfaccionPromedio !== null ? `${resumen.satisfaccionPromedio} ★` : '—' }}
        </p>
      </div>
    </div>

    <div
      v-if="alertas"
      class="rounded-2xl border border-[var(--color-line)] bg-white p-4"
    >
      <h2 class="mb-3 text-sm font-medium">
        Alertas de seguimiento
      </h2>
      <div class="grid gap-3 sm:grid-cols-3">
        <div class="rounded-xl border border-[var(--color-line)] p-3">
          <div class="mb-2 flex items-center gap-1.5 text-xs font-medium text-[var(--color-bronze)]">
            <NavIcon
              name="auditoria"
              :size="14"
            />
            Ciclos por vencer ({{ alertas.ciclosPorVencer.length }})
          </div>
          <p
            v-if="alertas.ciclosPorVencer.length === 0"
            class="text-xs italic text-[var(--color-muted)]"
          >
            Sin pendientes.
          </p>
          <ul
            v-else
            class="space-y-0.5"
          >
            <li
              v-for="c in alertas.ciclosPorVencer"
              :key="c.coacheeId"
            >
              <button
                type="button"
                class="w-full rounded-lg px-2 py-1 text-left text-sm hover:bg-[var(--color-parchment)]/60"
                @click="irASeguimiento(c.coacheeId)"
              >
                {{ c.nombre }} <span class="text-xs text-[var(--color-muted)]">({{ c.sesionesRestantes }} rest.)</span>
              </button>
            </li>
          </ul>
        </div>
        <div class="rounded-xl border border-[var(--color-line)] p-3">
          <div class="mb-2 flex items-center gap-1.5 text-xs font-medium text-[var(--color-danger)]">
            <NavIcon
              name="progreso"
              :size="14"
            />
            Sin logros recientes ({{ alertas.coacheesSinLogros.length }})
          </div>
          <p
            v-if="alertas.coacheesSinLogros.length === 0"
            class="text-xs italic text-[var(--color-muted)]"
          >
            Sin pendientes.
          </p>
          <ul
            v-else
            class="space-y-0.5"
          >
            <li
              v-for="c in alertas.coacheesSinLogros"
              :key="c.coacheeId"
            >
              <button
                type="button"
                class="w-full rounded-lg px-2 py-1 text-left text-sm hover:bg-[var(--color-parchment)]/60"
                @click="irASeguimiento(c.coacheeId)"
              >
                {{ c.nombre }}
              </button>
            </li>
          </ul>
        </div>
        <div class="rounded-xl border border-[var(--color-line)] p-3">
          <div class="mb-2 flex items-center gap-1.5 text-xs font-medium text-[var(--color-danger)]">
            <NavIcon
              name="sesiones"
              :size="14"
            />
            Sin próxima sesión ({{ alertas.coacheesSinProximaSesion.length }})
          </div>
          <p
            v-if="alertas.coacheesSinProximaSesion.length === 0"
            class="text-xs italic text-[var(--color-muted)]"
          >
            Sin pendientes.
          </p>
          <ul
            v-else
            class="space-y-0.5"
          >
            <li
              v-for="c in alertas.coacheesSinProximaSesion"
              :key="c.coacheeId"
            >
              <button
                type="button"
                class="w-full rounded-lg px-2 py-1 text-left text-sm hover:bg-[var(--color-parchment)]/60"
                @click="irASeguimiento(c.coacheeId)"
              >
                {{ c.nombre }}
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
      <h2 class="mb-3 text-sm font-medium">
        Avance promedio por área/gerencia
      </h2>
      <p
        v-if="avancePorArea.length === 0"
        class="text-sm text-[var(--color-muted)]"
      >
        Todavía no hay autoevaluaciones registradas.
      </p>
      <div
        v-else
        class="space-y-2"
      >
        <div
          v-for="a in avancePorArea"
          :key="a.area"
          class="flex items-center gap-3"
        >
          <span class="w-32 shrink-0 text-xs">{{ a.area }}</span>
          <div class="h-4 flex-1 rounded-full bg-[var(--color-parchment)]">
            <div
              class="h-4 rounded-full bg-[var(--color-sage)]"
              :style="{ width: `${(a.avancePromedio / maxAvance) * 100}%` }"
            />
          </div>
          <span class="w-12 shrink-0 text-right font-[family-name:var(--font-mono)] text-xs">{{ a.avancePromedio }}%</span>
        </div>
      </div>
    </div>

    <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
      <h2 class="mb-3 text-sm font-medium">
        Horas contratadas vs. consumidas por empresa
      </h2>
      <div class="data-table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th scope="col">
                Empresa
              </th>
              <th scope="col">
                Pagada
              </th>
              <th scope="col">
                Contratadas
              </th>
              <th scope="col">
                Consumidas
              </th>
              <th scope="col">
                Ingreso período
              </th>
              <th scope="col">
                Proyectado
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="e in resumen.porEmpresa"
              :key="e.empresaId"
            >
              <td class="py-2">
                {{ e.nombre }}
              </td>
              <td class="py-2">
                <input
                  type="checkbox"
                  class="print:hidden"
                  :checked="e.pagada"
                  @change="togglePagada(e.empresaId, ($event.target as HTMLInputElement).checked)"
                >
                <span class="hidden print:inline">{{ e.pagada ? 'Sí' : 'No' }}</span>
              </td>
              <td class="py-2">
                <!-- Editable aquí solo si la empresa tiene horas fijas; si no, se calculan solas
                     desde las sesiones de sus coachees (se cambia en Empresas). -->
                <input
                  v-if="e.horasFijas"
                  type="number"
                  min="0"
                  :value="e.horasContratadas ?? ''"
                  class="w-16 rounded border border-[var(--color-line)] px-1 py-0.5 text-xs print:hidden"
                  @change="guardarHorasContratadas(e.empresaId, Number(($event.target as HTMLInputElement).value))"
                >
                <span :class="e.horasFijas ? 'hidden print:inline' : ''">{{ e.horasContratadas ?? '—' }}</span>
                <span
                  v-if="!e.horasFijas"
                  class="block text-xs text-[var(--color-muted)] print:hidden"
                >según sesiones</span>
              </td>
              <td class="py-2">
                {{ e.horasConsumidas }}
              </td>
              <td class="py-2">
                {{ monto(e.ingresoDelPeriodo) }}
              </td>
              <td class="py-2">
                {{ monto(e.ingresoProyectado) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="mt-3 text-xs text-[var(--color-muted)]">
        "Proyectado" solo cuenta empresas marcadas como "Pagada" — es el ingreso que puedes dar
        por confirmado, no todo lo que hay agendado. La empresa ve, en su propia Finanzas, el
        gasto agendado sin ese filtro, así que ese número puede ser mayor al tuyo.
      </p>
    </div>

    <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
      <h2 class="mb-3 text-sm font-medium">
        Cartera de coachees
      </h2>
      <p class="mb-3 text-xs text-[var(--color-muted)]">
        Todos tus coachees activos, tengan o no sesiones este mes. "Agendado" es el valor de lo
        agendado en el período; "Confirmado" solo cuenta a los independientes y a las empresas
        marcadas como "Pagada".
      </p>
      <p
        v-if="resumen.carteraCoachees.length === 0"
        class="text-sm text-[var(--color-muted)]"
      >
        No tienes coachees activos.
      </p>
      <div
        v-else
        class="data-table-wrap"
      >
        <table class="data-table">
          <thead>
            <tr>
              <th scope="col">
                Coachee
              </th>
              <th scope="col">
                Empresa
              </th>
              <th scope="col">
                Sesiones
              </th>
              <th scope="col">
                Horas mes
              </th>
              <th scope="col">
                Agendado
              </th>
              <th scope="col">
                Confirmado
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="c in resumen.carteraCoachees"
              :key="c.coacheeId"
            >
              <td class="py-2">
                <button
                  type="button"
                  class="transition-colors hover:text-[var(--color-sage)] hover:underline print:pointer-events-none"
                  @click="verCoachee(c.coacheeId)"
                >
                  {{ c.nombre }}
                </button>
              </td>
              <td class="py-2 text-[var(--color-ink)]/70">
                {{ c.empresaNombre ?? 'Independiente' }}
                <StatusBadge
                  v-if="c.empresaPagada === false"
                  tone="bronze"
                  class="ml-1"
                  title="Marca la empresa como pagada en la tabla de arriba para contarlo como ingreso confirmado"
                >
                  Pago pendiente
                </StatusBadge>
              </td>
              <td class="py-2 font-[family-name:var(--font-mono)] text-xs">
                <span v-if="c.totalSesiones !== null">{{ c.sesionesRealizadas }}/{{ c.totalSesiones }}</span>
                <span
                  v-else
                  class="font-[family-name:var(--font-body)] text-[var(--color-bronze)]"
                >Sin ciclo</span>
              </td>
              <td class="py-2">
                {{ c.horasDelPeriodo }}
              </td>
              <td class="py-2">
                {{ monto(c.montoAgendadoDelPeriodo) }}
              </td>
              <td class="py-2">
                {{ monto(c.ingresoConfirmadoDelPeriodo) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
