<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '../../components/AppShell.vue'
import Pagination from '../../components/Pagination.vue'
import TabBar from '../../components/TabBar.vue'
import NavIcon from '../../components/NavIcon.vue'
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

// `franja` = la barra de color a la izquierda de la tarjeta y el punto junto al estado.
const estadoConfig: Record<EstadoPlan, { label: string; texto: string; franja: string }> = {
  sin_enviar: { label: 'Sin enviar', texto: 'text-[var(--color-bronze)]', franja: 'bg-[var(--color-bronze)]' },
  pendiente_aprobacion: { label: 'Pendiente de aprobación', texto: 'text-[var(--color-saltup-ink)]', franja: 'bg-[var(--color-saltup)]' },
  aprobado: { label: 'Aprobado', texto: 'text-[var(--color-sage)]', franja: 'bg-[var(--color-sage)]' },
  cambios_solicitados: { label: 'Cambios solicitados', texto: 'text-[var(--color-danger)]', franja: 'bg-[var(--color-danger)]' },
}

// Pestañas de filtro con conteo (TabBar compartido, mismo estilo que Negocio/Legal): el
// <select> de abajo sigue existiendo (oculto visualmente) para lectores de pantalla y los
// tests — ambos leen y escriben el mismo `filtro`.
const tabsFiltro = computed(() =>
  ([
    { key: '', label: 'Todos', icon: 'planes' },
    { key: 'cambios_solicitados', label: 'Cambios solicitados', icon: 'pizarra' },
    { key: 'aprobado', label: 'Aprobados', icon: 'trofeo' },
    { key: 'sin_enviar', label: 'Sin enviar', icon: 'diario' },
  ] as Array<{ key: EstadoPlan | ''; label: string; icon: string }>).map((t) => ({ ...t, badge: contarEstado(t.key) })),
)

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
    <h1 class="font-[family-name:var(--font-heading)] text-xl font-semibold">
      Planes de desarrollo
    </h1>
    <p class="mb-4 text-sm text-[var(--color-muted)]">
      En qué va el plan de cada coachee y quién necesita un empujón.
    </p>

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

    <TabBar
      v-model="filtro"
      class="mb-5"
      :tabs="tabsFiltro"
    />

    <SkeletonBlock v-if="loading" />
    <p
      v-else-if="planesVisibles.length === 0"
      class="rounded-2xl border border-dashed border-[var(--color-line)] bg-white/60 px-5 py-10 text-center text-sm text-[var(--color-muted)]"
    >
      {{ planes.length === 0 ? 'Aún no hay planes de desarrollo creados.' : 'No hay planes con este filtro.' }}
    </p>
    <template v-else>
      <!-- Una tarjeta por plan (antes: un solo bloque dividido + banner rojo + 4 píldoras con
           borde). Ahora: franja de color a la izquierda según el estado, la alerta como una
           línea de texto con su acción, el objetivo como cita, y los datos del plan como texto
           con íconos — sin cajas dentro de la tarjeta. Pedido del usuario 2026-10-11. -->
      <ul class="mb-4 space-y-3">
        <li
          v-for="p in planesPagina"
          :key="p.id"
          role="button"
          tabindex="0"
          class="group relative cursor-pointer overflow-hidden rounded-2xl border border-[var(--color-line)] bg-white p-5 pl-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          @click="verDetalle(p.coacheeId)"
          @keyup.enter="verDetalle(p.coacheeId)"
        >
          <span
            class="absolute inset-y-0 left-0 w-1"
            :class="estadoConfig[p.estado].franja"
            aria-hidden="true"
          />

          <div class="flex items-start gap-3">
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-semibold text-[var(--color-on-primary)]"
              aria-hidden="true"
            >
              {{ iniciales(p.coachee?.nombre) }}
            </div>

            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <p class="font-[family-name:var(--font-heading)] font-semibold text-[var(--color-ink)]">
                  {{ p.coachee?.nombre ?? p.coacheeId }}
                </p>
                <span
                  class="inline-flex items-center gap-1.5 text-xs font-medium"
                  :class="estadoConfig[p.estado].texto"
                >
                  <span
                    class="h-1.5 w-1.5 rounded-full"
                    :class="estadoConfig[p.estado].franja"
                    aria-hidden="true"
                  />
                  {{ estadoConfig[p.estado].label }}
                </span>
              </div>
              <p class="truncate text-xs text-[var(--color-muted)]">
                {{ contactoLinea(p) }}
              </p>
            </div>

            <span class="hidden shrink-0 text-xs text-[var(--color-muted)] sm:block">
              Actualizado el {{ new Date(p.updatedAt).toLocaleDateString('es-CL') }}
            </span>
          </div>

          <div
            v-if="textoSinEnviar(p) || textoCambiosSolicitados(p)"
            class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs"
          >
            <span
              v-if="textoSinEnviar(p)"
              class="inline-flex items-center gap-1.5 font-medium text-[var(--color-danger)]"
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
              ><circle
                cx="12"
                cy="12"
                r="9"
              /><path d="M12 7v5l3 3" /></svg>
              {{ textoSinEnviar(p) }}
            </span>
            <button
              v-if="textoSinEnviar(p)"
              type="button"
              class="inline-flex items-center gap-1 rounded-full bg-[var(--color-danger)]/10 px-2.5 py-0.5 font-medium text-[var(--color-danger)] transition-colors hover:bg-[var(--color-danger)]/20 disabled:opacity-60"
              :disabled="enviandoRecordatorio[p.coacheeId]"
              @click.stop="recordar(p.coacheeId)"
            >
              <NavIcon
                name="correo"
                :size="12"
              />
              {{ enviandoRecordatorio[p.coacheeId] ? 'Enviando…' : 'Enviar recordatorio' }}
            </button>
            <span
              v-if="textoCambiosSolicitados(p)"
              class="inline-flex items-center gap-1.5 font-medium text-[var(--color-danger)]"
            >
              {{ textoCambiosSolicitados(p) }}
            </span>
          </div>

          <p
            v-if="p.objetivoGeneral"
            class="mt-3 line-clamp-2 border-l-2 border-[var(--color-sage)]/50 pl-3 text-sm text-[var(--color-ink)]/75"
          >
            {{ p.objetivoGeneral }}
          </p>
          <p
            v-else
            class="mt-3 text-sm italic text-[var(--color-muted)]"
          >
            Sin objetivo general definido todavía.
          </p>

          <div class="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[var(--color-muted)]">
            <span
              v-if="p.competencia"
              class="inline-flex items-center gap-1.5 font-medium text-[var(--color-saltup-ink)]"
            >
              <NavIcon
                name="objetivo"
                :size="14"
              />
              {{ p.competencia.nombre }}
              <span
                v-if="p.trabajarNiveles && (p.nivelActual != null || p.nivelObjetivo != null)"
                class="font-normal text-[var(--color-muted)]"
              >
                · Nivel {{ p.nivelActual ?? '—' }} → {{ p.nivelObjetivo ?? '—' }}
              </span>
            </span>

            <span class="inline-flex items-center gap-1.5">
              <NavIcon
                name="lista"
                :size="14"
              />
              {{ objetivosCount(p) }} objetivo{{ objetivosCount(p) === 1 ? '' : 's' }}
            </span>

            <span
              v-if="actividadesTotal(p) > 0"
              class="inline-flex items-center gap-2"
            >
              {{ actividadesCompletadas(p) }}/{{ actividadesTotal(p) }} actividades
              <span
                class="h-1.5 w-20 overflow-hidden rounded-full"
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
              class="inline-flex items-center gap-1.5"
            >
              <NavIcon
                name="sesiones"
                :size="14"
              />
              Plazo: {{ p.plazo }}
            </span>

            <span class="ml-auto hidden items-center gap-1 font-medium text-[var(--color-sage)] opacity-0 transition-opacity group-hover:opacity-100 sm:inline-flex">
              Ver plan <span aria-hidden="true">→</span>
            </span>
          </div>
        </li>
      </ul>

      <Pagination
        :page="page"
        :total-items="planesVisibles.length"
        :page-size="PAGE_SIZE"
        @update:page="page = $event"
      />
    </template>
  </AppShell>
</template>
