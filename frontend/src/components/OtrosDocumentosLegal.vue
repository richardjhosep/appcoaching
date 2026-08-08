<script setup lang="ts">
import { ref } from 'vue'
import {
  subirAdicional,
  descargarAdicional,
  eliminarAdicional,
  type DocumentoAdicionalLegal,
  type TargetLegal,
} from '../api/legal'
import { ApiError } from '../api/client'

const props = defineProps<{ target: TargetLegal; documentos: DocumentoAdicionalLegal[] }>()
const emit = defineEmits<{ cambio: [] }>()

const expandido = ref(false)
const titulo = ref('')
const archivo = ref<File | null>(null)
const subiendo = ref(false)
const error = ref<string | null>(null)

function onArchivoChange(e: Event) {
  archivo.value = (e.target as HTMLInputElement).files?.[0] ?? null
}

async function subir() {
  if (!titulo.value.trim() || !archivo.value) return
  subiendo.value = true
  error.value = null
  try {
    await subirAdicional(props.target, titulo.value.trim(), archivo.value)
    titulo.value = ''
    archivo.value = null
    emit('cambio')
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'No se pudo subir el documento.'
  } finally {
    subiendo.value = false
  }
}

async function descargar(doc: DocumentoAdicionalLegal) {
  try {
    await descargarAdicional(doc.id, doc.archivoNombre)
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'No se pudo descargar el archivo.'
  }
}

async function eliminar(doc: DocumentoAdicionalLegal) {
  try {
    await eliminarAdicional(doc.id)
    emit('cambio')
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'No se pudo eliminar el documento.'
  }
}
</script>

<template>
  <div>
    <button
      type="button"
      class="flex w-full items-center justify-between text-left text-xs font-medium text-[var(--color-ink)]/70"
      @click="expandido = !expandido"
    >
      <span>Otros documentos ({{ documentos.length }})</span>
      <span>{{ expandido ? '▲' : '▼' }}</span>
    </button>

    <div
      v-if="expandido"
      class="mt-2 space-y-2"
    >
      <p
        v-if="error"
        class="text-xs text-[var(--color-danger)]"
      >
        {{ error }}
      </p>

      <ul
        v-if="documentos.length > 0"
        class="space-y-1 text-sm"
      >
        <li
          v-for="doc in documentos"
          :key="doc.id"
          class="flex items-center justify-between gap-2"
        >
          <button
            type="button"
            class="text-left text-[var(--color-saltup)] hover:underline"
            @click="descargar(doc)"
          >
            📄 {{ doc.titulo }}
          </button>
          <button
            type="button"
            class="text-xs text-[var(--color-danger)]/70 hover:underline"
            @click="eliminar(doc)"
          >
            Eliminar
          </button>
        </li>
      </ul>
      <p
        v-else
        class="text-xs text-[var(--color-ink)]/50"
      >
        Sin documentos adicionales.
      </p>

      <div class="flex flex-wrap items-center gap-2 border-t border-[var(--color-line)] pt-2">
        <input
          v-model="titulo"
          type="text"
          placeholder="Título (ej. Correo de aprobación)"
          class="min-w-[160px] flex-1 rounded-lg border border-[var(--color-line)] px-2 py-1 text-xs"
        >
        <input
          type="file"
          class="text-xs file:mr-2 file:rounded-full file:border-0 file:bg-[var(--color-ink)] file:px-3 file:py-1 file:text-xs file:text-[var(--color-parchment)]"
          @change="onArchivoChange"
        >
        <button
          type="button"
          class="rounded-full bg-[var(--color-ink)] px-3 py-1 text-xs text-[var(--color-parchment)] disabled:opacity-50"
          :disabled="subiendo || !titulo.trim() || !archivo"
          @click="subir"
        >
          {{ subiendo ? 'Subiendo…' : 'Agregar' }}
        </button>
      </div>
    </div>
  </div>
</template>
