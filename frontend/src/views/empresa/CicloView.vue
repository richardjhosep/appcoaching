<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '../../components/AppShell.vue'
import SectionCard from '../../components/SectionCard.vue'
import EmptyState from '../../components/EmptyState.vue'
import BackLink from '../../components/BackLink.vue'
import NavIcon from '../../components/NavIcon.vue'
import AppModal from '../../components/AppModal.vue'
import HistorialCiclos from '../../components/HistorialCiclos.vue'
import CertificadoContenido from '../../components/CertificadoContenido.vue'
import { getCoachee, type Coachee } from '../../api/coachees'
import { getPlanByCoachee, type PlanDesarrollo } from '../../api/planesDesarrollo'
import { getCicloActualDeCoachee, getCiclosDeCoachee, type Ciclo } from '../../api/ciclos'
import { getAvanceDeCoachee } from '../../api/seguimiento'
import { nivelProgreso, coloresNivel } from '../../lib/nivelProgreso'
import { resultadoLabel } from '../../lib/resultadoCiclo'

const props = defineProps<{ coacheeId: string }>()
const router = useRouter()

const loading = ref(true)
const coachee = ref<Coachee | null>(null)
const plan = ref<PlanDesarrollo | null>(null)
const cicloActual = ref<Ciclo | null>(null)
const historial = ref<Ciclo[]>([])
const avance = ref<number | null>(null)
const previewCiclo = ref<Ciclo | null>(null)

const ciclosCerrados = computed(() => historial.value.filter((c) => c.fechaCierre))
const certificados = computed(() => historial.value.filter((c) => c.fechaCierre && c.resultado))
const coloresAvance = computed(() => coloresNivel[nivelProgreso(avance.value ?? 0)])

onMounted(async () => {
  loading.value = true
  const [c, p, actual, todos, avanceRes] = await Promise.all([
    getCoachee(props.coacheeId),
    getPlanByCoachee(props.coacheeId).catch(() => null),
    getCicloActualDeCoachee(props.coacheeId),
    getCiclosDeCoachee(props.coacheeId),
    getAvanceDeCoachee(props.coacheeId),
  ])
  coachee.value = c
  plan.value = p
  cicloActual.value = actual
  historial.value = todos
  avance.value = avanceRes.avance
  loading.value = false
})
</script>

<template>
  <AppShell>
    <div
      v-if="loading"
      class="text-sm text-[var(--color-ink)]/60"
    >
      Cargando…
    </div>
    <div
      v-else
      class="space-y-4"
    >
      <BackLink
        label="Volver a Coachees"
        @click="router.push({ name: 'empresa-coachees' })"
      />

      <div>
        <h1 class="font-[family-name:var(--font-heading)] text-xl font-semibold">
          Proceso de {{ coachee?.nombre }}
        </h1>
        <p
          v-if="plan?.competencia"
          class="text-sm text-[var(--color-ink)]/60"
        >
          {{ plan.competencia.nombre }}
        </p>
      </div>

      <SectionCard
        title="Avance general"
        icon="progreso"
      >
        <EmptyState
          v-if="avance === null"
          icon="progreso"
          title="Todavía no hay autoevaluaciones"
          description="El avance general se calcula con las autoevaluaciones que completa el coachee en cada post-sesión."
        />
        <template v-else>
          <p
            class="mb-2 font-[family-name:var(--font-mono)] text-3xl"
            :class="coloresAvance.texto"
          >
            {{ avance }}%
          </p>
          <div
            class="h-2.5 w-full overflow-hidden rounded-full"
            :style="{ backgroundColor: coloresAvance.suave }"
          >
            <div
              class="h-full rounded-full transition-all"
              :style="{ width: `${avance}%`, backgroundColor: coloresAvance.fuerte }"
            />
          </div>
        </template>
      </SectionCard>

      <SectionCard
        title="Ciclo en curso"
        icon="objetivo"
      >
        <EmptyState
          v-if="!cicloActual"
          icon="objetivo"
          title="Sin ciclo abierto actualmente"
          description="Este coachee no tiene un ciclo de coaching en curso."
        />
        <template v-else>
          <div class="mb-3 flex items-center justify-between">
            <p class="text-sm">
              Sesiones: {{ cicloActual.sesionesRealizadas }} de {{ cicloActual.totalSesiones }}
            </p>
            <span
              v-if="cicloActual.alertaPorVencer"
              class="rounded-full bg-[var(--color-bronze)]/20 px-2 py-0.5 text-xs text-[var(--color-bronze)]"
            >
              Ciclo por vencer
            </span>
          </div>
          <p class="text-sm">
            <strong>Resumen de reunión inicial:</strong>
            {{ cicloActual.resumenReunionInicial ?? 'Aún no redactado por el coach.' }}
          </p>
        </template>
      </SectionCard>

      <SectionCard
        title="Historial de ciclos"
        icon="objetivo"
      >
        <HistorialCiclos :ciclos="ciclosCerrados" />
      </SectionCard>

      <SectionCard
        v-if="certificados.length > 0"
        title="Certificados"
        icon="certificado"
      >
        <div class="space-y-2">
          <div
            v-for="c in certificados"
            :key="c.id"
            class="flex flex-col gap-3 rounded-xl border border-[var(--color-line)] bg-white p-3 sm:flex-row sm:items-center"
          >
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-parchment)] text-[var(--color-spark)]">
              <NavIcon
                name="certificado"
                :size="20"
              />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium">
                Certificado de finalización
              </p>
              <p class="flex flex-wrap items-center gap-2 text-xs text-[var(--color-ink)]/60">
                <span>Ciclo cerrado el {{ new Date(c.fechaCierre!).toLocaleDateString('es-CL') }}</span>
                <span class="rounded-full bg-[var(--color-parchment)] px-2 py-0.5">{{ resultadoLabel[c.resultado!] }}</span>
              </p>
            </div>
            <div class="flex shrink-0 gap-2">
              <button
                class="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-xs hover:bg-[var(--color-parchment)]/50"
                @click="previewCiclo = c"
              >
                Vista previa
              </button>
              <RouterLink
                :to="{ name: 'empresa-certificado', params: { coacheeId: props.coacheeId, cicloId: c.id } }"
                class="rounded-lg bg-[var(--color-ink)] px-3 py-1.5 text-xs text-[var(--color-parchment)]"
              >
                Descargar
              </RouterLink>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>

    <AppModal
      v-if="previewCiclo"
      size="lg"
      title="Vista previa del certificado"
      @close="previewCiclo = null"
    >
      <CertificadoContenido
        :nombre-coachee="coachee?.nombre ?? ''"
        :objetivo="plan?.objetivoGeneral ?? 'su plan de desarrollo'"
        :resultado="previewCiclo.resultado!"
        :fecha-apertura="previewCiclo.fechaApertura"
        :fecha-cierre="previewCiclo.fechaCierre!"
      />
      <div class="mt-4 flex justify-end gap-2">
        <button
          class="rounded-lg border border-[var(--color-line)] px-4 py-2 text-sm"
          @click="previewCiclo = null"
        >
          Cerrar
        </button>
        <RouterLink
          :to="{ name: 'empresa-certificado', params: { coacheeId: props.coacheeId, cicloId: previewCiclo.id } }"
          class="rounded-lg bg-[var(--color-ink)] px-4 py-2 text-sm text-[var(--color-parchment)]"
        >
          Descargar / Imprimir
        </RouterLink>
      </div>
    </AppModal>
  </AppShell>
</template>
