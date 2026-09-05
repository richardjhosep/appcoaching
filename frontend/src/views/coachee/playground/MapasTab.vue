<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import EmptyState from '../../../components/EmptyState.vue'
import SectionCard from '../../../components/SectionCard.vue'
import MapaCanvas from '../../../components/MapaCanvas.vue'
import SkeletonBlock from '../../../components/SkeletonBlock.vue'
import { getMapa, listMapasDisponibles, type MapaConNodos, type MapaResumen } from '../../../api/mapas'
import { formatearFechaLimite } from '../../../lib/fechaLimite'

const loading = ref(true)
const disponibles = ref<MapaResumen[]>([])

const mapaAbierto = ref<MapaConNodos | null>(null)
const seleccionadoId = ref<string | null>(null)

async function load() {
  loading.value = true
  disponibles.value = await listMapasDisponibles()
  loading.value = false
}

onMounted(load)

const nodoSeleccionado = computed(
  () => mapaAbierto.value?.nodos.find((n) => n.id === seleccionadoId.value) ?? null,
)

async function abrir(id: string) {
  seleccionadoId.value = null
  mapaAbierto.value = await getMapa(id)
}

function cerrar() {
  mapaAbierto.value = null
}
</script>

<template>
  <h1 class="mb-4 font-[family-name:var(--font-heading)] text-xl font-semibold">
    Mapas mentales
  </h1>

  <SkeletonBlock v-if="loading" />

  <EmptyState
    v-else-if="!mapaAbierto && disponibles.length === 0"
    icon="mapa"
    title="Todavía no tienes mapas mentales disponibles"
    description="Cuando tu coach publique uno, va a aparecer acá."
  />

  <div
    v-else-if="!mapaAbierto"
    class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
  >
    <button
      v-for="mapa in disponibles"
      :key="mapa.id"
      class="flex flex-col items-start gap-2 rounded-2xl border border-[var(--color-line)] bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[var(--color-sage)] hover:shadow-md"
      @click="abrir(mapa.id)"
    >
      <p class="text-sm font-medium">
        {{ mapa.titulo }}
      </p>
      <p
        v-if="mapa.competencia"
        class="text-xs text-[var(--color-ink)]/50"
      >
        {{ mapa.competencia.nombre }} · {{ mapa.totalNodos }} nodo{{ mapa.totalNodos === 1 ? '' : 's' }}
      </p>
      <p
        v-if="formatearFechaLimite(mapa.fechaLimite)"
        class="text-xs text-[var(--color-bronze)]"
      >
        {{ formatearFechaLimite(mapa.fechaLimite) }}
      </p>
    </button>
  </div>

  <div v-else>
    <button
      class="mb-4 text-sm text-[var(--color-ink)]/60 hover:text-[var(--color-ink)] hover:underline"
      @click="cerrar"
    >
      ← Volver a Mapas mentales
    </button>
    <h2 class="mb-3 font-[family-name:var(--font-heading)] text-lg font-semibold">
      {{ mapaAbierto.titulo }}
    </h2>
    <p class="mb-3 text-xs text-[var(--color-ink)]/50">
      Toca un nodo para ver su detalle. Los nodos con "+" tienen ramas escondidas — tócalos para desplegarlas.
    </p>

    <div class="grid gap-4 lg:grid-cols-[1fr_300px]">
      <MapaCanvas
        :nodos="mapaAbierto.nodos"
        :seleccionado-id="seleccionadoId"
        @select="(id) => (seleccionadoId = id)"
      />

      <SectionCard
        :title="nodoSeleccionado ? nodoSeleccionado.label : 'Detalle'"
        icon="mapa"
      >
        <p
          v-if="nodoSeleccionado?.detalle"
          class="text-sm text-[var(--color-ink)]/80"
        >
          {{ nodoSeleccionado.detalle }}
        </p>
        <p
          v-else-if="nodoSeleccionado"
          class="text-sm text-[var(--color-ink)]/50"
        >
          Este nodo no tiene texto adicional.
        </p>
        <p
          v-else
          class="text-sm text-[var(--color-ink)]/50"
        >
          Toca un nodo del mapa para ver su detalle acá.
        </p>
      </SectionCard>
    </div>
  </div>
</template>
