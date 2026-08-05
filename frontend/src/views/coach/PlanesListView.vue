<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '../../components/AppShell.vue'
import Pagination from '../../components/Pagination.vue'
import {
  listPlanes,
  enviarRecordatorio,
  type PlanDesarrollo,
  type EstadoPlan,
} from '../../api/planesDesarrollo'
import { ApiError } from '../../api/client'
import { notifyError, notifySuccess } from '../../lib/notify'
import { nivelProgreso, coloresNivel } from '../../lib/nivelProgreso'

const PAGE_SIZE = 5

const router = useRouter()
const planes = ref<PlanDesarrollo[]>([])
const loading = ref(true)
const filtro = ref<EstadoPlan | ''>('pendiente_aprobacion')
const page = ref(1)
const enviandoRecordatorio = reactive<Record<string, boolean>>({})

const estadoConfig: Record<
  EstadoPlan,
  { label: string; texto: string; bg: string; icono: 'borrador' | 'reloj' | 'check' | 'alerta' }
> = {
  sin_enviar: {
    label: 'Sin enviar',
    texto: 'text-[var(--color-ink)]/60',
    bg: 'bg-[var(--color-parchment)]',
    icono: 'borrador',
  },
  pendiente_aprobacion: {
    label: 'Pendiente de aprobación',
    texto: 'text-[var(--color-bronze)]',
    bg: 'bg-[color-mix(in_srgb,var(--color-bronze)_15%,white)]',
    icono: 'reloj',
  },
  aprobado: {
    label: 'Aprobado',
    texto: 'text-[var(--color-sage)]',
    bg: 'bg-[color-mix(in_srgb,var(--color-sage)_15%,white)]',
    icono: 'check',
  },
  cambios_solicitados: {
    label: 'Cambios solicitados',
    texto: 'text-[var(--color-danger)]',
    bg: 'bg-[color-mix(in_srgb,var(--color-danger)_15%,white)]',
    icono: 'alerta',
  },
}

// Se trae la lista completa una sola vez: el filtro y la regla de "pendientes siempre
// visibles" se resuelven en el cliente, sobre los mismos datos.
async function load() {
  loading.value = true
  planes.value = await listPlanes()
  loading.value = false
}

onMounted(load)

// Los planes pendientes de aprobación se muestran siempre, sin importar el filtro elegido —
// son los que más urge que el coach revise. Van primero, ordenados por más tiempo esperando.
const planesVisibles = computed(() => {
  const pendientes = planes.value.filter((p) => p.estado === 'pendiente_aprobacion')
  const pendienteIds = new Set(pendientes.map((p) => p.id))
  const filtrados = filtro.value ? planes.value.filter((p) => p.estado === filtro.value) : planes.value

  const pendientesOrdenados = [...pendientes].sort((a, b) => {
    const ta = a.enviadoEn ? new Date(a.enviadoEn).getTime() : 0
    const tb = b.enviadoEn ? new Date(b.enviadoEn).getTime() : 0
    return ta - tb
  })
  const resto = filtrados.filter((p) => !pendienteIds.has(p.id))

  return [...pendientesOrdenados, ...resto]
})

const planesPagina = computed(() =>
  planesVisibles.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE),
)

watch(filtro, () => {
  page.value = 1
})

function verDetalle(coacheeId: string) {
  void router.push({ name: 'coach-coachee-detail', params: { coacheeId }, query: { tab: 'plan' } })
}

function objetivosCount(p: PlanDesarrollo): number {
  return p.objetivos?.length ?? 0
}

function actividadesCompletadas(p: PlanDesarrollo): number {
  return p.actividades?.filter((a) => a.estado === 'completada').length ?? 0
}

function actividadesTotal(p: PlanDesarrollo): number {
  return p.actividades?.length ?? 0
}

function actividadesPorcentaje(p: PlanDesarrollo): number {
  const total = actividadesTotal(p)
  return total === 0 ? 0 : Math.round((actividadesCompletadas(p) / total) * 100)
}

function contactoLinea(p: PlanDesarrollo): string {
  const partes: string[] = []
  if (p.coachee?.user?.email) partes.push(p.coachee.user.email)
  if (p.coachee?.telefono) partes.push(p.coachee.telefono)
  partes.push(p.coachee?.empresa?.nombre ?? 'Independiente')
  return partes.join(' · ')
}

function diasDesde(fechaIso: string): number {
  return Math.floor((Date.now() - new Date(fechaIso).getTime()) / 86_400_000)
}

// Sólo tiene sentido mientras el coachee no ha enviado nada: cuenta desde que se creó su
// cuenta, no desde que se tocó el plan por última vez.
function textoSinEnviar(p: PlanDesarrollo): string | null {
  if (p.estado !== 'sin_enviar' || !p.coachee?.createdAt) return null
  const dias = diasDesde(p.coachee.createdAt)
  if (dias < 1) return null
  return `${dias} día${dias === 1 ? '' : 's'} sin enviar el plan`
}

// Cuenta desde el envío más reciente, no desde updatedAt (que se mueve aunque el plan siga
// pendiente, porque hábito/formación quedan siempre editables).
function textoPendiente(p: PlanDesarrollo): string | null {
  if (p.estado !== 'pendiente_aprobacion' || !p.enviadoEn) return null
  const dias = diasDesde(p.enviadoEn)
  return dias === 0 ? 'Enviado hoy' : `Esperando hace ${dias} día${dias === 1 ? '' : 's'}`
}

async function recordar(coacheeId: string) {
  enviandoRecordatorio[coacheeId] = true
  try {
    await enviarRecordatorio(coacheeId)
    enviandoRecordatorio[coacheeId] = false
    await notifySuccess('Recordatorio enviado', 'Se le avisó por correo al coachee.')
  } catch (err) {
    enviandoRecordatorio[coacheeId] = false
    await notifyError('No se pudo enviar el recordatorio', err instanceof ApiError ? err.message : undefined)
  }
}
</script>

<template>
  <AppShell>
    <h1 class="mb-4 font-[family-name:var(--font-heading)] text-xl font-semibold">
      Planes de desarrollo
    </h1>

    <select
      v-model="filtro"
      class="mb-4 rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
    >
      <option value="">
        Todos los estados
      </option>
      <option value="pendiente_aprobacion">
        Pendientes de aprobación
      </option>
      <option value="cambios_solicitados">
        Cambios solicitados
      </option>
      <option value="aprobado">
        Aprobados
      </option>
      <option value="sin_enviar">
        Sin enviar
      </option>
    </select>

    <div
      v-if="loading"
      class="text-sm text-[var(--color-ink)]/60"
    >
      Cargando…
    </div>
    <p
      v-else-if="planesVisibles.length === 0"
      class="text-sm text-[var(--color-ink)]/60"
    >
      No hay planes con este filtro.
    </p>
    <template v-else>
      <div class="mb-4 space-y-3">
        <div
          v-for="p in planesPagina"
          :key="p.id"
          role="button"
          tabindex="0"
          class="cursor-pointer rounded-2xl border border-[var(--color-line)] bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[var(--color-sage)] hover:shadow-md"
          @click="verDetalle(p.coacheeId)"
          @keyup.enter="verDetalle(p.coacheeId)"
        >
          <div class="mb-2 flex flex-wrap items-start justify-between gap-2">
            <div>
              <p class="font-medium">
                {{ p.coachee?.nombre ?? p.coacheeId }}
              </p>
              <p class="text-xs text-[var(--color-ink)]/50">
                {{ contactoLinea(p) }}
              </p>
            </div>
            <div class="flex shrink-0 flex-col items-end gap-1">
              <span
                class="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
                :class="[estadoConfig[p.estado].texto, estadoConfig[p.estado].bg]"
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <template v-if="estadoConfig[p.estado].icono === 'borrador'">
                    <path d="M6 3h9l4 4v14H6z" /><path d="M15 3v4h4" />
                  </template>
                  <template v-else-if="estadoConfig[p.estado].icono === 'reloj'">
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                    /><path d="M12 7v5l3 3" />
                  </template>
                  <template v-else-if="estadoConfig[p.estado].icono === 'check'">
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                    /><path d="M8 12l3 3 5-6" />
                  </template>
                  <template v-else>
                    <path d="M12 3l10 18H2z" /><path d="M12 9v5" /><path d="M12 17h.01" />
                  </template>
                </svg>
                {{ estadoConfig[p.estado].label }}
              </span>
              <span
                v-if="textoPendiente(p)"
                class="text-[11px] text-[var(--color-bronze)]"
              >
                {{ textoPendiente(p) }}
              </span>
            </div>
          </div>

          <div
            v-if="textoSinEnviar(p)"
            class="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[color-mix(in_srgb,var(--color-danger)_10%,white)] px-3 py-2"
          >
            <span class="flex items-center gap-1.5 text-xs font-medium text-[var(--color-danger)]">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="shrink-0"
              ><path d="M12 3l10 18H2z" /><path d="M12 9v5" /><path d="M12 17h.01" /></svg>
              {{ textoSinEnviar(p) }}
            </span>
            <button
              type="button"
              class="flex shrink-0 items-center gap-1.5 rounded-lg bg-[var(--color-danger)] px-2.5 py-1 text-xs font-medium text-white disabled:opacity-60"
              :disabled="enviandoRecordatorio[p.coacheeId]"
              @click.stop="recordar(p.coacheeId)"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="shrink-0"
              ><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" /></svg>
              {{ enviandoRecordatorio[p.coacheeId] ? 'Enviando…' : 'Enviar recordatorio' }}
            </button>
          </div>

          <p
            v-if="p.objetivoGeneral"
            class="mb-3 line-clamp-2 text-sm text-[var(--color-ink)]/70"
          >
            {{ p.objetivoGeneral }}
          </p>
          <p
            v-else
            class="mb-3 text-sm text-[var(--color-ink)]/40 italic"
          >
            Sin objetivo general definido todavía.
          </p>

          <div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[var(--color-ink)]/60">
            <span
              v-if="p.competencia"
              class="flex items-center gap-1"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="shrink-0"
              ><circle
                cx="12"
                cy="12"
                r="9"
              /><circle
                cx="12"
                cy="12"
                r="5"
              /><circle
                cx="12"
                cy="12"
                r="1"
              /></svg>
              {{ p.competencia.nombre }}
              <span v-if="p.nivelActual != null || p.nivelObjetivo != null">
                · Nivel {{ p.nivelActual ?? '—' }} → {{ p.nivelObjetivo ?? '—' }}
              </span>
            </span>

            <span class="flex items-center gap-1">
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="shrink-0"
              ><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
              {{ objetivosCount(p) }} objetivo{{ objetivosCount(p) === 1 ? '' : 's' }}
            </span>

            <span
              v-if="actividadesTotal(p) > 0"
              class="flex items-center gap-1.5"
            >
              {{ actividadesCompletadas(p) }}/{{ actividadesTotal(p) }} actividades
              <span
                class="h-1.5 w-16 overflow-hidden rounded-full"
                :style="{ backgroundColor: coloresNivel[nivelProgreso(actividadesPorcentaje(p))].suave }"
              >
                <span
                  class="block h-full rounded-full"
                  :style="{
                    width: `${actividadesPorcentaje(p)}%`,
                    backgroundColor: coloresNivel[nivelProgreso(actividadesPorcentaje(p))].fuerte,
                  }"
                />
              </span>
            </span>

            <span
              v-if="p.plazo"
              class="flex items-center gap-1"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="shrink-0"
              ><rect
                x="3"
                y="5"
                width="18"
                height="16"
                rx="2"
              /><path d="M3 10h18" /><path d="M8 3v4" /><path d="M16 3v4" /></svg>
              Plazo: {{ p.plazo }}
            </span>

            <span class="ml-auto shrink-0 text-[var(--color-ink)]/40">
              Actualizado el {{ new Date(p.updatedAt).toLocaleDateString('es-CL') }}
            </span>
          </div>
        </div>
      </div>

      <Pagination
        :page="page"
        :total-items="planesVisibles.length"
        :page-size="PAGE_SIZE"
        @update:page="page = $event"
      />
    </template>
  </AppShell>
</template>
