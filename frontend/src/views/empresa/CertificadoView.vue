<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getCoachee, type Coachee } from '../../api/coachees'
import { getPlanByCoachee, type PlanDesarrollo } from '../../api/planesDesarrollo'
import { getCiclosDeCoachee, type Ciclo } from '../../api/ciclos'
import BackLink from '../../components/BackLink.vue'
import CertificadoContenido from '../../components/CertificadoContenido.vue'
import SkeletonBlock from '../../components/SkeletonBlock.vue'
import ErrorState from '../../components/ErrorState.vue'
import AppButton from '../../components/AppButton.vue'
import { sin404 } from '../../lib/cargaPorCoachee'
import { useCarga } from '../../lib/useCarga'

const props = defineProps<{ coacheeId: string; cicloId: string }>()
const router = useRouter()

const coachee = ref<Coachee | null>(null)
const plan = ref<PlanDesarrollo | null>(null)
const ciclo = ref<Ciclo | null>(null)

const { loading, error, recargar } = useCarga(async () => {
  const [c, p, ciclos] = await Promise.all([
    getCoachee(props.coacheeId),
    // Sin plan (404) el certificado igual se emite con el texto genérico; otro error sí es fallo.
    getPlanByCoachee(props.coacheeId).then((v) => v ?? null, sin404(null)),
    getCiclosDeCoachee(props.coacheeId),
  ])
  coachee.value = c
  plan.value = p
  ciclo.value = ciclos.find((x) => x.id === props.cicloId) ?? null
})

onMounted(recargar)

function imprimir() {
  window.print()
}
</script>

<template>
  <div class="min-h-screen bg-[var(--color-ivory)] px-4 py-10 text-[var(--color-ink)] print:bg-white print:p-0">
    <SkeletonBlock v-if="loading" />
    <ErrorState
      v-else-if="error"
      class="mx-auto max-w-lg"
      :description="error"
      @retry="recargar"
    />
    <div
      v-else-if="!ciclo || !ciclo.fechaCierre || !ciclo.resultado"
      class="mx-auto max-w-lg rounded-2xl border border-[var(--color-line)] bg-white p-6 text-center"
    >
      <p class="mb-4 text-sm text-[var(--color-muted)]">
        Este certificado todavía no está disponible: el ciclo debe estar cerrado con un resultado.
      </p>
      <BackLink
        label="Volver"
        @click="router.push({ name: 'empresa-coachees' })"
      />
    </div>
    <div
      v-else
      class="mx-auto max-w-2xl"
    >
      <div class="mb-4 flex items-center justify-between print:hidden">
        <BackLink
          label="Volver"
          @click="router.push({ name: 'empresa-coachees' })"
        />
        <AppButton @click="imprimir">
          Imprimir / Guardar como PDF
        </AppButton>
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
