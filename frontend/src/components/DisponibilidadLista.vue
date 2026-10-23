<script setup lang="ts">
// Versión móvil de la grilla semanal de DisponibilidadCalendar: en pantallas angostas la grilla
// de 640px+ obliga a scrollear en horizontal, así que acá los horarios libres se listan
// agrupados por día (solo los días con horarios). Presentacional: la semana y la carga las
// maneja el calendario que la contiene.
import { computed } from 'vue'

const props = defineProps<{ dias: Date[]; slots: string[] }>()
const emit = defineEmits<{ solicitar: [string] }>()

function esMismoDia(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

const grupos = computed(() =>
  props.dias
    .map((dia) => ({
      dia,
      horarios: props.slots
        .filter((iso) => esMismoDia(new Date(iso), dia))
        .sort((a, b) => new Date(a).getTime() - new Date(b).getTime()),
    }))
    .filter((g) => g.horarios.length > 0),
)

const etiquetaDia = (d: Date) => d.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'short' })
const hora = (iso: string) => new Date(iso).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
</script>

<template>
  <div>
    <p
      v-if="grupos.length === 0"
      class="py-6 text-center text-sm text-[var(--color-muted)]"
    >
      No hay horarios libres esta semana. Prueba con otra semana.
    </p>
    <div
      v-for="g in grupos"
      :key="g.dia.toISOString()"
      class="mb-3"
    >
      <h3 class="mb-1.5 text-xs font-semibold capitalize text-[var(--color-muted)]">
        {{ etiquetaDia(g.dia) }}
      </h3>
      <ul class="flex flex-wrap gap-2">
        <li
          v-for="iso in g.horarios"
          :key="iso"
        >
          <button
            type="button"
            class="min-h-11 min-w-20 rounded-lg border border-[var(--color-sage)] bg-[var(--color-sage)]/10 px-3 text-sm font-semibold text-[var(--color-sage)] hover:bg-[var(--color-sage)]/20"
            :aria-label="`Pedir la hora de ${etiquetaDia(g.dia)} a las ${hora(iso)}`"
            @click="emit('solicitar', iso)"
          >
            {{ hora(iso) }}
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>
