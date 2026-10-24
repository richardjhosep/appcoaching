<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import {
  TIPOS_DOCUMENTO_COACHEE,
  descargarDocumentoCoachee,
  eliminarDocumentoCoachee,
  listarDocumentosCoachee,
  subirDocumentoCoachee,
  type DocumentoCoachee,
  type TipoDocumentoCoachee,
} from '../api/documentosCoachee'
import { ApiError } from '../api/client'
import { useAuthStore } from '../stores/auth'
import { confirmDialog, notifyError, notifySuccess } from '../lib/notify'

// Documentos del proceso de un coachee, compartidos entre coach, coachee y empresa. Sin
// `coacheeId` = los del propio coachee logueado (Mi cuenta).
const props = defineProps<{ coacheeId?: string }>()

const auth = useAuthStore()
const documentos = ref<DocumentoCoachee[]>([])
const cargando = ref(true)
const subiendo = ref(false)
const form = reactive({ tipo: 'cv' as TipoDocumentoCoachee, descripcion: '', archivo: null as File | null })
const inputArchivo = ref<HTMLInputElement | null>(null)

async function cargar() {
  cargando.value = true
  try {
    documentos.value = await listarDocumentosCoachee(props.coacheeId)
  } catch {
    documentos.value = []
  } finally {
    cargando.value = false
  }
}
onMounted(cargar)
watch(() => props.coacheeId, cargar)

const labelTipo = (tipo: TipoDocumentoCoachee) => TIPOS_DOCUMENTO_COACHEE.find((t) => t.valor === tipo)?.label ?? tipo

// Checklist de los básicos: de un vistazo se ve qué falta, para no pedir dos veces lo que ya
// subió otro.
const basicos = computed(() =>
  TIPOS_DOCUMENTO_COACHEE.filter((t) => t.basico).map((t) => ({
    ...t,
    cargado: documentos.value.some((d) => d.tipo === t.valor),
  })),
)

function quienSubio(doc: DocumentoCoachee): string {
  if (doc.subidoPorUserId === auth.user?.id) return 'Subido por ti'
  if (doc.subidoPorRol === 'empresa') return 'Subido por la empresa'
  if (doc.subidoPorRol === 'coachee') return 'Subido por el coachee'
  return 'Subido por el coach'
}

function puedeEliminar(doc: DocumentoCoachee): boolean {
  return auth.user?.role === 'coach' || doc.subidoPorUserId === auth.user?.id
}

function onArchivo(e: Event) {
  form.archivo = (e.target as HTMLInputElement).files?.[0] ?? null
}

async function subir() {
  if (!form.archivo) return
  subiendo.value = true
  try {
    const doc = await subirDocumentoCoachee(
      { tipo: form.tipo, descripcion: form.descripcion.trim() || undefined, archivo: form.archivo },
      props.coacheeId,
    )
    documentos.value = [doc, ...documentos.value]
    form.descripcion = ''
    form.archivo = null
    if (inputArchivo.value) inputArchivo.value.value = ''
    await notifySuccess('Documento subido', 'Ya lo pueden ver el coach, el coachee y la empresa.')
  } catch (err) {
    await notifyError('No se pudo subir el documento', err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.')
  } finally {
    subiendo.value = false
  }
}

async function eliminar(doc: DocumentoCoachee) {
  const ok = await confirmDialog({
    title: '¿Eliminar este documento?',
    text: `"${doc.archivoNombre}" dejará de estar disponible para todos.`,
    confirmText: 'Eliminar',
    danger: true,
  })
  if (!ok) return
  try {
    await eliminarDocumentoCoachee(doc.id)
    documentos.value = documentos.value.filter((d) => d.id !== doc.id)
  } catch (err) {
    await notifyError('No se pudo eliminar', err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.')
  }
}

async function descargar(doc: DocumentoCoachee) {
  try {
    await descargarDocumentoCoachee(doc)
  } catch (err) {
    await notifyError('No se pudo descargar', err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.')
  }
}
</script>

<template>
  <div class="space-y-3">
    <ul
      class="flex flex-wrap gap-2"
      aria-label="Documentos básicos del proceso"
    >
      <li
        v-for="b in basicos"
        :key="b.valor"
        class="rounded-full px-2.5 py-1 text-xs font-medium"
        :class="b.cargado
          ? 'bg-[var(--color-sage)]/15 text-[var(--color-sage)]'
          : 'bg-[var(--color-bronze)]/12 text-[var(--color-bronze)]'"
      >
        {{ b.cargado ? '✓' : '○' }} {{ b.label }}{{ b.cargado ? '' : ' — falta' }}
      </li>
    </ul>

    <p
      v-if="cargando"
      class="text-sm text-[var(--color-muted)]"
    >
      Cargando…
    </p>
    <ul
      v-else-if="documentos.length > 0"
      class="space-y-2"
    >
      <li
        v-for="d in documentos"
        :key="d.id"
        class="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-[var(--color-line)] p-2.5 text-sm"
      >
        <div class="min-w-0">
          <p class="font-medium">
            {{ labelTipo(d.tipo) }}<span
              v-if="d.descripcion"
              class="font-normal text-[var(--color-ink)]/70"
            > · {{ d.descripcion }}</span>
          </p>
          <p class="truncate text-xs text-[var(--color-muted)]">
            {{ d.archivoNombre }} · {{ quienSubio(d) }} · {{ new Date(d.createdAt).toLocaleDateString('es-CL') }}
          </p>
        </div>
        <div class="flex shrink-0 items-center gap-3">
          <button
            type="button"
            class="text-xs text-[var(--color-saltup-ink)] hover:underline"
            @click="descargar(d)"
          >
            Descargar
          </button>
          <button
            v-if="puedeEliminar(d)"
            type="button"
            class="text-xs text-[var(--color-danger)]/70 hover:underline"
            @click="eliminar(d)"
          >
            Eliminar
          </button>
        </div>
      </li>
    </ul>
    <p
      v-else
      class="text-sm text-[var(--color-muted)]"
    >
      Todavía no hay documentos cargados.
    </p>

    <form
      class="grid gap-2 border-t border-[var(--color-line)] pt-3 sm:grid-cols-2"
      @submit.prevent="subir"
    >
      <label class="block text-xs">
        Tipo de documento
        <select
          v-model="form.tipo"
          class="mt-0.5 w-full rounded-lg border border-[var(--color-line)] px-2 py-1.5 text-sm"
        >
          <option
            v-for="t in TIPOS_DOCUMENTO_COACHEE"
            :key="t.valor"
            :value="t.valor"
          >
            {{ t.label }}
          </option>
        </select>
      </label>
      <label class="block text-xs">
        Descripción (opcional)
        <input
          v-model="form.descripcion"
          type="text"
          placeholder="Ej. Evaluación 2025"
          class="mt-0.5 w-full rounded-lg border border-[var(--color-line)] px-2 py-1.5 text-sm"
        >
      </label>
      <label class="block text-xs sm:col-span-2">
        Archivo (PDF, Word, Excel o imagen — máx. 20 MB)
        <input
          ref="inputArchivo"
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,image/jpeg,image/png,image/webp"
          class="mt-0.5 block w-full text-xs file:mr-2 file:rounded-full file:border-0 file:bg-[var(--color-primary)] file:px-3 file:py-1 file:text-xs file:text-[var(--color-on-primary)]"
          @change="onArchivo"
        >
      </label>
      <button
        type="submit"
        class="w-fit rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-xs text-[var(--color-on-primary)] disabled:opacity-50"
        :disabled="subiendo || !form.archivo"
      >
        {{ subiendo ? 'Subiendo…' : 'Subir documento' }}
      </button>
    </form>
  </div>
</template>
