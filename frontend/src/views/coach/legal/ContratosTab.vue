<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  getResumenLegal,
  listarAdicionales,
  type ResumenLegal,
  type DocumentoAdicionalLegal,
  type EmpresaLegal,
  type IndependienteLegal,
  type DocumentoLegal,
} from '../../../api/legal'
import {
  listCoachees,
  setConsentimiento,
  solicitarConsentimiento,
  type CoacheeListItem,
} from '../../../api/coachees'
import { ApiError } from '../../../api/client'
import { estadoVisual, alertasLegales } from '../../../lib/legalFormat'
import { notifySuccess, notifyError } from '../../../lib/notify'
import DocumentoLegalSlot from '../../../components/DocumentoLegalSlot.vue'
import OtrosDocumentosLegal from '../../../components/OtrosDocumentosLegal.vue'
import ConsentimientoInformado from '../../../components/ConsentimientoInformado.vue'
import Pagination from '../../../components/Pagination.vue'
import NavIcon from '../../../components/NavIcon.vue'
import SkeletonBlock from '../../../components/SkeletonBlock.vue'
import AvanceFirmas from '../../../components/AvanceFirmas.vue'
import { iniciales } from '../../../lib/avatar'

type ItemEmpresa = EmpresaLegal & { tipo: 'empresa' }
type ItemIndependiente = IndependienteLegal & { tipo: 'independiente' }
type ItemLegal = ItemEmpresa | ItemIndependiente

const PAGE_SIZE = 2

const loading = ref(true)
const resumen = ref<ResumenLegal>({ empresas: [], independientes: [] })
const coachees = ref<CoacheeListItem[]>([])
const adicionales = ref<DocumentoAdicionalLegal[]>([])
const error = ref<string | null>(null)
const page = ref(1)

const expandidos = ref<Set<string>>(new Set())

function coacheesDeEmpresa(empresaId: string): CoacheeListItem[] {
  return coachees.value.filter((c) => c.empresaId === empresaId)
}

function adicionalesDeEmpresa(empresaId: string): DocumentoAdicionalLegal[] {
  return adicionales.value.filter((d) => d.empresaId === empresaId)
}

function adicionalesDeCoachee(coacheeId: string): DocumentoAdicionalLegal[] {
  return adicionales.value.filter((d) => d.coacheeId === coacheeId)
}

/** Contrato o NDA sin firmar (o vencido) — es la relación que todavía requiere que el coach haga algo. */
function necesitaAccion(item: { contrato: DocumentoLegal; nda: DocumentoLegal }): boolean {
  return estadoVisual(item.contrato) !== 'firmado' || estadoVisual(item.nda) !== 'firmado'
}

function claveItem(item: ItemLegal): string {
  return item.tipo === 'empresa' ? `empresa-${item.empresaId}` : `coachee-${item.coacheeId}`
}

/**
 * Orden: primero las relaciones que necesitan acción (contrato/NDA pendiente o vencido), de más
 * antigua a más reciente — la que lleva más tiempo esperando papeleo tiene prioridad. Las que ya
 * están al día (firmadas y vigentes) quedan al final, sin competir por la atención del coach.
 */
const itemsOrdenados = computed<ItemLegal[]>(() => {
  const empresas: ItemLegal[] = resumen.value.empresas.map((e) => ({ tipo: 'empresa', ...e }))
  const independientes: ItemLegal[] = resumen.value.independientes.map((i) => ({
    tipo: 'independiente',
    ...i,
  }))
  return [...empresas, ...independientes].sort((a, b) => {
    const prioridadA = necesitaAccion(a) ? 0 : 1
    const prioridadB = necesitaAccion(b) ? 0 : 1
    if (prioridadA !== prioridadB) return prioridadA - prioridadB
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(itemsOrdenados.value.length / PAGE_SIZE)))
watch(totalPages, (tp) => {
  if (page.value > tp) page.value = tp
})

const itemsPagina = computed(() =>
  itemsOrdenados.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE),
)

const alertas = computed(() => alertasLegales(resumen.value))

const resumenAlertas = computed(() => [
  { etiqueta: 'contratos pendientes', singular: 'contrato pendiente', valor: alertas.value.contratosPendientes, color: 'text-[var(--color-danger)]' },
  { etiqueta: 'NDA pendientes', singular: 'NDA pendiente', valor: alertas.value.ndaPendientes, color: 'text-[var(--color-danger)]' },
  { etiqueta: 'documentos vencidos', singular: 'documento vencido', valor: alertas.value.vencidos, color: 'text-[var(--color-bronze)]' },
  { etiqueta: 'coachees sin consentimiento', singular: 'coachee sin consentimiento', valor: alertas.value.sinConsentimiento, color: 'text-[var(--color-danger)]' },
])

const hayAlertas = computed(
  () =>
    alertas.value.contratosPendientes > 0 ||
    alertas.value.ndaPendientes > 0 ||
    alertas.value.vencidos > 0 ||
    alertas.value.sinConsentimiento > 0,
)

async function cargarResumen() {
  resumen.value = await getResumenLegal()
}

async function cargarAdicionales() {
  adicionales.value = await listarAdicionales()
}

async function load() {
  loading.value = true
  const [, co] = await Promise.all([cargarResumen(), listCoachees(), cargarAdicionales()])
  coachees.value = co
  loading.value = false
}

onMounted(load)

function toggleExpandido(clave: string) {
  const next = new Set(expandidos.value)
  if (next.has(clave)) next.delete(clave)
  else next.add(clave)
  expandidos.value = next
}

async function toggleConsentimiento(coacheeId: string, informado: boolean) {
  try {
    const actualizado = await setConsentimiento(coacheeId, informado)
    coachees.value = coachees.value.map((c) => (c.id === coacheeId ? actualizado : c))
    await cargarResumen()
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'No se pudo actualizar el consentimiento.'
  }
}

async function enviarSolicitudConsentimiento(coacheeId: string, nombre: string) {
  try {
    await solicitarConsentimiento(coacheeId)
    await notifySuccess('Solicitud enviada', `Le enviamos un correo a ${nombre} para que confirme su consentimiento.`)
  } catch (err) {
    const mensaje = err instanceof ApiError ? err.message : 'No se pudo enviar la solicitud.'
    await notifyError('No se pudo enviar', mensaje)
  }
}
</script>

<template>
  <SkeletonBlock v-if="loading" />
  <div
    v-else
    class="space-y-4"
  >
    <p
      v-if="error"
      class="text-sm text-[var(--color-danger)]"
    >
      {{ error }}
    </p>

    <div class="flex items-start gap-2.5 text-sm text-[var(--color-muted)]">
      <span
        class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-ink)]/5 text-xs font-semibold text-[var(--color-muted)]"
        aria-hidden="true"
      >i</span>
      <p class="max-w-3xl">
        Contrato de servicio, NDA y carta de invitación por cada empresa y coachee independiente,
        más cualquier otro respaldo (correos, addendums). El consentimiento informado es un
        trámite personal, independiente del Contrato/NDA — puede estar firmado aunque el papeleo
        contractual siga pendiente, o al revés.
      </p>
    </div>

    <!-- Resumen: cifras grandes con su etiqueta, sin chips — mismo lenguaje que los KPIs. -->
    <div
      v-if="hayAlertas"
      class="grid grid-cols-2 gap-3 sm:grid-cols-4"
    >
      <div
        v-for="a in resumenAlertas"
        :key="a.etiqueta"
        class="rounded-2xl border border-[var(--color-line)] bg-white px-4 py-3"
      >
        <p
          class="font-[family-name:var(--font-mono)] text-2xl font-semibold"
          :class="a.valor === 0 ? 'text-[var(--color-subtle)]' : a.color"
        >
          {{ a.valor }}
        </p>
        <p class="text-xs text-[var(--color-muted)]">
          {{ a.valor === 1 ? a.singular : a.etiqueta }}
        </p>
      </div>
    </div>
    <p
      v-else
      class="flex items-center gap-2 rounded-2xl bg-[var(--color-sage)]/10 px-4 py-3 text-sm font-medium text-[var(--color-sage)]"
    >
      ✓ Todo al día — sin documentos pendientes ni vencidos.
    </p>

    <p
      v-if="itemsOrdenados.length === 0"
      class="text-sm text-[var(--color-muted)]"
    >
      Todavía no hay empresas ni coachees registrados.
    </p>

    <div
      v-for="item in itemsPagina"
      :key="claveItem(item)"
      class="rounded-2xl border border-[var(--color-line)] bg-white p-5 shadow-sm"
    >
      <template v-if="item.tipo === 'empresa'">
        <div class="mb-4 flex items-center gap-3">
          <span
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-sage)]/12 text-[var(--color-sage)]"
            aria-hidden="true"
          >
            <NavIcon
              name="empresas"
              :size="18"
            />
          </span>
          <div class="min-w-0 flex-1">
            <h2 class="font-[family-name:var(--font-heading)] font-semibold">
              {{ item.nombre }}
            </h2>
            <p class="text-xs text-[var(--color-muted)]">
              Empresa
            </p>
          </div>
          <AvanceFirmas :item="item" />
        </div>

        <div class="mb-4 grid gap-4 border-y border-[var(--color-line)]/70 py-4 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-[var(--color-line)]/70 [&>*]:sm:px-4 [&>*:first-child]:sm:pl-0">
          <DocumentoLegalSlot
            :target="{ empresaId: item.empresaId }"
            tipo="contrato"
            label="Contrato"
            :doc="item.contrato"
            :nombre-para-archivo="item.nombre"
            @actualizado="cargarResumen"
          />
          <DocumentoLegalSlot
            :target="{ empresaId: item.empresaId }"
            tipo="nda"
            label="NDA"
            :doc="item.nda"
            :nombre-para-archivo="item.nombre"
            @actualizado="cargarResumen"
          />
          <DocumentoLegalSlot
            :target="{ empresaId: item.empresaId }"
            tipo="carta_invitacion"
            label="Carta de invitación"
            :doc="item.cartaInvitacion"
            :nombre-para-archivo="item.nombre"
            @actualizado="cargarResumen"
          />
        </div>

        <button
          type="button"
          class="flex w-full items-center gap-3 rounded-xl px-1 py-1.5 text-left text-sm transition-colors hover:bg-[var(--color-parchment)]/50"
          @click="toggleExpandido(item.empresaId)"
        >
          <NavIcon
            name="coachees"
            :size="16"
            class="shrink-0 text-[var(--color-muted)]"
          />
          <span class="flex-1">
            <span class="font-medium">{{ item.coacheesConConsentimiento }} de {{ item.coacheesTotal }} coachees con consentimiento informado firmado</span>
            <span class="mt-1 block h-1 w-40 overflow-hidden rounded-full bg-[var(--color-line)]">
              <span
                class="block h-full rounded-full bg-[var(--color-sage)]"
                :style="{ width: `${item.coacheesTotal ? (item.coacheesConConsentimiento / item.coacheesTotal) * 100 : 0}%` }"
              />
            </span>
          </span>
          <NavIcon
            name="chevron"
            :size="16"
            class="shrink-0 text-[var(--color-muted)] transition-transform"
            :class="expandidos.has(item.empresaId) ? '-rotate-90' : 'rotate-90'"
          />
        </button>
        <ul
          v-if="expandidos.has(item.empresaId)"
          class="mt-1 space-y-1.5 pl-8 text-sm"
        >
          <li
            v-for="c in coacheesDeEmpresa(item.empresaId)"
            :key="c.id"
            class="flex items-center gap-2"
          >
            <button
              type="button"
              class="flex h-4 w-4 items-center justify-center rounded-full text-xs"
              :class="c.consentimientoInformado
                ? 'bg-[var(--color-sage)] text-white'
                : 'border border-[var(--color-line)] text-transparent'"
              @click="toggleConsentimiento(c.id, !c.consentimientoInformado)"
            >
              ✓
            </button>
            <span class="flex-1">{{ c.nombre }}</span>
            <button
              type="button"
              class="text-[var(--color-saltup)] hover:underline"
              title="Enviar solicitud de consentimiento por correo"
              @click="enviarSolicitudConsentimiento(c.id, c.nombre)"
            >
              <NavIcon
                name="correo"
                :size="14"
              />
            </button>
          </li>
        </ul>

        <div class="mt-2">
          <OtrosDocumentosLegal
            :target="{ empresaId: item.empresaId }"
            :documentos="adicionalesDeEmpresa(item.empresaId)"
            @cambio="cargarAdicionales"
          />
        </div>
      </template>

      <template v-else>
        <div class="mb-4 flex items-center gap-3">
          <span
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-ink)] text-xs font-semibold text-[var(--color-parchment)]"
            aria-hidden="true"
          >
            {{ iniciales(item.nombre) }}
          </span>
          <div class="min-w-0 flex-1">
            <h3 class="font-[family-name:var(--font-heading)] font-semibold">
              {{ item.nombre }}
            </h3>
            <p class="text-xs text-[var(--color-muted)]">
              Independiente
            </p>
          </div>
          <AvanceFirmas :item="item" />
        </div>

        <div class="mb-4 grid gap-4 border-y border-[var(--color-line)]/70 py-4 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-[var(--color-line)]/70 [&>*]:sm:px-4 [&>*:first-child]:sm:pl-0">
          <DocumentoLegalSlot
            :target="{ coacheeId: item.coacheeId }"
            tipo="contrato"
            label="Contrato"
            :doc="item.contrato"
            :nombre-para-archivo="item.nombre"
            @actualizado="cargarResumen"
          />
          <DocumentoLegalSlot
            :target="{ coacheeId: item.coacheeId }"
            tipo="nda"
            label="NDA"
            :doc="item.nda"
            :nombre-para-archivo="item.nombre"
            @actualizado="cargarResumen"
          />
          <DocumentoLegalSlot
            :target="{ coacheeId: item.coacheeId }"
            tipo="carta_invitacion"
            label="Carta de invitación"
            :doc="item.cartaInvitacion"
            :nombre-para-archivo="item.nombre"
            @actualizado="cargarResumen"
          />
        </div>

        <ConsentimientoInformado
          :coachee-id="item.coacheeId"
          :nombre="item.nombre"
          :informado="item.consentimientoInformado"
          @actualizado="cargarResumen"
        />

        <div class="mt-2">
          <OtrosDocumentosLegal
            :target="{ coacheeId: item.coacheeId }"
            :documentos="adicionalesDeCoachee(item.coacheeId)"
            @cambio="cargarAdicionales"
          />
        </div>
      </template>
    </div>

    <Pagination
      v-if="itemsOrdenados.length > 0"
      :page="page"
      :total-items="itemsOrdenados.length"
      :page-size="PAGE_SIZE"
      @update:page="page = $event"
    />
  </div>
</template>
