<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '../../components/AppShell.vue'
import EmptyState from '../../components/EmptyState.vue'
import { listCoachees, type CoacheeListItem } from '../../api/coachees'
import { getPlanByCoachee } from '../../api/planesDesarrollo'
import { getCiclosDeCoachee, type Ciclo } from '../../api/ciclos'
import { getAvanceDeCoachee } from '../../api/seguimiento'
import { getProximaSesionDeCoachee } from '../../api/sesiones'
import { resumirCoachee, type ResumenCoacheeEmpresa } from '../../lib/resumenCoacheeEmpresa'
import { nivelProgreso, coloresNivel } from '../../lib/nivelProgreso'
import { iniciales } from '../../lib/avatar'

const router = useRouter()
const loading = ref(true)
const filas = ref<{ coachee: CoacheeListItem; resumen: ResumenCoacheeEmpresa }[]>([])

const estadoLabel: Record<ResumenCoacheeEmpresa['estado'], string> = {
  sin_iniciar: 'Sin iniciar',
  en_curso: 'En curso',
  completado: 'Completado',
}

const estadoClase: Record<ResumenCoacheeEmpresa['estado'], string> = {
  sin_iniciar: 'bg-[var(--color-parchment)] text-[var(--color-ink)]/70',
  en_curso: 'bg-[var(--color-sage)]/15 text-[var(--color-sage)]',
  completado: 'bg-[var(--color-bronze)]/15 text-[var(--color-bronze)]',
}

async function resumenDe(coachee: CoacheeListItem): Promise<ResumenCoacheeEmpresa> {
  const [plan, ciclos, avanceRes, proximaSesion] = await Promise.all([
    getPlanByCoachee(coachee.id).catch(() => null),
    getCiclosDeCoachee(coachee.id),
    getAvanceDeCoachee(coachee.id),
    getProximaSesionDeCoachee(coachee.id),
  ])
  const cicloActual: Ciclo | null = ciclos.find((c) => !c.fechaCierre) ?? null
  return resumirCoachee({ plan, cicloActual, ciclos, avance: avanceRes.avance, proximaSesion })
}

onMounted(async () => {
  loading.value = true
  const coachees = await listCoachees()
  filas.value = await Promise.all(
    coachees.map(async (coachee) => ({ coachee, resumen: await resumenDe(coachee) })),
  )
  loading.value = false
})

function verCiclo(coacheeId: string) {
  void router.push({ name: 'empresa-ciclo', params: { coacheeId } })
}
</script>

<template>
  <AppShell>
    <h1 class="mb-4 font-[family-name:var(--font-heading)] text-xl font-semibold">
      Mis coachees
    </h1>
    <div
      v-if="loading"
      class="text-sm text-[var(--color-ink)]/60"
    >
      Cargando…
    </div>
    <EmptyState
      v-else-if="filas.length === 0"
      icon="coachees"
      title="Todavía no hay coachees asociados a tu empresa"
      description="Cuando tu coach los agregue, van a aparecer acá."
    />
    <ul
      v-else
      class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
    >
      <li
        v-for="fila in filas"
        :key="fila.coachee.id"
        class="cursor-pointer rounded-2xl border border-[var(--color-line)] bg-white p-4 hover:border-[var(--color-sage)]"
        @click="verCiclo(fila.coachee.id)"
      >
        <div class="mb-3 flex items-start gap-2.5">
          <div
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-ink)] text-xs font-semibold text-[var(--color-parchment)]"
            aria-hidden="true"
          >
            {{ iniciales(fila.coachee.nombre) }}
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium">
              {{ fila.coachee.nombre }}
            </p>
            <p class="truncate text-xs text-[var(--color-ink)]/50">
              {{ fila.resumen.competenciaNombre ?? 'Sin competencia definida' }}
            </p>
          </div>
          <span
            class="shrink-0 rounded-full px-2 py-0.5 text-xs"
            :class="estadoClase[fila.resumen.estado]"
          >
            {{ estadoLabel[fila.resumen.estado] }}
          </span>
        </div>

        <template v-if="fila.resumen.avance !== null">
          <div
            class="mb-1 h-2 w-full overflow-hidden rounded-full"
            :style="{ backgroundColor: coloresNivel[nivelProgreso(fila.resumen.avance)].suave }"
          >
            <div
              class="h-full rounded-full"
              :style="{ width: `${fila.resumen.avance}%`, backgroundColor: coloresNivel[nivelProgreso(fila.resumen.avance)].fuerte }"
            />
          </div>
          <p class="mb-2 text-xs text-[var(--color-ink)]/50">
            {{ fila.resumen.avance }}% de avance
          </p>
        </template>

        <p
          v-if="fila.resumen.alertaPorVencer"
          class="mb-1 text-xs font-medium text-[var(--color-bronze)]"
        >
          Ciclo por vencer
        </p>
        <p
          v-if="fila.resumen.proximaSesionFecha"
          class="text-xs text-[var(--color-ink)]/50"
        >
          Próxima sesión: {{ new Date(fila.resumen.proximaSesionFecha).toLocaleDateString('es-CL') }}
        </p>
      </li>
    </ul>
  </AppShell>
</template>
