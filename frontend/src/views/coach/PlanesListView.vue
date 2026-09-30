<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '../../components/AppShell.vue'
import Pagination from '../../components/Pagination.vue'
import SkeletonBlock from '../../components/SkeletonBlock.vue'
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
// "Todos los estados" por defecto: si se parte filtrado a cambios_solicitados y no hay
// ninguno en ese estado (el caso normal, no es lo más común), la vista se ve vacía aunque
// existan planes sin enviar/aprobados que sí necesitan atención del coach. Los planes con
// cambios solicitados igual quedan siempre fijados primero (ver planesVisibles), así que no
// se pierde la prioridad — sólo se deja de esconder todo lo demás por defecto.
const filtro = ref<EstadoPlan | ''>('')
const page = ref(1)
const enviandoRecordatorio = reactive<Record<string, boolean>>({})

const estadoConfig: Record<
  EstadoPlan,
  { label: string; badge: string; icono: 'borrador' | 'reloj' | 'check' | 'alerta' }
> = {
  sin_enviar: {
    label: 'Sin enviar',
    badge: 'bg-[var(--color-bronze)]/10 text-[var(--color-bronze)] border border-[var(--color-bronze)]/20',
    icono: 'borrador',
  },
  pendiente_aprobacion: {
    label: 'Pendiente de aprobación',
    badge: 'bg-[var(--color-saltup)]/10 text-[var(--color-saltup)] border border-[var(--color-saltup)]/20',
    icono: 'reloj',
  },
  aprobado: {
    label: 'Aprobado',
    badge: 'bg-[var(--color-sage)]/10 text-[var(--color-sage)] border border-[var(--color-sage)]/20',
    icono: 'check',
  },
  cambios_solicitados: {
    label: 'Cambios solicitados',
    badge: 'bg-[var(--color-danger)]/10 text-[var(--color-danger)] border border-[var(--color-danger)]/20',
    icono: 'alerta',
  },
}

// Píldoras de filtro rápido con conteo: el <select> de abajo sigue existiendo (oculto
// visualmente) para no romper los tests que interactúan con él, pero la UI real que ve
// el coach son estas píldoras — ambas leen y escriben el mismo `filtro`.
const filtrosPildora: Array<{ value: EstadoPlan | ''; label: string }> = [
  { value: '', label: 'Todos' },
  { value: 'cambios_solicitados', label: 'Cambios solicitados' },
  { value: 'aprobado', label: 'Aprobados' },
  { value: 'sin_enviar', label: 'Sin enviar' },
]

function contarEstado(estado: EstadoPlan | ''): number {
  return estado === '' ? planes.value.length : planes.value.filter((p) => p.estado === estado).length
}

function iniciales(nombre?: string | null): string {
  if (!nombre) return '?'
  const partes = nombre.trim().split(/\s+/)
  const primera = partes[0]?.[0] ?? ''
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : ''
  return (primera + ultima).toUpperCase()
}

// Se trae la lista completa una sola vez: el filtro y la regla de "pendientes siempre
// visibles" se resuelven en el cliente, sobre los mismos datos.
async function load() {
  loading.value = true
  planes.value = await listPlanes()
  loading.value = false
}

onMounted(load)

// Los planes con cambios solicitados se muestran siempre, sin importar el filtro elegido —
// son los que más urge que el coach revise (el coachee no ha respondido a su comentario).
// Van primero, ordenados por más tiempo esperando.
const planesVisibles = computed(() => {
  const pendientes = planes.value.filter((p) => p.estado === 'cambios_solicitados')
  const pendienteIds = new Set(pendientes.map((p) => p.id))
  const filtrados = filtro.value ? planes.value.filter((p) => p.estado === filtro.value) : planes.value

  const pendientesOrdenados = [...pendientes].sort((a, b) => {
    const ta = new Date(a.updatedAt).getTime()
    const tb = new Date(b.updatedAt).getTime()
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

// Sin contador de días: no hay un timestamp de "cuándo se pidieron los cambios" (el plan
// no se bloquea, así que updatedAt se mueve con cualquier edición de hábito/formación y
// no serviría como proxy confiable).
function textoCambiosSolicitados(p: PlanDesarrollo): string | null {
  return p.estado === 'cambios_solicitados' ? 'Esperando respuesta del coachee' : null
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

    <!-- Select nativo: accesible para lectores de pantalla y teclado, pero visualmente
         reemplazado por las píldoras de abajo (mismo v-model, misma fuente de verdad). -->
    <select
      v-model="filtro"
      class="sr-only"
    >
      <option value="">
        Todos los estados
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

    <div class="mb-4 flex flex-wrap gap-2">
      <button
        v-for="f in filtrosPildora"
        :key="f.value"
        type="button"
        class="rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors"
        :class="filtro === f.value
          ? 'border-[var(--color-ink)] bg-[var(--color-ink)] text-white'
          : 'border-[var(--color-line)] bg-white text-[var(--color-ink)]/70 hover:bg-[var(--color-ivory)]'"
        @click="filtro = f.value"
      >
        {{ f.label }} ({{ contarEstado(f.value) }})
      </button>
    </div>

    <SkeletonBlock v-if="loading" />
    <p
      v-else-if="planesVisibles.length === 0"
      class="text-sm text-[var(--color-ink)]/60"
    >
      {{ planes.length === 0 ? 'Aún no hay planes de desarrollo creados.' : 'No hay planes con este filtro.' }}
    </p>
    <template v-else>
      <div class="mb-4 divide-y divide-[var(--color-line)] rounded-2xl border border-[var(--color-line)] bg-white shadow-sm">
        <div
          v-for="p in planesPagina"
          :key="p.id"
          role="button"
          tabindex="0"
          class="flex cursor-pointer flex-col gap-3 p-5 transition-colors hover:bg-[var(--color-ivory)]/50"
          @click="verDetalle(p.coacheeId)"
          @keyup.enter="verDetalle(p.coacheeId)"
        >
          <div class="flex flex-wrap items-start gap-3">
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--color-line)] bg-[var(--color-parchment)] font-[family-name:var(--font-mono)] text-xs font-semibold text-[var(--color-ink)]"
            >
              {{ iniciales(p.coachee?.nombre) }}
            </div>

            <div class="min-w-0 flex-1">
              <p class="font-[family-name:var(--font-heading)] font-semibold text-[var(--color-ink)]">
                {{ p.coachee?.nombre ?? p.coacheeId }}
              </p>
              <p class="truncate font-[family-name:var(--font-mono)] text-xs text-[var(--color-ink)]/50">
                {{ contactoLinea(p) }}
              </p>
            </div>

            <div class="flex shrink-0 flex-col items-end gap-1">
              <span
                class="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                :class="estadoConfig[p.estado].badge"
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
                v-if="textoCambiosSolicitados(p)"
                class="text-[11px] text-[var(--color-danger)]"
              >
                {{ textoCambiosSolicitados(p) }}
              </span>
              <span class="text-[11px] text-[var(--color-ink)]/40">
                Actualizado el {{ new Date(p.updatedAt).toLocaleDateString('es-CL') }}
              </span>
            </div>
          </div>

          <div
            v-if="textoSinEnviar(p)"
            class="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/10 p-2.5 text-xs font-medium text-[var(--color-danger)]"
          >
            <span class="flex items-center gap-1.5">
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
            class="line-clamp-2 text-sm text-[var(--color-ink)]/70"
          >
            {{ p.objetivoGeneral }}
          </p>
          <p
            v-else
            class="text-sm italic text-[var(--color-ink)]/40"
          >
            Sin objetivo general definido todavía.
          </p>

          <div class="flex flex-wrap items-center gap-2 text-xs">
            <span
              v-if="p.competencia"
              class="flex items-center gap-1 rounded-full border border-[var(--color-saltup)]/20 bg-[var(--color-ivory)] px-2.5 py-1 font-medium text-[var(--color-saltup)]"
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

            <span class="flex items-center gap-1 rounded-full border border-[var(--color-line)] bg-[var(--color-parchment)] px-2.5 py-1 text-[var(--color-ink)]/70">
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
              class="flex items-center gap-1.5 rounded-full border border-[var(--color-line)] bg-[var(--color-parchment)] px-2.5 py-1 text-[var(--color-ink)]/70"
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
              class="flex items-center gap-1 rounded-full border border-[var(--color-line)] bg-[var(--color-parchment)] px-2.5 py-1 text-[var(--color-ink)]/70"
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
