<script setup lang="ts">
import { ref, watch } from 'vue'
import type { NotaPizarra } from '../api/pizarra'
import { COLORES_NOTA } from '../lib/colorNota'

const props = defineProps<{ nota: NotaPizarra }>()

const emit = defineEmits<{
  mover: [id: string, posX: number, posY: number]
  texto: [id: string, texto: string]
  color: [id: string, color: string]
  eliminar: [id: string]
}>()

// Posición local para feedback visual inmediato durante el arrastre — se sincroniza con la
// del prop cuando el padre recibe una actualización externa (ej. tras recargar la lista).
const posX = ref(props.nota.posX)
const posY = ref(props.nota.posY)
watch(
  () => [props.nota.posX, props.nota.posY],
  () => {
    posX.value = props.nota.posX
    posY.value = props.nota.posY
  },
)

const arrastrando = ref(false)
let offset = { x: 0, y: 0 }

// Arrastre con Pointer Events nativos — sin librería, mismo criterio "a mano" que
// MapaCanvas.vue. El offset es un delta: no importa el sistema de coordenadas del contenedor
// mientras no se mueva durante el arrastre.
function onPointerDown(e: PointerEvent) {
  const target = e.currentTarget as HTMLElement
  target.setPointerCapture(e.pointerId)
  offset = { x: e.clientX - posX.value, y: e.clientY - posY.value }
  arrastrando.value = true
}

function onPointerMove(e: PointerEvent) {
  if (!arrastrando.value) return
  posX.value = e.clientX - offset.x
  posY.value = e.clientY - offset.y
}

function onPointerUp() {
  if (!arrastrando.value) return
  arrastrando.value = false
  emit('mover', props.nota.id, posX.value, posY.value)
}

function onTextoChange(e: Event) {
  emit('texto', props.nota.id, (e.target as HTMLTextAreaElement).value)
}
</script>

<template>
  <div
    class="absolute flex w-48 flex-col gap-1.5 rounded-lg p-3 shadow-md"
    :style="{ left: `${posX}px`, top: `${posY}px`, backgroundColor: nota.color }"
    :class="arrastrando ? 'cursor-grabbing shadow-lg' : ''"
  >
    <div
      class="flex cursor-grab items-center justify-between"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
    >
      <div class="flex gap-1">
        <button
          v-for="c in COLORES_NOTA"
          :key="c"
          type="button"
          class="h-3.5 w-3.5 rounded-full border border-black/10"
          :class="c === nota.color ? 'ring-2 ring-black/40' : ''"
          :style="{ backgroundColor: c }"
          @pointerdown.stop
          @click="emit('color', nota.id, c)"
        />
      </div>
      <button
        type="button"
        aria-label="Eliminar nota"
        class="text-black/40 hover:text-black/70"
        @pointerdown.stop
        @click="emit('eliminar', nota.id)"
      >
        ×
      </button>
    </div>
    <textarea
      :value="nota.texto"
      rows="4"
      placeholder="Escribe aquí…"
      class="w-full resize-none border-none bg-transparent text-sm text-[#1a1a1a] outline-none placeholder:text-black/40"
      @pointerdown.stop
      @change="onTextoChange"
    />
  </div>
</template>
