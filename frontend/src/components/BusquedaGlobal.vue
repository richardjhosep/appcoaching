<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { buscarGlobal, type ResultadoBusqueda } from '../api/busqueda'

const router = useRouter()
const q = ref('')
const resultado = ref<ResultadoBusqueda | null>(null)
const abierto = ref(false)
let timeout: ReturnType<typeof setTimeout> | undefined

function onInput() {
  clearTimeout(timeout)
  if (!q.value.trim()) {
    resultado.value = null
    abierto.value = false
    return
  }
  timeout = setTimeout(async () => {
    resultado.value = await buscarGlobal(q.value.trim())
    abierto.value = true
  }, 250)
}

function cerrar() {
  setTimeout(() => {
    abierto.value = false
  }, 150)
}

function irACoachee(id: string) {
  abierto.value = false
  q.value = ''
  void router.push({ name: 'coach-coachee-seguimiento', params: { coacheeId: id } })
}

function irAEmpresas() {
  abierto.value = false
  q.value = ''
  void router.push({ name: 'coach-negocio' })
}

function irARecursos() {
  abierto.value = false
  q.value = ''
  void router.push({ name: 'coach-recursos' })
}
</script>

<template>
  <div class="relative">
    <input
      v-model="q"
      type="search"
      placeholder="Buscar…"
      class="w-40 rounded-full border border-[var(--color-parchment)]/40 bg-transparent px-3 py-1 text-xs text-[var(--color-parchment)] placeholder:text-[var(--color-parchment)]/50 focus:w-56 focus:outline-none sm:w-48"
      @input="onInput"
      @focus="onInput"
      @blur="cerrar"
    >
    <div
      v-if="abierto && resultado"
      class="absolute right-0 z-10 mt-2 w-72 rounded-xl border border-[var(--color-line)] bg-white p-3 text-left text-[var(--color-ink)] shadow-lg"
    >
      <div
        v-if="
          resultado.coachees.length === 0 &&
            resultado.empresas.length === 0 &&
            resultado.competencias.length === 0 &&
            resultado.recursos.length === 0
        "
        class="text-xs text-[var(--color-ink)]/60"
      >
        Sin resultados.
      </div>
      <template v-else>
        <div
          v-if="resultado.coachees.length > 0"
          class="mb-2"
        >
          <p class="mb-1 text-xs font-medium text-[var(--color-ink)]/60">
            Coachees
          </p>
          <button
            v-for="c in resultado.coachees"
            :key="c.id"
            class="block w-full rounded px-1 py-1 text-left text-sm hover:bg-[var(--color-parchment)]/50"
            @mousedown.prevent="irACoachee(c.id)"
          >
            {{ c.nombre }}
          </button>
        </div>
        <div
          v-if="resultado.empresas.length > 0"
          class="mb-2"
        >
          <p class="mb-1 text-xs font-medium text-[var(--color-ink)]/60">
            Empresas
          </p>
          <button
            v-for="e in resultado.empresas"
            :key="e.id"
            class="block w-full rounded px-1 py-1 text-left text-sm hover:bg-[var(--color-parchment)]/50"
            @mousedown.prevent="irAEmpresas"
          >
            {{ e.nombre }}
          </button>
        </div>
        <div
          v-if="resultado.competencias.length > 0"
          class="mb-2"
        >
          <p class="mb-1 text-xs font-medium text-[var(--color-ink)]/60">
            Competencias
          </p>
          <p
            v-for="c in resultado.competencias"
            :key="c.id"
            class="px-1 py-1 text-sm"
          >
            {{ c.nombre }}
          </p>
        </div>
        <div v-if="resultado.recursos.length > 0">
          <p class="mb-1 text-xs font-medium text-[var(--color-ink)]/60">
            Recursos
          </p>
          <button
            v-for="r in resultado.recursos"
            :key="r.id"
            class="block w-full rounded px-1 py-1 text-left text-sm hover:bg-[var(--color-parchment)]/50"
            @mousedown.prevent="irARecursos"
          >
            {{ r.titulo }}
          </button>
        </div>
      </template>
    </div>
  </div>
</template>
