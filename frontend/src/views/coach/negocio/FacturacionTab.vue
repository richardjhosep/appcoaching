<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { getFacturacionMensual, type FacturacionMensual } from '../../../api/negocio'
import { useCarga } from '../../../lib/useCarga'
import AppButton from '../../../components/AppButton.vue'
import EmptyState from '../../../components/EmptyState.vue'
import ErrorState from '../../../components/ErrorState.vue'
import SkeletonBlock from '../../../components/SkeletonBlock.vue'

const formatoCLP = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
})

const hoy = new Date()
const primerDia = ref(new Date(hoy.getFullYear(), hoy.getMonth(), 1))
const mes = computed(
  () => `${primerDia.value.getFullYear()}-${String(primerDia.value.getMonth() + 1).padStart(2, '0')}`,
)
const mesLabel = computed(() => primerDia.value.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' }))

const facturacion = ref<FacturacionMensual | null>(null)
const { loading, error, recargar } = useCarga(async () => {
  const pedido = mes.value
  const datos = await getFacturacionMensual(pedido)
  // Si se cambió de mes mientras cargaba, esta respuesta ya no corresponde.
  if (pedido === mes.value) facturacion.value = datos
})
onMounted(recargar)

function cambiarMes(delta: number) {
  primerDia.value = new Date(primerDia.value.getFullYear(), primerDia.value.getMonth() + delta, 1)
  void recargar()
}

// Por empresa (a quien se le cobra); los independientes pagan directo y van al final.
const grupos = computed(() => {
  const porNombre = new Map<string, FacturacionMensual['coachees']>()
  for (const c of facturacion.value?.coachees ?? []) {
    const clave = c.empresaNombre ?? ''
    porNombre.set(clave, [...(porNombre.get(clave) ?? []), c])
  }
  return [...porNombre.entries()]
    .sort(([a], [b]) => (a === '' ? 1 : b === '' ? -1 : a.localeCompare(b, 'es')))
    .map(([nombre, coachees]) => ({ nombre: nombre || 'Independientes', coachees, total: sumar(coachees) }))
})

function sumar(coachees: FacturacionMensual['coachees']) {
  return coachees.reduce(
    (t, c) => ({
      agendadas: t.agendadas + c.sesionesAgendadas,
      realizadas: t.realizadas + c.sesionesRealizadas,
      montoRealizado: t.montoRealizado + c.montoRealizado,
      montoPorRealizar: t.montoPorRealizar + c.montoPorRealizar,
    }),
    { agendadas: 0, realizadas: 0, montoRealizado: 0, montoPorRealizar: 0 },
  )
}
const total = computed(() => sumar(facturacion.value?.coachees ?? []))
</script>

<template>
  <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
    <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
      <h2 class="text-sm font-medium">
        Facturación de {{ mesLabel }}
      </h2>
      <div class="flex gap-2">
        <AppButton
          variant="secondary"
          size="sm"
          aria-label="Mes anterior"
          @click="cambiarMes(-1)"
        >
          ←
        </AppButton>
        <AppButton
          variant="secondary"
          size="sm"
          aria-label="Mes siguiente"
          @click="cambiarMes(1)"
        >
          →
        </AppButton>
      </div>
    </div>

    <SkeletonBlock v-if="loading" />
    <ErrorState
      v-else-if="error"
      :description="error"
      @retry="recargar"
    />
    <EmptyState
      v-else-if="grupos.length === 0"
      icon="negocio"
      title="Sin sesiones este mes"
      description="Cuando haya sesiones agendadas o realizadas en el mes, aparecen acá con sus montos."
    />
    <template v-else>
      <div class="data-table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th scope="col">
                Coachee
              </th>
              <th scope="col">
                Agendadas
              </th>
              <th scope="col">
                Realizadas
              </th>
              <th scope="col">
                Monto realizado
              </th>
              <th scope="col">
                Por realizar
              </th>
              <th scope="col">
                Total del mes
              </th>
            </tr>
          </thead>
          <tbody
            v-for="g in grupos"
            :key="g.nombre"
          >
            <tr
              v-for="c in g.coachees"
              :key="c.coacheeId"
            >
              <td class="py-2">
                {{ c.nombre }}
              </td>
              <td class="cifra py-2">
                {{ c.sesionesAgendadas }}
              </td>
              <td class="cifra py-2">
                {{ c.sesionesRealizadas }}
              </td>
              <td class="cifra py-2 text-[var(--color-sage)]">
                {{ formatoCLP.format(c.montoRealizado) }}
              </td>
              <td class="cifra py-2 text-[var(--color-bronze)]">
                {{ formatoCLP.format(c.montoPorRealizar) }}
              </td>
              <td class="cifra py-2">
                {{ formatoCLP.format(c.montoRealizado + c.montoPorRealizar) }}
              </td>
            </tr>
            <tr
              class="bg-[var(--color-parchment)]/40 font-semibold"
              data-subtotal
            >
              <th
                scope="row"
                class="py-2 text-left"
              >
                {{ g.nombre }}
              </th>
              <td class="cifra py-2">
                {{ g.total.agendadas }}
              </td>
              <td class="cifra py-2">
                {{ g.total.realizadas }}
              </td>
              <td class="cifra py-2">
                {{ formatoCLP.format(g.total.montoRealizado) }}
              </td>
              <td class="cifra py-2">
                {{ formatoCLP.format(g.total.montoPorRealizar) }}
              </td>
              <td class="cifra py-2">
                {{ formatoCLP.format(g.total.montoRealizado + g.total.montoPorRealizar) }}
              </td>
            </tr>
          </tbody>
          <tfoot v-if="grupos.length > 1">
            <tr
              class="font-semibold"
              data-total
            >
              <th
                scope="row"
                class="py-2 text-left"
              >
                Total
              </th>
              <td class="cifra py-2">
                {{ total.agendadas }}
              </td>
              <td class="cifra py-2">
                {{ total.realizadas }}
              </td>
              <td class="cifra py-2">
                {{ formatoCLP.format(total.montoRealizado) }}
              </td>
              <td class="cifra py-2">
                {{ formatoCLP.format(total.montoPorRealizar) }}
              </td>
              <td class="cifra py-2">
                {{ formatoCLP.format(total.montoRealizado + total.montoPorRealizar) }}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p class="mt-3 text-xs text-[var(--color-muted)]">
        Agendadas incluye las ya realizadas. Las tarifas en UF se convierten al valor de hoy<template v-if="facturacion?.valorUf"> ({{ formatoCLP.format(facturacion.valorUf) }})</template>. Se cuenta toda sesión cuya fecha ya pasó, aunque el coachee no haya asistido.
      </p>
    </template>
  </div>
</template>
