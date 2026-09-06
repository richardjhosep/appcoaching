<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AppShell from '../../components/AppShell.vue'
import SectionCard from '../../components/SectionCard.vue'
import SkeletonBlock from '../../components/SkeletonBlock.vue'
import TabBar from '../../components/TabBar.vue'
import { getMyCoachee, type Coachee } from '../../api/coachees'
import {
  getMisDocumentosLegales,
  descargarMiAcuerdo,
  type MisDocumentosLegales,
  type TipoDocumentoLegal,
} from '../../api/legal'
import { getMiInversion, type MiInversion, type PeriodoComercial } from '../../api/negocio'
import { estadoVisual, ESTADO_VISUAL_LABEL, ESTADO_VISUAL_COLOR } from '../../lib/legalFormat'
import { ApiError } from '../../api/client'
import { notifyError } from '../../lib/notify'

const loading = ref(true)
const coachee = ref<Coachee | null>(null)
const documentos = ref<MisDocumentosLegales | null>(null)

async function cargarDocumentos() {
  documentos.value = await getMisDocumentosLegales()
}

async function load() {
  loading.value = true
  coachee.value = await getMyCoachee()
  await cargarDocumentos()
  if (!coachee.value.empresaId) {
    await cargarInversion()
  }
  loading.value = false
}
onMounted(load)

async function descargar(tipo: TipoDocumentoLegal, label: string) {
  try {
    await descargarMiAcuerdo(tipo, `${label}.pdf`)
  } catch (err) {
    await notifyError('No se pudo descargar', err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.')
  }
}

// --- Mi inversión (solo independientes) ---

const PERIODOS: Array<{ key: PeriodoComercial; label: string; icon: string }> = [
  { key: 'mes', label: 'Mes actual', icon: 'sesiones' },
  { key: 'semestre', label: 'Semestre actual', icon: 'progreso' },
  { key: 'anio', label: 'Año actual', icon: 'negocio' },
]
const periodo = ref<PeriodoComercial>('mes')
const inversion = ref<MiInversion | null>(null)
const loadingInversion = ref(true)

async function cargarInversion() {
  loadingInversion.value = true
  inversion.value = await getMiInversion(periodo.value)
  loadingInversion.value = false
}

async function cambiarPeriodo(p: PeriodoComercial) {
  periodo.value = p
  await cargarInversion()
}

const formatoCLP = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })
</script>

<template>
  <AppShell>
    <h1 class="mb-1 font-[family-name:var(--font-heading)] text-xl font-semibold">
      Mi cuenta
    </h1>
    <p class="mb-4 text-sm text-[var(--color-ink)]/60">
      Tus documentos y, si aplica, cuánto has generado en el período.
    </p>

    <SkeletonBlock v-if="loading" />
    <div
      v-else-if="coachee && documentos"
      class="space-y-4"
    >
      <SectionCard
        title="Mis documentos"
        icon="legal"
      >
        <p class="mb-3 text-xs text-[var(--color-ink)]/50">
          {{ documentos.alcance === 'empresa'
            ? 'Este es el contrato entre tu empresa y tu coach.'
            : 'Tu contrato personal con tu coach.' }}
        </p>
        <div class="grid gap-3 sm:grid-cols-2">
          <div
            v-for="(doc, tipo) in { contrato: documentos.contrato, nda: documentos.nda }"
            :key="tipo"
            class="rounded-xl border border-[var(--color-line)] p-3 text-sm"
          >
            <div class="mb-2 flex items-center justify-between">
              <span class="font-medium">{{ tipo === 'contrato' ? 'Contrato' : 'NDA' }}</span>
              <span
                class="rounded-full px-2 py-0.5 text-xs"
                :class="[ESTADO_VISUAL_COLOR[estadoVisual(doc)].bg, ESTADO_VISUAL_COLOR[estadoVisual(doc)].texto]"
              >
                {{ ESTADO_VISUAL_LABEL[estadoVisual(doc)] }}
              </span>
            </div>
            <p
              v-if="doc.fecha"
              class="text-xs text-[var(--color-ink)]/60"
            >
              Fecha: {{ new Date(`${doc.fecha}T00:00:00`).toLocaleDateString('es-CL') }}
            </p>
            <p
              v-if="doc.vigencia"
              class="text-xs text-[var(--color-ink)]/60"
            >
              Vigencia: {{ new Date(`${doc.vigencia}T00:00:00`).toLocaleDateString('es-CL') }}
            </p>
            <button
              v-if="doc.tieneArchivo"
              type="button"
              class="mt-2 text-xs text-[var(--color-saltup)] hover:underline"
              @click="descargar(tipo, tipo === 'contrato' ? 'Contrato' : 'NDA')"
            >
              ⬇ Descargar
            </button>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        v-if="!coachee.empresaId"
        title="Mi inversión"
        icon="negocio"
      >
        <p class="mb-3 text-xs text-[var(--color-ink)]/50">
          Lo que has generado en el período, según tus sesiones realizadas — no es un estado de
          pago.
        </p>
        <TabBar
          class="mb-4"
          :tabs="PERIODOS"
          :model-value="periodo"
          @update:model-value="cambiarPeriodo"
        />
        <SkeletonBlock v-if="loadingInversion" />
        <div
          v-else-if="inversion"
          class="grid grid-cols-2 gap-3 sm:grid-cols-3"
        >
          <div>
            <p class="text-xs text-[var(--color-ink)]/60">
              Horas realizadas
            </p>
            <p class="font-[family-name:var(--font-mono)] text-xl">
              {{ inversion.horasRealizadas }}
            </p>
          </div>
          <div>
            <p class="text-xs text-[var(--color-ink)]/60">
              Monto del período
            </p>
            <p class="font-[family-name:var(--font-mono)] text-xl text-[var(--color-sage)]">
              {{ formatoCLP.format(inversion.montoDelPeriodo) }}
            </p>
          </div>
          <div>
            <p class="text-xs text-[var(--color-ink)]/60">
              Proyectado
            </p>
            <p class="font-[family-name:var(--font-mono)] text-xl text-[var(--color-bronze)]">
              {{ formatoCLP.format(inversion.montoProyectado) }}
            </p>
          </div>
        </div>
      </SectionCard>
    </div>
  </AppShell>
</template>
