<script setup lang="ts">
import { computed } from 'vue'
import type { DocumentoLegal } from '../api/legal'
import { estadoVisual } from '../lib/legalFormat'

// "2/3 firmados" con mini anillo de progreso — encabezado de cada tarjeta de Legal > Contratos.
const props = defineProps<{
  item: { contrato: DocumentoLegal; nda: DocumentoLegal; cartaInvitacion: DocumentoLegal }
}>()

const firmados = computed(
  () => [props.item.contrato, props.item.nda, props.item.cartaInvitacion].filter((d) => estadoVisual(d) === 'firmado').length,
)
const CIRCUNFERENCIA = 2 * Math.PI * 9
</script>

<template>
  <div
    class="flex shrink-0 items-center gap-2"
    :title="`${firmados} de 3 documentos firmados`"
  >
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      aria-hidden="true"
      class="-rotate-90"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke="var(--color-line)"
        stroke-width="3"
      />
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        :stroke="firmados === 3 ? 'var(--color-sage)' : firmados === 0 ? 'var(--color-danger)' : 'var(--color-bronze)'"
        stroke-width="3"
        stroke-linecap="round"
        :stroke-dasharray="CIRCUNFERENCIA"
        :stroke-dashoffset="CIRCUNFERENCIA * (1 - firmados / 3) + (firmados === 0 ? -0.01 : 0)"
      />
    </svg>
    <span class="text-xs text-[var(--color-muted)]">
      <span class="cifra font-semibold text-[var(--color-ink)]">{{ firmados }}/3</span> firmados
    </span>
  </div>
</template>
