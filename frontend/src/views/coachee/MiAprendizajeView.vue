<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '../../components/AppShell.vue'
import SectionCard from '../../components/SectionCard.vue'
import EmptyState from '../../components/EmptyState.vue'
import { getMisSesiones } from '../../api/sesiones'
import { getMisRecursos, listMisAprendizajes } from '../../api/recursos'
import { listQuizzesDisponibles } from '../../api/quiz'
import { listFlashcardsDisponibles } from '../../api/flashcards'
import { listMapasDisponibles } from '../../api/mapas'
import { getMisEntradasDiario } from '../../api/seguimiento'
import { getOwnPlan } from '../../api/planesDesarrollo'
import { resumenAprendizaje, type ResumenAprendizaje } from '../../lib/miAprendizaje'

const router = useRouter()
const loading = ref(true)
const resumen = ref<ResumenAprendizaje | null>(null)

onMounted(async () => {
  loading.value = true
  const [sesiones, recursos, aprendizajes, quizzes, flashcards, mapas, diario, plan] = await Promise.all([
    getMisSesiones(),
    getMisRecursos(),
    listMisAprendizajes(),
    listQuizzesDisponibles(),
    listFlashcardsDisponibles(),
    listMapasDisponibles(),
    getMisEntradasDiario(),
    getOwnPlan(),
  ])
  resumen.value = resumenAprendizaje({
    sesiones,
    recursos,
    aprendizajes,
    quizzes,
    flashcards,
    mapas,
    diario,
    planEstado: plan.estado,
  })
  loading.value = false
})

function ir(name: string) {
  router.push({ name })
}

function formatFecha(fecha: string): string {
  return new Date(fecha).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
}
</script>

<template>
  <AppShell>
    <h1 class="mb-4 font-[family-name:var(--font-heading)] text-xl font-semibold">
      Mi Aprendizaje
    </h1>

    <div
      v-if="loading"
      class="text-sm text-[var(--color-ink)]/60"
    >
      Cargando…
    </div>

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
            class="mt-3 text-xs text-[var(--color-sage)] hover:underline"
            @click="ir('coachee-sesiones')"
          >
            Ver sesiones →
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
            class="mt-3 text-xs text-[var(--color-sage)] hover:underline"
            @click="ir('coachee-biblioteca')"
          >
            Ir a Biblioteca →
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
            class="mt-3 text-xs text-[var(--color-sage)] hover:underline"
            @click="ir('coachee-quiz')"
          >
            Ir a Quiz →
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
            class="mt-3 text-xs text-[var(--color-sage)] hover:underline"
            @click="ir('coachee-flashcards')"
          >
            Ir a Flashcards →
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
            class="mt-3 text-xs text-[var(--color-sage)] hover:underline"
            @click="ir('coachee-mapas')"
          >
            Ir a Mapas mentales →
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
