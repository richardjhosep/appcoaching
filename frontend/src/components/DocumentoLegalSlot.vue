<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  upsertDocumentoLegal,
  descargarAcuerdo,
  type DocumentoLegal,
  type TipoDocumentoLegal,
  type TargetLegal,
  type EstadoDocumentoLegal,
} from '../api/legal'
import { ApiError } from '../api/client'
import { estadoVisual, ESTADO_VISUAL_LABEL, ESTADO_VISUAL_COLOR } from '../lib/legalFormat'

const props = defineProps<{
  target: TargetLegal
  tipo: TipoDocumentoLegal
  label: string
  doc: DocumentoLegal
  /** Usado para nombrar el archivo al descargarlo (ej. nombre de la empresa o del coachee). */
  nombreParaArchivo: string
}>()
const emit = defineEmits<{ actualizado: [DocumentoLegal] }>()

const editando = ref(false)
const editEstado = ref<EstadoDocumentoLegal>(props.doc.estado)
const editFecha = ref(props.doc.fecha ?? '')
const editVigencia = ref(props.doc.vigencia ?? '')
const editArchivo = ref<File | null>(null)
const guardando = ref(false)
const error = ref<string | null>(null)

const visual = computed(() => estadoVisual(props.doc))

function toggleEdicion() {
  editando.value = !editando.value
  editEstado.value = props.doc.estado
  editFecha.value = props.doc.fecha ?? ''
  editVigencia.value = props.doc.vigencia ?? ''
  editArchivo.value = null
  error.value = null
}

function onArchivoChange(e: Event) {
  editArchivo.value = (e.target as HTMLInputElement).files?.[0] ?? null
}

async function guardar() {
  guardando.value = true
  error.value = null
  try {
    const actualizado = await upsertDocumentoLegal(props.target, props.tipo, {
      estado: editEstado.value,
      fecha: editFecha.value || undefined,
      vigencia: editVigencia.value || undefined,
      archivo: editArchivo.value ?? undefined,
    })
    emit('actualizado', actualizado)
    editando.value = false
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'No se pudo guardar el documento.'
  } finally {
    guardando.value = false
  }
}

async function descargar() {
  try {
    await descargarAcuerdo(props.target, props.tipo, `${props.label} - ${props.nombreParaArchivo}.pdf`)
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'No se pudo descargar el archivo.'
  }
}
</script>

<template>
  <div class="rounded-lg border border-[var(--color-line)] p-3">
    <div class="mb-1.5 flex items-center justify-between gap-2">
      <p class="text-xs font-medium uppercase text-[var(--color-ink)]/60">
        {{ label }}
      </p>
      <span
        class="rounded-full px-2 py-0.5 text-xs"
        :class="[ESTADO_VISUAL_COLOR[visual].bg, ESTADO_VISUAL_COLOR[visual].texto]"
      >
        {{ ESTADO_VISUAL_LABEL[visual] }}
      </span>
    </div>

    <p
      v-if="visual === 'firmado'"
      class="text-xs text-[var(--color-ink)]/60"
    >
      Firmado<template v-if="doc.fecha">
        el {{ new Date(`${doc.fecha}T00:00:00`).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' }) }}
      </template>
      <template v-if="doc.vigencia">
        · Vigente hasta {{ new Date(`${doc.vigencia}T00:00:00`).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' }) }}
      </template>
    </p>
    <p
      v-else-if="visual === 'vencido'"
      class="text-xs text-[var(--color-bronze)]"
    >
      Venció el {{ new Date(`${doc.vigencia}T00:00:00`).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' }) }} — necesita renovarse.
    </p>
    <p
      v-else
      class="text-xs text-[var(--color-ink)]/60"
    >
      Sin firmar todavía.
    </p>

    <p
      v-if="error"
      class="mt-1 text-xs text-[var(--color-danger)]"
    >
      {{ error }}
    </p>

    <div class="mt-2 flex flex-wrap items-center gap-2">
      <button
        type="button"
        class="rounded-full border border-[var(--color-line)] px-2.5 py-1 text-xs hover:bg-[var(--color-parchment)]/60"
        @click="toggleEdicion"
      >
        {{ editando ? 'Cancelar' : (doc.tieneArchivo ? '✏️ Editar / reemplazar' : '📎 Adjuntar PDF') }}
      </button>
      <button
        v-if="doc.tieneArchivo"
        type="button"
        class="rounded-full border border-[var(--color-line)] px-2.5 py-1 text-xs text-[var(--color-saltup)] hover:bg-[var(--color-parchment)]/60"
        @click="descargar"
      >
        ⬇ Ver documento
      </button>
    </div>

    <div
      v-if="editando"
      class="mt-3 space-y-2 border-t border-[var(--color-line)] pt-3"
    >
      <select
        v-model="editEstado"
        class="w-full rounded-lg border border-[var(--color-line)] px-2 py-1 text-sm"
      >
        <option value="pendiente">
          Pendiente
        </option>
        <option value="firmado">
          Firmado
        </option>
      </select>
      <label class="block text-xs">
        Fecha de firma
        <input
          v-model="editFecha"
          type="date"
          class="mt-0.5 w-full rounded-lg border border-[var(--color-line)] px-2 py-1 text-sm"
        >
      </label>
      <label class="block text-xs">
        Vigencia
        <input
          v-model="editVigencia"
          type="date"
          class="mt-0.5 w-full rounded-lg border border-[var(--color-line)] px-2 py-1 text-sm"
        >
      </label>
      <label class="block text-xs">
        {{ doc.tieneArchivo ? 'Reemplazar PDF' : 'Adjuntar PDF firmado' }}
        <input
          type="file"
          accept="application/pdf"
          class="mt-0.5 w-full text-xs file:mr-2 file:rounded-full file:border-0 file:bg-[var(--color-ink)] file:px-3 file:py-1 file:text-xs file:text-[var(--color-parchment)]"
          @change="onArchivoChange"
        >
      </label>
      <button
        type="button"
        class="rounded-lg bg-[var(--color-ink)] px-3 py-1.5 text-xs text-[var(--color-parchment)] disabled:opacity-50"
        :disabled="guardando"
        @click="guardar"
      >
        {{ guardando ? 'Guardando…' : 'Guardar' }}
      </button>
    </div>
  </div>
</template>
