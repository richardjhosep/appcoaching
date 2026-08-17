<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getMyCoachee, type Coachee } from '../../api/coachees'
import { getOwnPlan, type PlanDesarrollo } from '../../api/planesDesarrollo'
import { getMisCiclos, type Ciclo } from '../../api/ciclos'
import BackLink from '../../components/BackLink.vue'
import CertificadoContenido from '../../components/CertificadoContenido.vue'

const props = defineProps<{ cicloId: string }>()
const router = useRouter()

const loading = ref(true)
const coachee = ref<Coachee | null>(null)
const plan = ref<PlanDesarrollo | null>(null)
const ciclo = ref<Ciclo | null>(null)

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
      <p class="mb-4 text-sm text-[var(--color-ink)]/70">
        Este certificado todavía no está disponible: el ciclo debe estar cerrado con un resultado.
      </p>
      <BackLink
        label="Volver"
        @click="router.push({ name: 'coachee-progreso' })"
      />
    </div>
    <div
      v-else
      class="mx-auto max-w-2xl"
    >
      <div class="mb-4 flex items-center justify-between print:hidden">
        <BackLink
          label="Volver"
          @click="router.push({ name: 'coachee-progreso' })"
        />
        <button
          class="rounded-lg bg-[var(--color-ink)] px-4 py-2 text-sm text-[var(--color-parchment)]"
          @click="imprimir"
        >
          Descargar / Imprimir
        </button>
      </div>

      <CertificadoContenido
        :nombre-coachee="coachee?.nombre ?? ''"
        :objetivo="plan?.objetivoGeneral ?? 'su plan de desarrollo'"
        :resultado="ciclo.resultado"
        :fecha-apertura="ciclo.fechaApertura"
        :fecha-cierre="ciclo.fechaCierre"
      />
    </div>
  </div>
</template>
