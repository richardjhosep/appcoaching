<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getMyCoachee, type Coachee } from '../../api/coachees'
import { getOwnPlan, type PlanDesarrollo } from '../../api/planesDesarrollo'
import { getMiCicloActual, type Ciclo } from '../../api/ciclos'
import { getMisSesiones, type Sesion } from '../../api/sesiones'
import { getMiAvance, getMisLogros, type Logro } from '../../api/seguimiento'
import BackLink from '../../components/BackLink.vue'
import EstadoProcesoContenido from '../../components/EstadoProcesoContenido.vue'
import SkeletonBlock from '../../components/SkeletonBlock.vue'

const router = useRouter()

const loading = ref(true)
const coachee = ref<Coachee | null>(null)
const plan = ref<PlanDesarrollo | null>(null)
const ciclo = ref<Ciclo | null>(null)
const sesiones = ref<Sesion[]>([])
const avance = ref<number | null>(null)
const logros = ref<Logro[]>([])

const MAX_LOGROS = 5

onMounted(async () => {
  const [c, p, ci, s, a, l] = await Promise.all([
    getMyCoachee(),
    getOwnPlan(),
    getMiCicloActual(),
    getMisSesiones(),
    getMiAvance(),
    getMisLogros(),
  ])
  coachee.value = c
  plan.value = p
  ciclo.value = ci
  sesiones.value = s
  avance.value = a.avance
  logros.value = l
  loading.value = false
})

function imprimir() {
  window.print()
}
</script>

<template>
  <div class="min-h-screen bg-[var(--color-ivory)] px-4 py-10 text-[var(--color-ink)] print:bg-white print:p-0">
    <SkeletonBlock v-if="loading" />
    <div
      v-else
      class="mx-auto max-w-2xl"
    >
      <div class="mb-4 flex items-center justify-between print:hidden">
        <BackLink
          label="Volver"
          @click="router.push({ name: 'coachee-mi-aprendizaje' })"
        />
        <button
          class="rounded-lg bg-[var(--color-ink)] px-4 py-2 text-sm text-[var(--color-parchment)]"
          @click="imprimir"
        >
          Descargar / Imprimir
        </button>
      </div>

      <EstadoProcesoContenido
        :nombre-coachee="coachee?.nombre ?? ''"
        :objetivo="plan?.objetivoGeneral ?? 'Sin objetivo definido aún'"
        :competencia="plan?.competencia?.nombre ?? null"
        :fecha-inicio="ciclo?.fechaApertura ?? plan?.createdAt ?? new Date().toISOString()"
        :avance="avance"
        :proxima-sesion="sesiones.filter((s) => new Date(s.fechaHora).getTime() > Date.now()).sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime())[0]?.fechaHora ?? null"
        :actividades-pendientes="(plan?.actividades ?? []).filter((a) => a.estado !== 'completada').length"
        :actividades-completadas="(plan?.actividades ?? []).filter((a) => a.estado === 'completada').length"
        :logros-recientes="logros.slice(0, MAX_LOGROS).map((l) => ({ fecha: l.fecha, descripcion: l.descripcion }))"
      />
    </div>
  </div>
</template>
