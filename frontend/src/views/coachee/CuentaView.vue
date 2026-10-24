<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AppShell from '../../components/AppShell.vue'
import SectionCard from '../../components/SectionCard.vue'
import SkeletonBlock from '../../components/SkeletonBlock.vue'
import ErrorState from '../../components/ErrorState.vue'
import StatusBadge from '../../components/StatusBadge.vue'
import { useCarga } from '../../lib/useCarga'
import TabBar from '../../components/TabBar.vue'
import DocumentosCoacheePanel from '../../components/DocumentosCoacheePanel.vue'
import { getMyCoachee, type Coachee } from '../../api/coachees'
import {
  getMisDocumentosLegales,
  descargarMiAcuerdo,
  type MisDocumentosLegales,
  type TipoDocumentoLegal,
} from '../../api/legal'
import { getMiInversion, type MiInversion, type PeriodoComercial } from '../../api/negocio'
import { estadoVisual, ESTADO_VISUAL_LABEL, type EstadoVisualDocumento } from '../../lib/legalFormat'
import { ApiError } from '../../api/client'
import { notifyError } from '../../lib/notify'

const coachee = ref<Coachee | null>(null)
const documentos = ref<MisDocumentosLegales | null>(null)

async function cargarDocumentos() {
  documentos.value = await getMisDocumentosLegales()
}

const { loading, error, recargar } = useCarga(async () => {
  coachee.value = await getMyCoachee()
  await cargarDocumentos()
  if (!coachee.value.empresaId) {
    await cargarInversion()
  }
})
onMounted(recargar)

const TONO_DOCUMENTO: Record<EstadoVisualDocumento, 'sage' | 'danger' | 'bronze'> = {
  firmado: 'sage',
  pendiente: 'danger',
  vencido: 'bronze',
}

const LABEL_DOCUMENTO: Record<TipoDocumentoLegal, string> = {
  contrato: 'Contrato',
  nda: 'NDA',
  carta_invitacion: 'Carta de invitación',
}

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
const errorInversion = ref(false)

// "Mi inversión" es secundaria: si falla, el resto de la cuenta se sigue mostrando y esa
// tarjeta ofrece su propio "Reintentar".
async function cargarInversion() {
  loadingInversion.value = true
  errorInversion.value = false
  try {
    inversion.value = await getMiInversion(periodo.value)
  } catch {
    errorInversion.value = true
  } finally {
    loadingInversion.value = false
  }
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
    <p class="mb-4 text-sm text-[var(--color-muted)]">
      Tus documentos y, si aplica, cuánto has generado en el período.
      <RouterLink
        :to="{ name: 'guia-coachee' }"
        class="ml-1 text-[var(--color-saltup-ink)] hover:underline"
      >
        Ver la guía de la plataforma
      </RouterLink>
    </p>

    <SkeletonBlock v-if="loading" />
    <ErrorState
      v-else-if="error"
      :description="error"
      @retry="recargar"
    />
    <div
      v-else-if="coachee && documentos"
      class="space-y-4"
    >
      <SectionCard
        title="Consentimiento informado"
        icon="legal"
      >
        <div class="flex flex-wrap items-center gap-2">
          <StatusBadge :tone="coachee.consentimientoInformado ? 'sage' : 'danger'">
            {{ coachee.consentimientoInformado ? 'Firmado' : 'Pendiente' }}
          </StatusBadge>
          <span
            v-if="coachee.consentimientoInformado && coachee.consentimientoFecha"
            class="text-xs text-[var(--color-muted)]"
          >
            el {{ new Date(coachee.consentimientoFecha).toLocaleDateString('es-CL') }}
          </span>
        </div>
        <p class="mt-2 text-xs text-[var(--color-muted)]">
          <template v-if="coachee.consentimientoInformado">
            Registraste tu consentimiento para el proceso de coaching.
          </template>
          <template v-else>
            Tu coach te envía un correo con un enlace para que lo confirmes. Si no lo encuentras,
            revisa tu carpeta de spam o pídele que te lo reenvíe.
          </template>
        </p>
      </SectionCard>

      <SectionCard
        title="Documentos de mi proceso"
        icon="legal"
      >
        <p class="mb-3 text-xs text-[var(--color-muted)]">
          CV, evaluaciones de desempeño, descriptor de cargo… Lo que subas aquí lo ven tu coach y
          tu empresa, y lo que ellos suban lo ves tú — así nadie tiene que volver a cargarlo.
        </p>
        <DocumentosCoacheePanel />
      </SectionCard>

      <SectionCard
        title="Mis documentos"
        icon="legal"
      >
        <p class="mb-3 text-xs text-[var(--color-muted)]">
          {{ documentos.alcance === 'empresa'
            ? 'Este es el contrato entre tu empresa y tu coach.'
            : 'Tu contrato personal con tu coach.' }}
        </p>
        <div class="grid gap-3 sm:grid-cols-3">
          <div
            v-for="(doc, tipo) in {
              contrato: documentos.contrato,
              nda: documentos.nda,
              carta_invitacion: documentos.cartaInvitacion,
            }"
            :key="tipo"
            class="rounded-xl border border-[var(--color-line)] p-3 text-sm"
          >
            <div class="mb-2 flex items-center justify-between">
              <span class="font-medium">{{ LABEL_DOCUMENTO[tipo] }}</span>
              <StatusBadge :tone="TONO_DOCUMENTO[estadoVisual(doc)]">
                {{ ESTADO_VISUAL_LABEL[estadoVisual(doc)] }}
              </StatusBadge>
            </div>
            <p
              v-if="doc.fecha"
              class="text-xs text-[var(--color-muted)]"
            >
              Fecha: {{ new Date(`${doc.fecha}T00:00:00`).toLocaleDateString('es-CL') }}
            </p>
            <p
              v-if="doc.vigencia"
              class="text-xs text-[var(--color-muted)]"
            >
              Vigencia: {{ new Date(`${doc.vigencia}T00:00:00`).toLocaleDateString('es-CL') }}
            </p>
            <button
              v-if="doc.tieneArchivo"
              type="button"
              class="mt-2 inline-flex min-h-11 items-center text-xs text-[var(--color-saltup-ink)] hover:underline sm:min-h-0"
              @click="descargar(tipo, LABEL_DOCUMENTO[tipo])"
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
        <p class="mb-3 text-xs text-[var(--color-muted)]">
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
        <ErrorState
          v-else-if="errorInversion"
          title="No pudimos cargar tu inversión"
          @retry="cargarInversion"
        />
        <div
          v-else-if="inversion"
          class="grid grid-cols-2 gap-3 sm:grid-cols-3"
        >
          <div>
            <p class="text-xs text-[var(--color-muted)]">
              Horas realizadas
            </p>
            <p class="cifra text-xl font-semibold">
              {{ inversion.horasRealizadas }}
            </p>
          </div>
          <div>
            <p class="text-xs text-[var(--color-muted)]">
              Monto del período
            </p>
            <p class="cifra text-xl text-[var(--color-sage)]">
              {{ formatoCLP.format(inversion.montoDelPeriodo) }}
            </p>
          </div>
          <div>
            <p class="text-xs text-[var(--color-muted)]">
              Proyectado
            </p>
            <p class="cifra text-xl text-[var(--color-bronze)]">
              {{ formatoCLP.format(inversion.montoProyectado) }}
            </p>
          </div>
        </div>
      </SectionCard>
    </div>
  </AppShell>
</template>
