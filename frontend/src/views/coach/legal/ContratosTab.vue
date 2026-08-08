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
  <div
    v-if="loading"
    class="text-sm text-[var(--color-ink)]/60"
  >
    Cargando…
  </div>
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

    <div class="rounded-2xl border border-[var(--color-line)] bg-[var(--color-parchment)]/40 p-4">
      <p class="text-sm text-[var(--color-ink)]/70">
        Esta sección respalda la relación con cada empresa cliente y con cada coachee
        independiente: el contrato de servicio, el acuerdo de confidencialidad (NDA), el
        consentimiento informado, y cualquier otro documento de respaldo (correos, addendums). El
        consentimiento informado es un trámite personal, independiente del Contrato/NDA — puede
        estar firmado aunque el papeleo contractual siga pendiente, o al revés.
      </p>
    </div>

    <div
      v-if="hayAlertas"
      class="flex flex-wrap gap-2"
    >
      <span
        v-if="alertas.contratosPendientes > 0"
        class="rounded-full bg-[var(--color-danger)]/15 px-3 py-1 text-xs text-[var(--color-danger)]"
      >
        ⚠ {{ alertas.contratosPendientes }} {{ alertas.contratosPendientes === 1 ? 'contrato pendiente' : 'contratos pendientes' }}
      </span>
      <span
        v-if="alertas.ndaPendientes > 0"
        class="rounded-full bg-[var(--color-danger)]/15 px-3 py-1 text-xs text-[var(--color-danger)]"
      >
        ⚠ {{ alertas.ndaPendientes }} {{ alertas.ndaPendientes === 1 ? 'NDA pendiente' : 'NDA pendientes' }}
      </span>
      <span
        v-if="alertas.vencidos > 0"
        class="rounded-full bg-[var(--color-bronze)]/20 px-3 py-1 text-xs text-[var(--color-bronze)]"
      >
        ⚠ {{ alertas.vencidos }} {{ alertas.vencidos === 1 ? 'documento vencido' : 'documentos vencidos' }}
      </span>
      <span
        v-if="alertas.sinConsentimiento > 0"
        class="rounded-full bg-[var(--color-danger)]/15 px-3 py-1 text-xs text-[var(--color-danger)]"
      >
        ⚠ {{ alertas.sinConsentimiento }} {{ alertas.sinConsentimiento === 1 ? 'coachee sin consentimiento' : 'coachees sin consentimiento' }}
      </span>
    </div>
    <p
      v-else
      class="text-xs text-[var(--color-sage)]"
    >
      ✓ Todo al día — sin documentos pendientes ni vencidos.
    </p>

    <p
      v-if="itemsOrdenados.length === 0"
      class="text-sm text-[var(--color-ink)]/60"
    >
      Todavía no hay empresas ni coachees registrados.
    </p>

    <div
      v-for="item in itemsPagina"
      :key="claveItem(item)"
      class="rounded-2xl border border-[var(--color-line)] bg-white p-4"
    >
      <template v-if="item.tipo === 'empresa'">
        <div class="mb-3 flex items-baseline gap-2">
          <h2 class="text-sm font-medium">
            {{ item.nombre }}
          </h2>
          <span class="text-xs text-[var(--color-ink)]/40">Empresa</span>
        </div>

        <div class="mb-3 grid gap-3 sm:grid-cols-2">
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
        </div>

        <button
          type="button"
          class="flex w-full items-center justify-between text-left text-xs font-medium text-[var(--color-ink)]/70"
          @click="toggleExpandido(item.empresaId)"
        >
          <span>{{ item.coacheesConConsentimiento }} de {{ item.coacheesTotal }} coachees con consentimiento informado firmado</span>
          <span>{{ expandidos.has(item.empresaId) ? '▲' : '▼' }}</span>
        </button>
        <ul
          v-if="expandidos.has(item.empresaId)"
          class="mt-2 space-y-1 text-sm"
        >
          <li
            v-for="c in coacheesDeEmpresa(item.empresaId)"
            :key="c.id"
            class="flex items-center gap-2"
          >
            <button
              type="button"
              class="flex h-4 w-4 items-center justify-center rounded-full text-[10px]"
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

        <div class="mt-3 border-t border-[var(--color-line)] pt-3">
          <OtrosDocumentosLegal
            :target="{ empresaId: item.empresaId }"
            :documentos="adicionalesDeEmpresa(item.empresaId)"
            @cambio="cargarAdicionales"
          />
        </div>
      </template>

      <template v-else>
        <div class="mb-3 flex items-baseline gap-2">
          <h3 class="text-sm font-medium">
            {{ item.nombre }}
          </h3>
          <span class="text-xs text-[var(--color-ink)]/40">Independiente</span>
        </div>

        <div class="mb-3 grid gap-3 sm:grid-cols-2">
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
        </div>

        <ConsentimientoInformado
          :coachee-id="item.coacheeId"
          :nombre="item.nombre"
          :informado="item.consentimientoInformado"
          @actualizado="cargarResumen"
        />

        <div class="mt-3 border-t border-[var(--color-line)] pt-3">
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
