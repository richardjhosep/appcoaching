<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AppShell from '../../components/AppShell.vue'
import SectionCard from '../../components/SectionCard.vue'
import EmptyState from '../../components/EmptyState.vue'
import ProyeccionGastoChart from '../../components/ProyeccionGastoChart.vue'
import {
  getMiResumenFinanciero,
  getMiProyeccionFinanciera,
  type ResumenFinanzasEmpresa,
  type ProyeccionMesEmpresa,
} from '../../api/negocio'

const loading = ref(true)
const resumen = ref<ResumenFinanzasEmpresa | null>(null)
const proyeccion = ref<ProyeccionMesEmpresa[]>([])

const formatoCLP = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

onMounted(async () => {
  loading.value = true
  const [r, p] = await Promise.all([getMiResumenFinanciero(), getMiProyeccionFinanciera()])
  resumen.value = r
  proyeccion.value = p
  loading.value = false
})
</script>

<template>
  <AppShell>
    <h1 class="mb-4 font-[family-name:var(--font-heading)] text-xl font-semibold">
      Finanzas
    </h1>
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
      <SectionCard
        title="Este mes"
        icon="negocio"
      >
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <p class="text-xs text-[var(--color-ink)]/60">
              Gasto del período
            </p>
            <p class="font-[family-name:var(--font-mono)] text-2xl">
              {{ formatoCLP.format(resumen.gastoDelPeriodo) }}
            </p>
          </div>
          <div>
            <p class="text-xs text-[var(--color-ink)]/60">
              Horas consumidas / contratadas
            </p>
            <p class="font-[family-name:var(--font-mono)] text-2xl">
              {{ resumen.horasConsumidas }} / {{ resumen.horasContratadas ?? '—' }}
            </p>
          </div>
          <div>
            <p class="text-xs text-[var(--color-ink)]/60">
              Estado de pago
            </p>
            <p
              class="text-sm font-medium"
              :class="resumen.pagada ? 'text-[var(--color-sage)]' : 'text-[var(--color-bronze)]'"
            >
              {{ resumen.pagada ? 'Al día' : 'Pendiente' }}
            </p>
          </div>
          <div>
            <p class="text-xs text-[var(--color-ink)]/60">
              Monto pendiente
            </p>
            <p
              class="font-[family-name:var(--font-mono)] text-2xl"
              :class="resumen.gastoPendiente > 0 ? 'text-[var(--color-bronze)]' : 'text-[var(--color-sage)]'"
            >
              {{ formatoCLP.format(resumen.gastoPendiente) }}
            </p>
          </div>
        </div>
        <p class="mt-3 text-xs text-[var(--color-ink)]/50">
          El estado de pago refleja la conciliación de tu coach — no es un historial de
          transacciones, es el gasto real del mes actual mientras no se marque como pagado.
        </p>
      </SectionCard>

      <SectionCard
        title="Gasto por coachee"
        icon="coachees"
      >
        <EmptyState
          v-if="resumen.porCoachee.length === 0"
          icon="coachees"
          title="Sin actividad este mes"
          description="Todavía no hay sesiones registradas este período."
        />
        <div
          v-else
          class="overflow-x-auto"
        >
          <table class="w-full text-left text-sm">
            <thead>
              <tr class="text-xs text-[var(--color-ink)]/60">
                <th class="py-1">
                  Coachee
                </th>
                <th class="py-1">
                  Horas realizadas
                </th>
                <th class="py-1">
                  Gasto del período
                </th>
                <th class="py-1">
                  Proyectado
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="c in resumen.porCoachee"
                :key="c.coacheeId"
                class="border-t border-[var(--color-line)]"
              >
                <td class="py-2">
                  {{ c.nombre }}
                </td>
                <td class="py-2">
                  {{ c.horasRealizadas }}
                </td>
                <td class="py-2">
                  {{ formatoCLP.format(c.gastoBrutoDelPeriodo) }}
                </td>
                <td class="py-2">
                  {{ formatoCLP.format(c.gastoBrutoProyectado) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard
        title="Proyección de gasto — 6 meses"
        icon="progreso"
      >
        <ProyeccionGastoChart :meses="proyeccion" />
      </SectionCard>
    </div>
  </AppShell>
</template>
