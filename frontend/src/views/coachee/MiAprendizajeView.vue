<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '../../components/AppShell.vue'
import SectionCard from '../../components/SectionCard.vue'
import EmptyState from '../../components/EmptyState.vue'
import SkeletonBlock from '../../components/SkeletonBlock.vue'
import GraficoProgreso from '../../components/GraficoProgreso.vue'
import { getMisSesiones } from '../../api/sesiones'
import { getMisRecursos, listMisAprendizajes } from '../../api/recursos'
import { listQuizzesDisponibles } from '../../api/quiz'
import { listFlashcardsDisponibles } from '../../api/flashcards'
import { listMapasDisponibles } from '../../api/mapas'
import { listEjerciciosDisponibles } from '../../api/ejercicios'
import { listTestsEstiloDisponibles } from '../../api/testEstilo'
import { getMisEntradasDiario, getMiAvance, getMiLineaProgreso, type PuntoProgreso } from '../../api/seguimiento'
import { getOwnPlan } from '../../api/planesDesarrollo'
import { resumenAprendizaje, type ResumenAprendizaje, type TipoTarea } from '../../lib/miAprendizaje'

const router = useRouter()
const loading = ref(true)
const resumen = ref<ResumenAprendizaje | null>(null)
const avance = ref<number | null>(null)
const puntos = ref<PuntoProgreso[]>([])

onMounted(async () => {
  loading.value = true
  const [sesiones, recursos, aprendizajes, quizzes, flashcards, mapas, ejercicios, testEstilo, diario, plan, a, p] =
    await Promise.all([
      getMisSesiones(),
      getMisRecursos(),
      listMisAprendizajes(),
      listQuizzesDisponibles(),
      listFlashcardsDisponibles(),
      listMapasDisponibles(),
      listEjerciciosDisponibles(),
      listTestsEstiloDisponibles(),
      getMisEntradasDiario(),
      getOwnPlan(),
      getMiAvance(),
      getMiLineaProgreso(),
    ])
  resumen.value = resumenAprendizaje({
    sesiones,
    recursos,
    aprendizajes,
    quizzes,
    flashcards,
    mapas,
    ejercicios,
    testEstilo,
    diario,
    planEstado: plan.estado,
    actividades: plan.actividades,
  })
  avance.value = a.avance
  puntos.value = p
  loading.value = false
})

function ir(name: string, query?: Record<string, string>) {
  router.push({ name, query })
}

const tabDeTarea: Partial<Record<TipoTarea, string>> = {
  quiz: 'quiz',
  ejercicios: 'ejercicios',
  'test-estilo': 'test-estilo',
}

function irATarea(tipo: TipoTarea) {
  if (tipo === 'actividad') return ir('coachee-plan')
  if (tipo === 'recurso') return ir('coachee-biblioteca')
  return ir('coachee-playground', { tab: tabDeTarea[tipo]! })
}

function formatFecha(fecha: string): string {
  return new Date(fecha).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
}
</script>

<template>
  <AppShell>
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h1 class="font-[family-name:var(--font-heading)] text-xl font-semibold">
        Mi Aprendizaje
      </h1>
      <RouterLink
        to="/coachee/resumen"
        class="rounded-full border border-[var(--color-line)] px-3 py-1.5 text-xs hover:bg-[var(--color-parchment)]/60"
      >
        Imprimir resumen
      </RouterLink>
    </div>

    <SkeletonBlock v-if="loading" />

    <EmptyState
      v-else-if="resumen!.vacio"
      icon="dashboard"
      title="Todavía no hay nada que mostrar acá"
      description="Cuando tu coach comparta recursos, quizzes o flashcards, vas a ver acá de un vistazo qué tienes pendiente."
    />

    <div
      v-else
      class="space-y-4"
    >
      <p
        v-if="resumen!.planPendienteDeAccion"
        class="rounded-lg border border-[var(--color-bronze)]/40 bg-[var(--color-bronze)]/10 p-3 text-sm text-[var(--color-bronze)]"
      >
        Todavía no has enviado tu plan de desarrollo para aprobación.
        <button
          class="font-medium underline"
          @click="ir('coachee-plan')"
        >
          Ir al plan
        </button>
      </p>

      <!-- "¿Qué necesito hacer?" antes que cualquier otra cosa — mismo principio que
           "Atención inmediata" en el dashboard del coach. -->
      <SectionCard
        title="Tareas pendientes"
        icon="lista"
      >
        <p
          v-if="resumen!.tareasPendientes.length === 0"
          class="text-sm text-[var(--color-sage)]"
        >
          ✓ Nada pendiente por ahora.
        </p>
        <ul
          v-else
          class="space-y-1.5 text-sm"
        >
          <li
            v-for="tarea in resumen!.tareasPendientes"
            :key="`${tarea.tipo}-${tarea.id}`"
            class="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--color-line)]/60 px-3 py-2"
          >
            <span>
              {{ tarea.titulo }}
              <span :class="tarea.urgente ? 'text-[var(--color-danger)]' : 'text-[var(--color-ink)]/50'">
                — {{ tarea.detalle }}
              </span>
            </span>
            <button
              class="rounded-full border border-[var(--color-line)] px-3 py-1 text-xs hover:bg-[var(--color-parchment)]/60"
              @click="irATarea(tarea.tipo)"
            >
              Ver
            </button>
          </li>
        </ul>
      </SectionCard>

      <SectionCard
        title="Mi progreso"
        icon="progreso"
      >
        <GraficoProgreso
          :puntos="puntos"
          :avance="avance"
        />
        <button
          class="mt-3 rounded-full border border-[var(--color-line)] px-3 py-1 text-xs hover:bg-[var(--color-parchment)]/60"
          @click="ir('coachee-progreso')"
        >
          Ver progreso completo
        </button>
      </SectionCard>

      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SectionCard
          title="Próxima sesión"
          icon="sesiones"
        >
          <p
            v-if="resumen!.proximaSesion"
            class="text-sm"
          >
            {{ new Date(resumen!.proximaSesion.fechaHora).toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' }) }}
          </p>
          <p
            v-else
            class="text-sm text-[var(--color-ink)]/50"
          >
            Sin sesión agendada.
          </p>
          <button
            class="mt-3 rounded-full border border-[var(--color-line)] px-3 py-1 text-xs hover:bg-[var(--color-parchment)]/60"
            @click="ir('coachee-sesiones')"
          >
            Ver sesiones
          </button>
        </SectionCard>

        <SectionCard
          title="Biblioteca"
          icon="biblioteca"
        >
          <p
            class="text-sm font-semibold"
            :class="resumen!.recursos.sinApuntes > 0 ? 'text-[var(--color-bronze)]' : 'text-[var(--color-sage)]'"
          >
            {{ resumen!.recursos.sinApuntes > 0 ? `${resumen!.recursos.sinApuntes} sin apuntes` : 'Al día' }}
          </p>
          <p class="text-xs text-[var(--color-ink)]/50">
            {{ resumen!.recursos.total }} recurso{{ resumen!.recursos.total === 1 ? '' : 's' }} en total
          </p>
          <button
            class="mt-3 rounded-full border border-[var(--color-line)] px-3 py-1 text-xs hover:bg-[var(--color-parchment)]/60"
            @click="ir('coachee-biblioteca')"
          >
            Ir a Biblioteca
          </button>
        </SectionCard>

        <SectionCard
          title="Quiz"
          icon="quiz"
        >
          <p
            class="text-sm font-semibold"
            :class="resumen!.quizzes.sinResponder > 0 ? 'text-[var(--color-bronze)]' : 'text-[var(--color-sage)]'"
          >
            {{ resumen!.quizzes.sinResponder > 0 ? `${resumen!.quizzes.sinResponder} sin responder` : 'Al día' }}
          </p>
          <p class="text-xs text-[var(--color-ink)]/50">
            {{ resumen!.quizzes.total }} disponible{{ resumen!.quizzes.total === 1 ? '' : 's' }}
          </p>
          <button
            class="mt-3 rounded-full border border-[var(--color-line)] px-3 py-1 text-xs hover:bg-[var(--color-parchment)]/60"
            @click="ir('coachee-playground', { tab: 'quiz' })"
          >
            Ir a Quiz
          </button>
        </SectionCard>

        <SectionCard
          title="Flashcards"
          icon="flashcards"
        >
          <p
            class="text-sm font-semibold"
            :class="resumen!.flashcards.paraHoy > 0 ? 'text-[var(--color-bronze)]' : 'text-[var(--color-sage)]'"
          >
            {{ resumen!.flashcards.paraHoy > 0 ? `${resumen!.flashcards.paraHoy} para repasar hoy` : 'Al día' }}
          </p>
          <p class="text-xs text-[var(--color-ink)]/50">
            {{ resumen!.flashcards.total }} en total
          </p>
          <button
            class="mt-3 rounded-full border border-[var(--color-line)] px-3 py-1 text-xs hover:bg-[var(--color-parchment)]/60"
            @click="ir('coachee-playground', { tab: 'flashcards' })"
          >
            Ir a Flashcards
          </button>
        </SectionCard>

        <SectionCard
          title="Mapas mentales"
          icon="mapa"
        >
          <p class="text-sm font-semibold text-[var(--color-ink)]/70">
            {{ resumen!.mapas.total }} disponible{{ resumen!.mapas.total === 1 ? '' : 's' }}
          </p>
          <button
            class="mt-3 rounded-full border border-[var(--color-line)] px-3 py-1 text-xs hover:bg-[var(--color-parchment)]/60"
            @click="ir('coachee-playground', { tab: 'mapas' })"
          >
            Ir a Mapas mentales
          </button>
        </SectionCard>

        <SectionCard
          title="Ejercicios"
          icon="ejercicios"
        >
          <p
            class="text-sm font-semibold"
            :class="resumen!.ejercicios.sinEntregar > 0 ? 'text-[var(--color-bronze)]' : 'text-[var(--color-sage)]'"
          >
            {{ resumen!.ejercicios.sinEntregar > 0 ? `${resumen!.ejercicios.sinEntregar} sin entregar` : 'Al día' }}
          </p>
          <p class="text-xs text-[var(--color-ink)]/50">
            {{ resumen!.ejercicios.total }} disponible{{ resumen!.ejercicios.total === 1 ? '' : 's' }}
          </p>
          <button
            class="mt-3 rounded-full border border-[var(--color-line)] px-3 py-1 text-xs hover:bg-[var(--color-parchment)]/60"
            @click="ir('coachee-playground', { tab: 'ejercicios' })"
          >
            Ir a Ejercicios
          </button>
        </SectionCard>

        <SectionCard
          title="Test de Estilo"
          icon="estilo"
        >
          <p
            class="text-sm font-semibold"
            :class="resumen!.testEstilo.sinResponder > 0 ? 'text-[var(--color-bronze)]' : 'text-[var(--color-sage)]'"
          >
            {{ resumen!.testEstilo.sinResponder > 0 ? `${resumen!.testEstilo.sinResponder} sin responder` : 'Al día' }}
          </p>
          <p class="text-xs text-[var(--color-ink)]/50">
            {{ resumen!.testEstilo.total }} disponible{{ resumen!.testEstilo.total === 1 ? '' : 's' }}
          </p>
          <button
            class="mt-3 rounded-full border border-[var(--color-line)] px-3 py-1 text-xs hover:bg-[var(--color-parchment)]/60"
            @click="ir('coachee-playground', { tab: 'test-estilo' })"
          >
            Ir a Test de Estilo
          </button>
        </SectionCard>

        <SectionCard
          title="Apuntes recientes"
          icon="diario"
        >
          <EmptyState
            v-if="resumen!.apuntesRecientes.length === 0"
            icon="diario"
            title="Sin apuntes todavía"
            description="Tus reflexiones del diario y las notas que escribas en Biblioteca aparecen acá."
          />
          <ul
            v-else
            class="space-y-2"
          >
            <li
              v-for="(apunte, i) in resumen!.apuntesRecientes"
              :key="i"
              class="text-sm"
            >
              <p class="line-clamp-2 text-[var(--color-ink)]/80">
                {{ apunte.contenido }}
              </p>
              <p class="text-xs text-[var(--color-ink)]/45">
                {{ formatFecha(apunte.fecha) }}
                <template v-if="apunte.origenLabel">
                  · {{ apunte.origenLabel }}
                </template>
                <template v-else>
                  · Diario
                </template>
              </p>
            </li>
          </ul>
        </SectionCard>
      </div>
    </div>
  </AppShell>
</template>
