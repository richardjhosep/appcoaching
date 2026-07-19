<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import * as XLSX from 'xlsx'
import AppShell from '../../components/AppShell.vue'
import { getResumenNegocio, getAlertas, getAvancePorArea, type ResumenNegocio, type Alertas, type AvancePorArea } from '../../api/negocio'
import { updateEmpresa } from '../../api/empresas'
import { ApiError } from '../../api/client'

const router = useRouter()

const loading = ref(true)
const resumen = ref<ResumenNegocio | null>(null)
const alertas = ref<Alertas | null>(null)
const avancePorArea = ref<AvancePorArea[]>([])
const error = ref<string | null>(null)

const formatoCLP = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

const maxAvance = computed(() => Math.max(100, ...avancePorArea.value.map((a) => a.avancePromedio)))

async function load() {
  loading.value = true
  const [r, a, avp] = await Promise.all([getResumenNegocio(), getAlertas(), getAvancePorArea()])
  resumen.value = r
  alertas.value = a
  avancePorArea.value = avp
  loading.value = false
}

onMounted(load)

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
  void router.push({ name: 'coach-coachee-seguimiento', params: { coacheeId } })
}

function imprimir() {
  window.print()
}

function exportarExcel() {
  if (!resumen.value) return
  const filas = resumen.value.porEmpresa.map((e) => ({
    Empresa: e.nombre,
    Pagada: e.pagada ? 'Sí' : 'No',
    'Horas contratadas': e.horasContratadas ?? '',
    'Horas consumidas': e.horasConsumidas,
    'Ingreso del período': e.ingresoDelPeriodo,
    'Ingreso proyectado': e.ingresoProyectado,
  }))
  const hoja = XLSX.utils.json_to_sheet(filas)
  const libro = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(libro, hoja, 'Cobros por empresa')
  XLSX.writeFile(libro, `reporte-negocio-${new Date().toISOString().slice(0, 10)}.xlsx`)
}
</script>

<template>
  <AppShell>
    <div class="mb-4 flex items-center justify-between print:hidden">
      <h1 class="font-[family-name:var(--font-heading)] text-xl font-semibold">
        Panel de negocio
      </h1>
      <div class="flex gap-2">
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
    </div>

    <div
      v-if="loading"
      class="text-sm text-[var(--color-ink)]/60"
    >
      Cargando…
    </div>
    <div
      v-else-if="resumen"
      class="space-y-4"
    >
      <p
        v-if="error"
        class="text-sm text-[var(--color-bronze)]"
      >
        {{ error }}
      </p>

      <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
          <p class="text-xs text-[var(--color-ink)]/60">
            Horas realizadas (mes)
          </p>
          <p class="font-[family-name:var(--font-mono)] text-2xl">
            {{ resumen.horasRealizadasTotal }}
          </p>
        </div>
        <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
          <p class="text-xs text-[var(--color-ink)]/60">
            Ingreso del período
          </p>
          <p class="font-[family-name:var(--font-mono)] text-2xl text-[var(--color-sage)]">
            {{ formatoCLP.format(resumen.ingresoDelPeriodoTotal) }}
          </p>
        </div>
        <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
          <p class="text-xs text-[var(--color-ink)]/60">
            Ingreso proyectado
          </p>
          <p class="font-[family-name:var(--font-mono)] text-2xl">
            {{ formatoCLP.format(resumen.ingresoProyectadoTotal) }}
          </p>
        </div>
        <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
          <p class="text-xs text-[var(--color-ink)]/60">
            Coachees activos
          </p>
          <p class="font-[family-name:var(--font-mono)] text-2xl">
            {{ resumen.coacheesActivos }}
          </p>
        </div>
        <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
          <p class="text-xs text-[var(--color-ink)]/60">
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
        <div class="grid gap-4 sm:grid-cols-3">
          <div>
            <p class="mb-1 text-xs font-medium text-[var(--color-bronze)]">
              Ciclos por vencer ({{ alertas.ciclosPorVencer.length }})
            </p>
            <ul class="space-y-1 text-sm">
              <li
                v-for="c in alertas.ciclosPorVencer"
                :key="c.coacheeId"
                class="cursor-pointer hover:underline"
                @click="irASeguimiento(c.coacheeId)"
              >
                {{ c.nombre }} ({{ c.sesionesRestantes }} rest.)
              </li>
            </ul>
          </div>
          <div>
            <p class="mb-1 text-xs font-medium text-[var(--color-bronze)]">
              Sin logros recientes ({{ alertas.coacheesSinLogros.length }})
            </p>
            <ul class="space-y-1 text-sm">
              <li
                v-for="c in alertas.coacheesSinLogros"
                :key="c.coacheeId"
                class="cursor-pointer hover:underline"
                @click="irASeguimiento(c.coacheeId)"
              >
                {{ c.nombre }}
              </li>
            </ul>
          </div>
          <div>
            <p class="mb-1 text-xs font-medium text-[var(--color-bronze)]">
              Sin próxima sesión ({{ alertas.coacheesSinProximaSesion.length }})
            </p>
            <ul class="space-y-1 text-sm">
              <li
                v-for="c in alertas.coacheesSinProximaSesion"
                :key="c.coacheeId"
                class="cursor-pointer hover:underline"
                @click="irASeguimiento(c.coacheeId)"
              >
                {{ c.nombre }}
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
          class="text-sm text-[var(--color-ink)]/60"
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
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead>
              <tr class="text-xs text-[var(--color-ink)]/60">
                <th class="py-1">
                  Empresa
                </th>
                <th class="py-1">
                  Pagada
                </th>
                <th class="py-1">
                  Contratadas
                </th>
                <th class="py-1">
                  Consumidas
                </th>
                <th class="py-1">
                  Ingreso período
                </th>
                <th class="py-1">
                  Proyectado
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="e in resumen.porEmpresa"
                :key="e.empresaId"
                class="border-t border-[var(--color-line)]"
              >
                <td class="py-2">
                  {{ e.nombre }}
                </td>
                <td class="py-2">
                  <input
                    type="checkbox"
                    :checked="e.pagada"
                    @change="togglePagada(e.empresaId, ($event.target as HTMLInputElement).checked)"
                  >
                </td>
                <td class="py-2">
                  <input
                    type="number"
                    min="0"
                    :value="e.horasContratadas ?? ''"
                    class="w-16 rounded border border-[var(--color-line)] px-1 py-0.5 text-xs"
                    @change="guardarHorasContratadas(e.empresaId, Number(($event.target as HTMLInputElement).value))"
                  >
                </td>
                <td class="py-2">
                  {{ e.horasConsumidas }}
                </td>
                <td class="py-2">
                  {{ formatoCLP.format(e.ingresoDelPeriodo) }}
                </td>
                <td class="py-2">
                  {{ formatoCLP.format(e.ingresoProyectado) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </AppShell>
</template>
