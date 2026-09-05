<script setup lang="ts">
import { ref } from 'vue'
import { descargarInformePdf, type Ciclo } from '../api/ciclos'
import { resultadoLabel, resultadoColor } from '../lib/resultadoCiclo'
import ImpactoNegocioCallout from './ImpactoNegocioCallout.vue'
import NavIcon from './NavIcon.vue'

defineProps<{ ciclos: Ciclo[] }>()

const expandido = ref<string | null>(null)

function toggle(id: string) {
  expandido.value = expandido.value === id ? null : id
}

function formatoFecha(fecha: string): string {
  return new Date(fecha).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })
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
      class="space-y-3"
    >
      <div
        v-for="ciclo in ciclos"
        :key="ciclo.id"
        class="overflow-hidden rounded-xl border border-[var(--color-line)] bg-white"
      >
        <button
          class="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm hover:bg-[var(--color-parchment)]/30"
          @click="toggle(ciclo.id)"
        >
          <span class="font-medium">
            {{ formatoFecha(ciclo.fechaApertura) }}
            <span class="text-[var(--color-ink)]/40">→</span>
            {{ ciclo.fechaCierre ? formatoFecha(ciclo.fechaCierre) : 'en curso' }}
          </span>
          <span class="flex shrink-0 items-center gap-2">
            <span
              v-if="ciclo.resultado"
              class="rounded-full px-2.5 py-1 text-xs font-medium"
              :style="{
                backgroundColor: `color-mix(in srgb, ${resultadoColor[ciclo.resultado]} 15%, white)`,
                color: resultadoColor[ciclo.resultado],
              }"
            >
              {{ resultadoLabel[ciclo.resultado] }}
            </span>
            <NavIcon
              name="chevron"
              :size="14"
              class="text-[var(--color-ink)]/40 transition-transform"
              :class="expandido === ciclo.id ? 'rotate-90' : ''"
            />
          </span>
        </button>
        <div
          v-if="expandido === ciclo.id"
          class="space-y-3 border-t border-[var(--color-line)] px-4 py-4"
        >
          <ImpactoNegocioCallout :impacto="ciclo.impactoNegocio" />

          <div>
            <p class="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--color-ink)]/50">
              Resumen de reunión inicial
            </p>
            <p class="text-sm">
              {{ ciclo.resumenReunionInicial ?? '—' }}
            </p>
          </div>

          <div v-if="ciclo.informeFinal">
            <p class="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--color-ink)]/50">
              Informe final
            </p>
            <div class="max-h-64 overflow-y-auto rounded-lg bg-[var(--color-parchment)]/40 p-3 text-sm leading-relaxed whitespace-pre-line">
              {{ ciclo.informeFinal }}
            </div>
          </div>

          <button
            v-if="ciclo.informePdfPath"
            type="button"
            class="flex items-center gap-1.5 rounded-full border border-[var(--color-line)] px-3 py-1.5 text-xs text-[var(--color-saltup)] hover:bg-[var(--color-parchment)]/60"
            @click="descargarPdf(ciclo)"
          >
            <NavIcon
              name="recursos"
              :size="14"
            />
            Descargar informe en PDF
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
