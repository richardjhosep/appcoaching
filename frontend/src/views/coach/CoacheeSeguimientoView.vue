<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppShell from '../../components/AppShell.vue'
import ProgresoLineaTiempo from '../../components/ProgresoLineaTiempo.vue'
import { getPlanByCoachee } from '../../api/planesDesarrollo'
import { getSesionesDeCoachee, type Sesion } from '../../api/sesiones'
import {
  getAvanceDeCoachee,
  getLineaProgresoDeCoachee,
  getLogrosDeCoachee,
  type Logro,
  type PuntoProgreso,
} from '../../api/seguimiento'

const props = defineProps<{ coacheeId: string }>()

const loading = ref(true)
const nombreCoachee = ref('')
const avance = ref<number | null>(null)
const puntos = ref<PuntoProgreso[]>([])
const logros = ref<Logro[]>([])
const sesiones = ref<Sesion[]>([])

const ultimaPostSesionPublicada = computed(() => {
  return [...sesiones.value]
    .filter((s) => s.postSesion?.publicada)
    .sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime())[0]
    ?.postSesion ?? null
})

async function load() {
  loading.value = true
  const [plan, a, p, l, s] = await Promise.all([
    getPlanByCoachee(props.coacheeId),
    getAvanceDeCoachee(props.coacheeId),
    getLineaProgresoDeCoachee(props.coacheeId),
    getLogrosDeCoachee(props.coacheeId),
    getSesionesDeCoachee(props.coacheeId),
  ])
  nombreCoachee.value = plan.coachee?.nombre ?? ''
  avance.value = a.avance
  puntos.value = p
  logros.value = l
  sesiones.value = s
  loading.value = false
}

onMounted(load)
</script>

<template>
  <AppShell>
    <div
      v-if="loading"
      class="text-sm text-[var(--color-ink)]/60"
    >
      Cargando…
    </div>
    <div v-else>
      <h1 class="mb-4 font-[family-name:var(--font-heading)] text-xl font-semibold">
        Seguimiento de {{ nombreCoachee }}
      </h1>

      <div class="mb-4 rounded-2xl border border-[var(--color-line)] bg-white p-4">
        <h2 class="mb-1 text-sm font-medium">
          Avance general
        </h2>
        <p
          v-if="avance === null"
          class="text-sm text-[var(--color-ink)]/60"
        >
          El coachee aún no se ha autoevaluado en ningún post-sesión.
        </p>
        <p
          v-else
          class="font-[family-name:var(--font-mono)] text-3xl text-[var(--color-sage)]"
        >
          {{ avance }}%
        </p>
      </div>

      <div class="mb-4 rounded-2xl border border-[var(--color-line)] bg-white p-4">
        <h2 class="mb-3 text-sm font-medium">
          Línea de tiempo (cercanía al objetivo por sesión)
        </h2>
        <ProgresoLineaTiempo :puntos="puntos" />
      </div>

      <div
        v-if="ultimaPostSesionPublicada"
        class="mb-4 rounded-2xl border border-[var(--color-line)] bg-white p-4 text-sm"
      >
        <h2 class="mb-2 text-sm font-medium">
          Recomendación y temas de la última sesión
        </h2>
        <p v-if="ultimaPostSesionPublicada.recomendacion">
          <strong>Recomendación del coachee:</strong> {{ ultimaPostSesionPublicada.recomendacion }}
        </p>
        <p v-if="ultimaPostSesionPublicada.temasProximaSesion">
          <strong>Temas propuestos:</strong> {{ ultimaPostSesionPublicada.temasProximaSesion }}
        </p>
      </div>

      <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
        <h2 class="mb-3 text-sm font-medium">
          Logros
        </h2>
        <ul
          v-if="logros.length"
          class="space-y-1 text-sm"
        >
          <li
            v-for="logro in logros"
            :key="logro.id"
          >
            <span class="font-[family-name:var(--font-mono)] text-[var(--color-ink)]/50">{{ logro.fecha }}</span>
            — {{ logro.descripcion }}
          </li>
        </ul>
        <p
          v-else
          class="text-sm text-[var(--color-ink)]/60"
        >
          Sin logros registrados todavía.
        </p>
      </div>
    </div>
  </AppShell>
</template>
