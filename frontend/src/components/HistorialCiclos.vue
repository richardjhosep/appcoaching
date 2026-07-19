<script setup lang="ts">
import { ref } from 'vue'
import { descargarInformePdf, type Ciclo } from '../api/ciclos'

defineProps<{ ciclos: Ciclo[] }>()

const expandido = ref<string | null>(null)

const resultadoLabel: Record<string, string> = {
  logrado: 'Logrado',
  medianamente_logrado: 'Medianamente logrado',
  no_logrado: 'No logrado',
}

function toggle(id: string) {
  expandido.value = expandido.value === id ? null : id
}

async function descargarPdf(ciclo: Ciclo) {
  await descargarInformePdf(ciclo.id, ciclo.informePdfNombre ?? 'informe.pdf')
}
</script>

<template>
  <div>
    <p
      v-if="ciclos.length === 0"
      class="text-sm text-[var(--color-ink)]/60"
    >
      Sin ciclos anteriores.
    </p>
    <div
      v-else
      class="space-y-2"
    >
      <div
        v-for="ciclo in ciclos"
        :key="ciclo.id"
        class="rounded-xl border border-[var(--color-line)] bg-white"
      >
        <button
          class="flex w-full items-center justify-between px-4 py-3 text-left text-sm"
          @click="toggle(ciclo.id)"
        >
          <span>
            {{ new Date(ciclo.fechaApertura).toLocaleDateString('es-CL') }}
            —
            {{ ciclo.fechaCierre ? new Date(ciclo.fechaCierre).toLocaleDateString('es-CL') : 'en curso' }}
          </span>
          <span
            v-if="ciclo.resultado"
            class="rounded-full bg-[var(--color-parchment)] px-2 py-0.5 text-xs"
          >
            {{ resultadoLabel[ciclo.resultado] }}
          </span>
        </button>
        <div
          v-if="expandido === ciclo.id"
          class="space-y-2 border-t border-[var(--color-line)] px-4 py-3 text-sm"
        >
          <p><strong>Resumen de reunión inicial:</strong> {{ ciclo.resumenReunionInicial ?? '—' }}</p>
          <p class="whitespace-pre-line">
            <strong>Informe final:</strong> {{ ciclo.informeFinal ?? '—' }}
          </p>
          <button
            v-if="ciclo.informePdfPath"
            class="text-xs text-[var(--color-sage)] underline"
            @click="descargarPdf(ciclo)"
          >
            Descargar informe en PDF
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
