<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getMyCoachee, type Coachee } from '../../api/coachees'
import { getOwnPlan, type PlanDesarrollo } from '../../api/planesDesarrollo'
import { getMisCiclos, type Ciclo } from '../../api/ciclos'

const props = defineProps<{ cicloId: string }>()
const router = useRouter()

const loading = ref(true)
const coachee = ref<Coachee | null>(null)
const plan = ref<PlanDesarrollo | null>(null)
const ciclo = ref<Ciclo | null>(null)

const resultadoLabel: Record<string, string> = {
  logrado: 'Logrado',
  medianamente_logrado: 'Medianamente logrado',
  no_logrado: 'No logrado',
}

onMounted(async () => {
  const [c, p, ciclos] = await Promise.all([getMyCoachee(), getOwnPlan(), getMisCiclos()])
  coachee.value = c
  plan.value = p
  ciclo.value = ciclos.find((x) => x.id === props.cicloId) ?? null
  loading.value = false
})

function imprimir() {
  window.print()
}
</script>

<template>
  <div class="min-h-screen bg-[var(--color-ivory)] px-4 py-10 text-[var(--color-ink)] print:bg-white print:p-0">
    <div
      v-if="loading"
      class="text-center text-sm text-[var(--color-ink)]/60"
    >
      Cargando…
    </div>
    <div
      v-else-if="!ciclo || !ciclo.fechaCierre || !ciclo.resultado"
      class="mx-auto max-w-lg rounded-2xl border border-[var(--color-line)] bg-white p-6 text-center"
    >
      <p class="text-sm text-[var(--color-ink)]/70">
        Este certificado todavía no está disponible: el ciclo debe estar cerrado con un resultado.
      </p>
      <button
        class="mt-4 text-sm text-[var(--color-sage)] underline"
        @click="router.push({ name: 'coachee-progreso' })"
      >
        Volver
      </button>
    </div>
    <div
      v-else
      class="mx-auto max-w-2xl"
    >
      <div class="mb-4 flex justify-between print:hidden">
        <button
          class="text-sm text-[var(--color-ink)]/70 hover:underline"
          @click="router.push({ name: 'coachee-progreso' })"
        >
          ← Volver
        </button>
        <button
          class="rounded-lg bg-[var(--color-ink)] px-4 py-2 text-sm text-[var(--color-parchment)]"
          @click="imprimir"
        >
          Descargar / Imprimir
        </button>
      </div>

      <div class="rounded-2xl border-4 border-double border-[var(--color-bronze)] bg-white p-10 text-center print:rounded-none print:border-2">
        <p class="mb-1 font-[family-name:var(--font-heading)] text-xs uppercase tracking-widest text-[var(--color-bronze)]">
          Coach Fernando Ramos
        </p>
        <h1 class="mb-6 font-[family-name:var(--font-heading)] text-2xl font-semibold">
          Certificado de Finalización de Proceso de Coaching
        </h1>
        <p class="mb-2 text-sm text-[var(--color-ink)]/70">
          Se certifica que
        </p>
        <p class="mb-6 font-[family-name:var(--font-heading)] text-xl font-semibold">
          {{ coachee?.nombre }}
        </p>
        <p class="mb-1 text-sm text-[var(--color-ink)]/70">
          completó su proceso de coaching enfocado en
        </p>
        <p class="mb-6 text-sm font-medium">
          {{ plan?.objetivoGeneral ?? 'su plan de desarrollo' }}
        </p>
        <p class="mb-1 text-sm text-[var(--color-ink)]/70">
          con resultado
        </p>
        <p class="mb-6 font-[family-name:var(--font-heading)] text-lg font-semibold text-[var(--color-sage)]">
          {{ resultadoLabel[ciclo.resultado] }}
        </p>
        <p class="font-[family-name:var(--font-mono)] text-xs text-[var(--color-ink)]/60">
          {{ new Date(ciclo.fechaApertura).toLocaleDateString('es-CL') }}
          —
          {{ new Date(ciclo.fechaCierre).toLocaleDateString('es-CL') }}
        </p>
      </div>
    </div>
  </div>
</template>
