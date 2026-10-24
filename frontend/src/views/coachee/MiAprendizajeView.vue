<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '../../components/AppShell.vue'
import AppButton from '../../components/AppButton.vue'
import ErrorState from '../../components/ErrorState.vue'
import SectionCard from '../../components/SectionCard.vue'
import EmptyState from '../../components/EmptyState.vue'
import SkeletonBlock from '../../components/SkeletonBlock.vue'
import ProgresoCamino from '../../components/ProgresoCamino.vue'
import { getMisSesiones } from '../../api/sesiones'
import { getMisRecursos, listMisAprendizajes } from '../../api/recursos'
import { listQuizzesDisponibles } from '../../api/quiz'
import { listFlashcardsDisponibles } from '../../api/flashcards'
import { listMapasDisponibles } from '../../api/mapas'
import { listEjerciciosDisponibles } from '../../api/ejercicios'
import { listTestsEstiloDisponibles } from '../../api/testEstilo'
import { getMisEntradasDiario, getMiLineaProgreso, type PuntoProgreso } from '../../api/seguimiento'
import { getOwnPlan } from '../../api/planesDesarrollo'
import { getMyCoachee, type Coachee } from '../../api/coachees'
import { resumenAprendizaje, type ResumenAprendizaje, type TipoTarea } from '../../lib/miAprendizaje'
import { primerosPasos, type PrimerPaso } from '../../lib/primerosPasos'
import { useCarga } from '../../lib/useCarga'

const router = useRouter()
const resumen = ref<ResumenAprendizaje | null>(null)
const puntos = ref<PuntoProgreso[]>([])
const coachee = ref<Coachee | null>(null)
const pasos = ref<PrimerPaso[]>([])

const CLAVE_PASOS_DESCARTADOS = 'coachee-primeros-pasos-descartados'
const pasosDescartados = ref(false)
try {
  pasosDescartados.value = localStorage.getItem(CLAVE_PASOS_DESCARTADOS) === '1'
} catch {
  // Sin acceso a localStorage (modo privado, etc.): el checklist simplemente no se recuerda.
}

function descartarPasos() {
  pasosDescartados.value = true
  try {
    localStorage.setItem(CLAVE_PASOS_DESCARTADOS, '1')
  } catch {
    // ignorar
  }
}

const pasosPendientes = computed(() => pasos.value.filter((p) => !p.hecho))
const mostrarPasos = computed(() => !pasosDescartados.value && pasosPendientes.value.length > 0)
// Saludo según la hora, con el primer nombre del coachee (si aún no carga, solo el saludo).
const saludo = computed(() => {
  const h = new Date().getHours()
  const base = h < 12 ? 'Buenos días' : h < 20 ? 'Buenas tardes' : 'Buenas noches'
  const nombre = coachee.value?.nombre?.trim().split(/\s+/)[0]
  return nombre ? `${base}, ${nombre}` : base
})
const consentimientoPendiente = computed(() => coachee.value !== null && !coachee.value.consentimientoInformado)

const { loading, error, fallos, recargar, tolerar } = useCarga(async () => {
  // El plan y las sesiones son críticos (sin ellos el resumen sería engañoso): si fallan, se
  // muestra el error con "Reintentar". El resto se tolera y se avisa si faltó algo.
  const [plan, sesiones, recursos, aprendizajes, quizzes, flashcards, mapas, ejercicios, testEstilo, diario, p, co] =
    await Promise.all([
      getOwnPlan(),
      getMisSesiones(),
      tolerar(getMisRecursos()),
      tolerar(listMisAprendizajes()),
      tolerar(listQuizzesDisponibles()),
      tolerar(listFlashcardsDisponibles()),
      tolerar(listMapasDisponibles()),
      tolerar(listEjerciciosDisponibles()),
      tolerar(listTestsEstiloDisponibles()),
      tolerar(getMisEntradasDiario()),
      tolerar(getMiLineaProgreso()),
      tolerar(getMyCoachee()),
    ])
  resumen.value = resumenAprendizaje({
    sesiones,
    recursos: recursos ?? [],
    aprendizajes: aprendizajes ?? [],
    quizzes: quizzes ?? [],
    flashcards: flashcards ?? [],
    mapas: mapas ?? [],
    ejercicios: ejercicios ?? [],
    testEstilo: testEstilo ?? [],
    diario: diario ?? [],
    planEstado: plan.estado,
    actividades: plan.actividades,
  })
  puntos.value = p ?? []
  coachee.value = co ?? null
  pasos.value = primerosPasos({ coachee: coachee.value, plan, totalSesiones: sesiones.length })
})

onMounted(recargar)

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
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">
          Mi Aprendizaje
        </p>
        <h1 class="font-[family-name:var(--font-display)] text-2xl font-medium">
          {{ saludo }}
        </h1>
      </div>
      <RouterLink
        to="/coachee/resumen"
        class="rounded-full border border-[var(--color-line)] px-3 py-1.5 text-xs hover:bg-[var(--color-parchment)]/60"
      >
        Imprimir resumen
      </RouterLink>
    </div>

    <SkeletonBlock v-if="loading" />

    <ErrorState
      v-else-if="error"
      :description="error"
      @retry="recargar"
    />

    <template v-else>
      <p
        v-if="fallos > 0"
        role="status"
        class="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--color-bronze)]/40 bg-[var(--color-bronze)]/10 p-3 text-sm text-[var(--color-bronze)]"
      >
        No pudimos cargar parte de tu información, así que algunos datos pueden aparecer incompletos.
        <AppButton
          variant="secondary"
          size="sm"
          @click="recargar"
        >
          Reintentar
        </AppButton>
      </p>

      <!-- Con el checklist de "Primeros pasos" visible, el consentimiento y el plan ya aparecen
           como pasos: estos avisos solo se muestran cuando el checklist está oculto o completo. -->
      <p
        v-if="consentimientoPendiente && !mostrarPasos"
        class="mb-4 rounded-lg border border-[var(--color-bronze)]/40 bg-[var(--color-bronze)]/10 p-3 text-sm text-[var(--color-bronze)]"
      >
        Tu consentimiento informado está pendiente.
        <RouterLink
          :to="{ name: 'coachee-cuenta' }"
          class="font-medium underline"
        >
          Ver en Mi cuenta
        </RouterLink>
      </p>

      <SectionCard
        v-if="mostrarPasos"
        class="mb-4"
        title="Primeros pasos"
        icon="lista"
      >
        <ul class="space-y-1.5 text-sm">
          <li
            v-for="paso in pasos"
            :key="paso.id"
            class="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-line)]/60 px-3 py-2"
          >
            <span
              class="min-w-0 flex-1"
              :class="paso.hecho ? 'text-[var(--color-muted)] line-through' : ''"
            >
              <span
                aria-hidden="true"
                class="mr-1"
              >{{ paso.hecho ? '✓' : '○' }}</span>
              {{ paso.titulo }}
              <span
                v-if="!paso.hecho"
                class="block text-xs text-[var(--color-muted)]"
              >{{ paso.detalle }}</span>
            </span>
            <AppButton
              v-if="!paso.hecho"
              class="shrink-0"
              variant="secondary"
              size="sm"
              @click="ir(paso.ruta)"
            >
              Ir
            </AppButton>
          </li>
        </ul>
        <div class="mt-3 flex flex-wrap items-center justify-between gap-2">
          <RouterLink
            :to="{ name: 'guia-coachee' }"
            class="text-xs text-[var(--color-saltup)] hover:underline"
          >
            Ver la guía de la plataforma
          </RouterLink>
          <AppButton
            variant="ghost"
            size="sm"
            @click="descartarPasos"
          >
            Ocultar esta lista
          </AppButton>
        </div>
      </SectionCard>

      <EmptyState
        v-if="resumen!.vacio"
        icon="dashboard"
        title="Todavía no hay nada que mostrar acá"
        description="Cuando tu coach comparta recursos, quizzes o flashcards, vas a ver acá de un vistazo qué tienes pendiente."
      />

      <div
        v-else
        class="space-y-4"
      >
        <p
          v-if="resumen!.planPendienteDeAccion && !mostrarPasos"
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
                <span :class="tarea.urgente ? 'text-[var(--color-danger)]' : 'text-[var(--color-muted)]'">
                  — {{ tarea.detalle }}
                </span>
              </span>
              <AppButton
                variant="secondary"
                size="sm"
                @click="irATarea(tarea.tipo)"
              >
                Ver
              </AppButton>
            </li>
          </ul>
        </SectionCard>

        <SectionCard
          title="Mi progreso"
          icon="progreso"
        >
          <ProgresoCamino
            :puntos="puntos"
            compacto
          />
          <AppButton
            class="mt-3"
            variant="secondary"
            size="sm"
            @click="ir('coachee-progreso')"
          >
            Ver progreso completo
          </AppButton>
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
              class="text-sm text-[var(--color-muted)]"
            >
              Aún no tienes una sesión agendada. Pide una hora entre las que tu coach dejó disponibles.
            </p>
            <AppButton
              class="mt-3"
              variant="secondary"
              size="sm"
              @click="ir('coachee-sesiones')"
            >
              {{ resumen!.proximaSesion ? 'Ver sesiones' : 'Pedir una sesión' }}
            </AppButton>
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
            <p class="text-xs text-[var(--color-muted)]">
              {{ resumen!.recursos.total }} recurso{{ resumen!.recursos.total === 1 ? '' : 's' }} en total
            </p>
            <AppButton
              class="mt-3"
              variant="secondary"
              size="sm"
              @click="ir('coachee-biblioteca')"
            >
              Ir a Biblioteca
            </AppButton>
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
            <p class="text-xs text-[var(--color-muted)]">
              {{ resumen!.quizzes.total }} disponible{{ resumen!.quizzes.total === 1 ? '' : 's' }}
            </p>
            <AppButton
              class="mt-3"
              variant="secondary"
              size="sm"
              @click="ir('coachee-playground', { tab: 'quiz' })"
            >
              Ir a Quiz
            </AppButton>
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
            <p class="text-xs text-[var(--color-muted)]">
              {{ resumen!.flashcards.total }} en total
            </p>
            <AppButton
              class="mt-3"
              variant="secondary"
              size="sm"
              @click="ir('coachee-playground', { tab: 'flashcards' })"
            >
              Ir a Flashcards
            </AppButton>
          </SectionCard>

          <SectionCard
            title="Mapas mentales"
            icon="mapa"
          >
            <p class="text-sm font-semibold text-[var(--color-muted)]">
              {{ resumen!.mapas.total }} disponible{{ resumen!.mapas.total === 1 ? '' : 's' }}
            </p>
            <AppButton
              class="mt-3"
              variant="secondary"
              size="sm"
              @click="ir('coachee-playground', { tab: 'mapas' })"
            >
              Ir a Mapas mentales
            </AppButton>
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
            <p class="text-xs text-[var(--color-muted)]">
              {{ resumen!.ejercicios.total }} disponible{{ resumen!.ejercicios.total === 1 ? '' : 's' }}
            </p>
            <AppButton
              class="mt-3"
              variant="secondary"
              size="sm"
              @click="ir('coachee-playground', { tab: 'ejercicios' })"
            >
              Ir a Ejercicios
            </AppButton>
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
            <p class="text-xs text-[var(--color-muted)]">
              {{ resumen!.testEstilo.total }} disponible{{ resumen!.testEstilo.total === 1 ? '' : 's' }}
            </p>
            <AppButton
              class="mt-3"
              variant="secondary"
              size="sm"
              @click="ir('coachee-playground', { tab: 'test-estilo' })"
            >
              Ir a Test de Estilo
            </AppButton>
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
                <p class="line-clamp-2 whitespace-pre-line text-[var(--color-ink)]/80">
                  {{ apunte.contenido }}
                </p>
                <p class="text-xs text-[var(--color-muted)]">
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
    </template>
  </AppShell>
</template>
