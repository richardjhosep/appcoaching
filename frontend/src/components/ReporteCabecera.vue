<script setup lang="ts">
import AppLogo from './AppLogo.vue'
import AppButton from './AppButton.vue'
import CoachFirma from './CoachFirma.vue'

// Cabecera de las vistas imprimibles (Informe ejecutivo, Finanzas). En pantalla es el título
// con el botón de imprimir; al imprimir se antepone el logo y el botón desaparece. No hay
// selector de período: "Emitido el" es la fecha en que se genera el reporte.
defineProps<{ titulo: string; empresa?: string | null; conCoach?: boolean }>()

const fechaEmision = new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })

function imprimir() {
  window.print()
}
</script>

<template>
  <header class="mb-4 print:mb-6 print:border-b print:border-[var(--color-line)] print:pb-4">
    <AppLogo
      class="mb-3 hidden print:flex"
      :size="28"
    />
    <div class="flex items-start justify-between gap-3">
      <div>
        <h1 class="font-[family-name:var(--font-display)] font-medium text-2xl">
          {{ titulo }}
        </h1>
        <p
          v-if="empresa"
          class="text-xs text-[var(--color-muted)] print:text-sm"
        >
          {{ empresa }} · Emitido el {{ fechaEmision }}
        </p>
      </div>
      <div class="flex shrink-0 flex-col items-end gap-3">
        <CoachFirma
          v-if="conCoach"
          variante="cabecera"
        />
        <AppButton
          size="sm"
          class="print:hidden"
          @click="imprimir"
        >
          Imprimir / Guardar como PDF
        </AppButton>
      </div>
    </div>
  </header>
</template>
