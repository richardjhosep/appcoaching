<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useId } from 'vue'
import { useRouter } from 'vue-router'
import { buscarGlobal, type ResultadoBusqueda } from '../api/busqueda'

// Búsqueda global del coach como combobox accesible (patrón ARIA "list autocomplete"):
// el foco se queda siempre en el input y la opción activa se anuncia con aria-activedescendant.
// Atajo Ctrl/Cmd+K para enfocarla desde cualquier pantalla.
const router = useRouter()
const uid = useId()
const listboxId = `${uid}-lista`
const inputEl = ref<HTMLInputElement | null>(null)
const raiz = ref<HTMLElement | null>(null)

const q = ref('')
const resultado = ref<ResultadoBusqueda | null>(null)
const abierto = ref(false)
const error = ref(false)
const buscando = ref(false)
const activo = ref(-1)
let timeout: ReturnType<typeof setTimeout> | undefined
// Descarta respuestas de búsquedas anteriores que lleguen tarde.
let secuencia = 0

interface Opcion {
  id: string
  grupo: 'coachees' | 'empresas' | 'recursos'
  texto: string
  ir: () => void
}

const opciones = computed<Opcion[]>(() => {
  const r = resultado.value
  if (!r) return []
  return [
    ...r.coachees.map((c, i) => ({ id: `${uid}-c${i}`, grupo: 'coachees' as const, texto: c.nombre, ir: () => irACoachee(c.id) })),
    ...r.empresas.map((e, i) => ({ id: `${uid}-e${i}`, grupo: 'empresas' as const, texto: e.nombre, ir: () => irAEmpresa(e.id) })),
    ...r.recursos.map((x, i) => ({ id: `${uid}-r${i}`, grupo: 'recursos' as const, texto: x.titulo, ir: irARecursos })),
  ]
})

const indiceDe = (id: string) => opciones.value.findIndex((o) => o.id === id)
const sinResultados = computed(
  () => !!resultado.value && opciones.value.length === 0 && resultado.value.competencias.length === 0,
)
const activedescendant = computed(() => (activo.value >= 0 ? opciones.value[activo.value]?.id : undefined))

function limpiar() {
  clearTimeout(timeout)
  secuencia += 1
  q.value = ''
  resultado.value = null
  abierto.value = false
  error.value = false
  buscando.value = false
  activo.value = -1
}

function cerrar() {
  abierto.value = false
  activo.value = -1
}

async function buscar() {
  const texto = q.value.trim()
  const mia = ++secuencia
  buscando.value = true
  error.value = false
  try {
    const r = await buscarGlobal(texto)
    if (mia !== secuencia) return
    resultado.value = r
  } catch {
    if (mia !== secuencia) return
    resultado.value = null
    error.value = true
  } finally {
    if (mia === secuencia) buscando.value = false
  }
  abierto.value = true
  activo.value = -1
}

function onInput() {
  clearTimeout(timeout)
  if (!q.value.trim()) {
    limpiar()
    return
  }
  timeout = setTimeout(() => void buscar(), 250)
}

function onFocus() {
  if (q.value.trim() && (resultado.value || error.value)) abierto.value = true
}

// Cierra solo si el foco sale del componente (no hace falta ningún setTimeout: las opciones
// no toman foco porque su mousedown se cancela).
function onFocusout(e: FocusEvent) {
  const destino = e.relatedTarget as Node | null
  if (!destino || !raiz.value?.contains(destino)) cerrar()
}

function mover(delta: number) {
  const n = opciones.value.length
  if (n === 0) return
  activo.value = activo.value < 0 ? (delta > 0 ? 0 : n - 1) : (activo.value + delta + n) % n
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (!abierto.value && (resultado.value || error.value)) abierto.value = true
    else mover(1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    mover(-1)
  } else if (e.key === 'Enter') {
    const op = opciones.value[activo.value]
    if (abierto.value && op) {
      e.preventDefault()
      seleccionar(op)
    }
  } else if (e.key === 'Escape') {
    if (abierto.value) {
      e.preventDefault()
      cerrar()
    } else if (q.value) {
      limpiar()
    }
  }
}

function seleccionar(op: Opcion) {
  limpiar()
  op.ir()
}

function irACoachee(id: string) {
  void router.push({ name: 'coach-coachee-detail', params: { coacheeId: id }, query: { tab: 'sesiones' } })
}

// El mantenedor de empresas abre el editor de la empresa indicada en ?id=.
function irAEmpresa(id: string) {
  void router.push({ name: 'coach-empresas', query: { id } })
}

function irARecursos() {
  void router.push({ name: 'coach-recursos' })
}

function onAtajo(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    inputEl.value?.focus()
    inputEl.value?.select()
  }
}

onMounted(() => window.addEventListener('keydown', onAtajo))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onAtajo)
  clearTimeout(timeout)
})

const GRUPOS = [
  { clave: 'coachees', titulo: 'Coachees' },
  { clave: 'empresas', titulo: 'Empresas' },
  { clave: 'recursos', titulo: 'Recursos' },
] as const
</script>

<template>
  <div
    ref="raiz"
    class="relative"
    @focusout="onFocusout"
  >
    <input
      ref="inputEl"
      v-model="q"
      type="search"
      role="combobox"
      aria-label="Buscar coachees, empresas y recursos"
      aria-autocomplete="list"
      aria-haspopup="listbox"
      :aria-expanded="abierto"
      :aria-controls="listboxId"
      :aria-activedescendant="activedescendant"
      placeholder="Buscar… (Ctrl+K)"
      autocomplete="off"
      class="w-full rounded-full border border-[var(--color-parchment)]/40 bg-transparent px-3 py-1.5 text-xs text-[var(--color-parchment)] placeholder:text-[var(--color-parchment)]/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-parchment)]/60"
      @input="onInput"
      @focus="onFocus"
      @keydown="onKeydown"
    >
    <div
      v-show="abierto"
      :id="listboxId"
      role="listbox"
      aria-label="Resultados de búsqueda"
      class="absolute left-0 right-0 z-10 mt-2 max-h-80 overflow-y-auto rounded-xl border border-[var(--color-line)] bg-white p-3 text-left text-[var(--color-ink)] shadow-lg"
    >
      <p
        v-if="error"
        role="status"
        class="text-xs text-[var(--color-danger)]"
      >
        No pudimos buscar. Revisa tu conexión e inténtalo de nuevo.
      </p>
      <p
        v-else-if="sinResultados"
        role="status"
        class="text-xs text-[var(--color-muted)]"
      >
        Sin resultados.
      </p>
      <template v-else-if="resultado">
        <template
          v-for="g in GRUPOS"
          :key="g.clave"
        >
          <div
            v-if="opciones.some((o) => o.grupo === g.clave)"
            role="group"
            :aria-label="g.titulo"
            class="mb-2"
          >
            <p
              aria-hidden="true"
              class="mb-1 text-xs font-medium text-[var(--color-muted)]"
            >
              {{ g.titulo }}
            </p>
            <div
              v-for="o in opciones.filter((x) => x.grupo === g.clave)"
              :id="o.id"
              :key="o.id"
              role="option"
              :aria-selected="indiceDe(o.id) === activo"
              class="cursor-pointer rounded px-1 py-1.5 text-sm"
              :class="indiceDe(o.id) === activo ? 'bg-[var(--color-parchment)]' : 'hover:bg-[var(--color-parchment)]/50'"
              @mousedown.prevent
              @click="seleccionar(o)"
              @mousemove="activo = indiceDe(o.id)"
            >
              {{ o.texto }}
            </div>
          </div>
        </template>
        <div
          v-if="resultado.competencias.length > 0"
          role="group"
          aria-label="Competencias"
        >
          <p
            aria-hidden="true"
            class="mb-1 text-xs font-medium text-[var(--color-muted)]"
          >
            Competencias
          </p>
          <div
            v-for="c in resultado.competencias"
            :key="c.id"
            role="option"
            aria-disabled="true"
            aria-selected="false"
            class="px-1 py-1.5 text-sm text-[var(--color-muted)]"
          >
            {{ c.nombre }}
          </div>
        </div>
      </template>
    </div>
    <span
      class="sr-only"
      role="status"
    >{{ buscando ? 'Buscando…' : '' }}</span>
  </div>
</template>
