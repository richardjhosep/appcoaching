<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import AppShell from '../../components/AppShell.vue'
import AppModal from '../../components/AppModal.vue'
import CarpetaArbol from '../../components/CarpetaArbol.vue'
import RecursoIcono from '../../components/RecursoIcono.vue'
import {
  crearCarpeta,
  listCarpetas,
  renombrarCarpeta,
  setCarpetaPublica,
  removeCarpeta,
  asignarCarpeta,
  getAsignacionesDeCarpeta,
  revocarCarpeta,
  type Carpeta,
} from '../../api/carpetas'
import {
  crearRecurso,
  listRecursos,
  removeRecurso,
  asignarRecurso,
  getAsignacionesDeRecurso,
  type Recurso,
  type TipoRecurso,
} from '../../api/recursos'
import { listCoachees, type CoacheeListItem } from '../../api/coachees'
import { ApiError } from '../../api/client'
import { notifyError, notifySuccess, confirmDialog, promptDialog } from '../../lib/notify'
import { buildArbol, breadcrumbDe, idsHastaRaiz } from '../../lib/carpetaArbol'

const loading = ref(true)
const carpetas = ref<Carpeta[]>([])
const coachees = ref<CoacheeListItem[]>([])
const recursos = ref<Recurso[]>([])
const seleccionadaId = ref<string | null>(null)
const expandidas = ref<Set<string>>(new Set())

const arbol = computed(() => buildArbol(carpetas.value))
const migas = computed(() => breadcrumbDe(carpetas.value, seleccionadaId.value))
const carpetaActual = computed(() => migas.value.at(-1) ?? null)
const subcarpetas = computed(() =>
  [...carpetas.value]
    .filter((c) => c.parentId === seleccionadaId.value)
    .sort((a, b) => a.nombre.localeCompare(b.nombre)),
)

function seleccionar(id: string | null) {
  seleccionadaId.value = id
  if (id) expandidas.value = new Set([...expandidas.value, ...idsHastaRaiz(carpetas.value, id)])
}

async function loadRecursos() {
  recursos.value = seleccionadaId.value ? await listRecursos(seleccionadaId.value) : []
}

onMounted(async () => {
  const [cs, cc] = await Promise.all([listCarpetas(), listCoachees()])
  carpetas.value = cs
  coachees.value = cc
  loading.value = false
})

watch(seleccionadaId, loadRecursos)

// --- Carpetas: crear / renombrar / eliminar --------------------------------

async function crearRaiz() {
  const nombre = await promptDialog({ title: 'Nueva carpeta', inputLabel: 'Nombre' })
  if (!nombre) return
  try {
    const carpeta = await crearCarpeta(nombre)
    carpetas.value = [...carpetas.value, carpeta]
    seleccionar(carpeta.id)
  } catch (err) {
    await notifyError('No se pudo crear la carpeta', err instanceof ApiError ? err.message : undefined)
  }
}

async function crearSub() {
  const padre = carpetaActual.value
  if (!padre) return
  const nombre = await promptDialog({ title: `Nueva subcarpeta en «${padre.nombre}»`, inputLabel: 'Nombre' })
  if (!nombre) return
  try {
    const carpeta = await crearCarpeta(nombre, padre.id)
    carpetas.value = [...carpetas.value, carpeta]
    expandidas.value = new Set([...expandidas.value, padre.id])
    seleccionar(carpeta.id)
  } catch (err) {
    await notifyError('No se pudo crear la subcarpeta', err instanceof ApiError ? err.message : undefined)
  }
}

async function renombrar() {
  const carpeta = carpetaActual.value
  if (!carpeta) return
  const nombre = await promptDialog({
    title: 'Renombrar carpeta',
    inputLabel: 'Nombre',
    inputValue: carpeta.nombre,
  })
  if (!nombre || nombre === carpeta.nombre) return
  try {
    const actualizada = await renombrarCarpeta(carpeta.id, nombre)
    carpetas.value = carpetas.value.map((c) => (c.id === actualizada.id ? actualizada : c))
  } catch (err) {
    await notifyError('No se pudo renombrar la carpeta', err instanceof ApiError ? err.message : undefined)
  }
}

async function borrarCarpeta() {
  const carpeta = carpetaActual.value
  if (!carpeta) return
  const confirmado = await confirmDialog({
    title: '¿Eliminar esta carpeta?',
    text: `Se eliminará «${carpeta.nombre}» de forma definitiva. Debe estar vacía.`,
    confirmText: 'Eliminar',
    danger: true,
  })
  if (!confirmado) return
  try {
    await removeCarpeta(carpeta.id)
    carpetas.value = carpetas.value.filter((c) => c.id !== carpeta.id)
    seleccionar(carpeta.parentId)
    await notifySuccess('Carpeta eliminada')
  } catch (err) {
    await notifyError('No se pudo eliminar la carpeta', err instanceof ApiError ? err.message : undefined)
  }
}

// --- Recursos: subir / eliminar --------------------------------------------

const form = reactive({ titulo: '', tipo: 'link' as TipoRecurso, url: '', descripcion: '' })
const archivoSeleccionado = ref<File | null>(null)
const creando = ref(false)

function onArchivoChange(event: Event) {
  const input = event.target as HTMLInputElement
  archivoSeleccionado.value = input.files?.[0] ?? null
}

async function crear() {
  if (!form.titulo.trim() || !seleccionadaId.value) return
  creando.value = true
  try {
    const recurso = await crearRecurso({
      titulo: form.titulo.trim(),
      tipo: form.tipo,
      carpetaId: seleccionadaId.value,
      url: form.tipo === 'link' ? form.url.trim() : undefined,
      descripcion: form.descripcion.trim() || undefined,
      archivo: form.tipo === 'archivo' ? (archivoSeleccionado.value ?? undefined) : undefined,
    })
    recursos.value = [recurso, ...recursos.value]
    form.titulo = ''
    form.url = ''
    form.descripcion = ''
    archivoSeleccionado.value = null
  } catch (err) {
    await notifyError('No se pudo subir el archivo', err instanceof ApiError ? err.message : undefined)
  } finally {
    creando.value = false
  }
}

async function borrarRecurso(recurso: Recurso) {
  const confirmado = await confirmDialog({
    title: '¿Eliminar este archivo?',
    text: `Se eliminará «${recurso.titulo}» de forma definitiva.`,
    confirmText: 'Eliminar',
    danger: true,
  })
  if (!confirmado) return
  try {
    await removeRecurso(recurso.id)
    recursos.value = recursos.value.filter((r) => r.id !== recurso.id)
  } catch (err) {
    await notifyError('No se pudo eliminar el archivo', err instanceof ApiError ? err.message : undefined)
  }
}

// --- Gestionar acceso (carpeta o archivo individual) ------------------------

type AccesoTarget = { tipo: 'carpeta'; carpeta: Carpeta } | { tipo: 'recurso'; recurso: Recurso }

const accesoAbierto = ref<AccesoTarget | null>(null)
const accesoLista = ref<{ coacheeId: string; expiraEn: string | null }[]>([])
const personaBusqueda = ref('')
const vencimientoPorCoachee = reactive<Record<string, string>>({})

const accesoTitulo = computed(() => {
  if (!accesoAbierto.value) return ''
  return accesoAbierto.value.tipo === 'carpeta'
    ? `Gestionar acceso — ${accesoAbierto.value.carpeta.nombre}`
    : `Compartir archivo — ${accesoAbierto.value.recurso.titulo}`
})

const coacheesFiltrados = computed(() => {
  const q = personaBusqueda.value.trim().toLowerCase()
  if (!q) return coachees.value
  return coachees.value.filter(
    (c) => c.nombre.toLowerCase().includes(q) || c.user?.email?.toLowerCase().includes(q),
  )
})

async function abrirAccesoCarpeta() {
  const carpeta = carpetaActual.value
  if (!carpeta) return
  accesoAbierto.value = { tipo: 'carpeta', carpeta }
  personaBusqueda.value = ''
  const asignaciones = await getAsignacionesDeCarpeta(carpeta.id)
  accesoLista.value = asignaciones.map((a) => ({ coacheeId: a.coacheeId, expiraEn: a.expiraEn }))
}

async function abrirAccesoRecurso(recurso: Recurso) {
  accesoAbierto.value = { tipo: 'recurso', recurso }
  personaBusqueda.value = ''
  const asignaciones = await getAsignacionesDeRecurso(recurso.id)
  accesoLista.value = asignaciones.map((a) => ({ coacheeId: a.coacheeId, expiraEn: a.expiraEn }))
}

function cerrarAcceso() {
  accesoAbierto.value = null
}

function accesoOtorgadaA(coacheeId: string): boolean {
  return accesoLista.value.some((a) => a.coacheeId === coacheeId)
}

function accesoExpirada(coacheeId: string): boolean {
  const a = accesoLista.value.find((x) => x.coacheeId === coacheeId)
  return !!a?.expiraEn && new Date(a.expiraEn) <= new Date()
}

function accesoTextoVencimiento(coacheeId: string): string {
  const a = accesoLista.value.find((x) => x.coacheeId === coacheeId)
  if (!a?.expiraEn) return 'Acceso permanente'
  const fecha = new Date(a.expiraEn).toLocaleString('es-CL', { dateStyle: 'medium', timeStyle: 'short' })
  return accesoExpirada(coacheeId) ? `Expiró el ${fecha}` : `Hasta el ${fecha}`
}

async function otorgarAcceso(coacheeId: string) {
  if (!accesoAbierto.value) return
  const local = vencimientoPorCoachee[coacheeId]
  const expiraEn = local ? new Date(local).toISOString() : undefined
  try {
    if (accesoAbierto.value.tipo === 'carpeta') {
      await asignarCarpeta(accesoAbierto.value.carpeta.id, coacheeId, true, expiraEn)
    } else {
      await asignarRecurso(accesoAbierto.value.recurso.id, coacheeId, true, expiraEn)
    }
    accesoLista.value = [
      ...accesoLista.value.filter((a) => a.coacheeId !== coacheeId),
      { coacheeId, expiraEn: expiraEn ?? null },
    ]
    delete vencimientoPorCoachee[coacheeId]
  } catch (err) {
    await notifyError('No se pudo otorgar el acceso', err instanceof ApiError ? err.message : undefined)
  }
}

async function quitarAcceso(coacheeId: string) {
  if (!accesoAbierto.value) return
  try {
    if (accesoAbierto.value.tipo === 'carpeta') {
      await revocarCarpeta(accesoAbierto.value.carpeta.id, coacheeId)
    } else {
      await asignarRecurso(accesoAbierto.value.recurso.id, coacheeId, false)
    }
    accesoLista.value = accesoLista.value.filter((a) => a.coacheeId !== coacheeId)
  } catch (err) {
    await notifyError('No se pudo quitar el acceso', err instanceof ApiError ? err.message : undefined)
  }
}

async function alternarPublica() {
  if (!accesoAbierto.value || accesoAbierto.value.tipo !== 'carpeta') return
  const carpeta = accesoAbierto.value.carpeta
  try {
    const actualizada = await setCarpetaPublica(carpeta.id, !carpeta.publica)
    carpetas.value = carpetas.value.map((c) => (c.id === actualizada.id ? actualizada : c))
    accesoAbierto.value = { tipo: 'carpeta', carpeta: actualizada }
  } catch (err) {
    await notifyError('No se pudo actualizar la visibilidad', err instanceof ApiError ? err.message : undefined)
  }
}
</script>

<template>
  <AppShell>
    <h1 class="mb-4 font-[family-name:var(--font-heading)] text-xl font-semibold">
      Biblioteca de recursos
    </h1>

    <div
      v-if="loading"
      class="text-sm text-[var(--color-ink)]/60"
    >
      Cargando…
    </div>

    <div
      v-else
      class="flex flex-col gap-5 lg:flex-row"
    >
      <aside class="rounded-2xl border border-[var(--color-line)] bg-white p-3 lg:w-64 lg:shrink-0">
        <div class="mb-2 flex items-center justify-between px-1">
          <span class="text-xs font-medium uppercase tracking-wide text-[var(--color-ink)]/45">Carpetas</span>
          <button
            class="text-xs text-[var(--color-sage)] hover:underline"
            @click="crearRaiz"
          >
            + Nueva
          </button>
        </div>
        <button
          class="mb-1 w-full rounded-lg px-2 py-1.5 text-left text-sm transition-colors"
          :class="seleccionadaId === null ? 'bg-[var(--color-ink)] text-[var(--color-parchment)]' : 'hover:bg-[var(--color-parchment)]/70'"
          @click="seleccionar(null)"
        >
          Todas las carpetas
        </button>
        <p
          v-if="arbol.length === 0"
          class="px-2 py-1 text-xs text-[var(--color-ink)]/50"
        >
          Aún no hay carpetas.
        </p>
        <CarpetaArbol
          v-else
          v-model:expandidas="expandidas"
          :nodos="arbol"
          :seleccionada-id="seleccionadaId"
          @select="seleccionar"
        />
      </aside>

      <div class="min-w-0 flex-1">
        <div
          v-if="!carpetaActual"
          class="flex flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-[var(--color-line)] py-16 text-center text-sm text-[var(--color-ink)]/50"
        >
          <p>Selecciona una carpeta para ver su contenido,</p>
          <p>o crea la primera desde el panel de la izquierda.</p>
        </div>

        <template v-else>
          <nav class="mb-3 flex flex-wrap items-center gap-1 text-sm text-[var(--color-ink)]/60">
            <button
              class="hover:text-[var(--color-ink)] hover:underline"
              @click="seleccionar(null)"
            >
              Todas las carpetas
            </button>
            <template
              v-for="(m, i) in migas"
              :key="m.id"
            >
              <span class="opacity-40">/</span>
              <button
                class="hover:underline"
                :class="i === migas.length - 1 ? 'font-medium text-[var(--color-ink)]' : 'hover:text-[var(--color-ink)]'"
                @click="seleccionar(m.id)"
              >
                {{ m.nombre }}
              </button>
            </template>
          </nav>

          <div class="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--color-line)] bg-white p-4">
            <div class="flex items-center gap-2">
              <h2 class="font-[family-name:var(--font-heading)] text-lg font-semibold">
                {{ carpetaActual.nombre }}
              </h2>
              <span
                class="rounded-full px-2 py-0.5 text-[11px] font-medium"
                :class="carpetaActual.publica
                  ? 'bg-[color-mix(in_srgb,var(--color-sage)_15%,white)] text-[var(--color-sage)]'
                  : 'bg-[color-mix(in_srgb,var(--color-bronze)_15%,white)] text-[var(--color-bronze)]'"
              >
                {{ carpetaActual.publica ? 'Pública' : 'Privada' }}
              </span>
            </div>
            <div class="flex flex-wrap items-center gap-2 text-xs">
              <button
                class="rounded-lg border border-[var(--color-line)] px-3 py-1.5 hover:bg-[var(--color-parchment)]/50"
                @click="crearSub"
              >
                + Subcarpeta
              </button>
              <button
                class="rounded-lg border border-[var(--color-line)] px-3 py-1.5 hover:bg-[var(--color-parchment)]/50"
                @click="renombrar"
              >
                Renombrar
              </button>
              <button
                class="rounded-lg border border-[var(--color-line)] px-3 py-1.5 hover:bg-[var(--color-parchment)]/50"
                @click="abrirAccesoCarpeta"
              >
                Gestionar acceso
              </button>
              <button
                class="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-[var(--color-danger)] hover:bg-red-50"
                @click="borrarCarpeta"
              >
                Eliminar
              </button>
            </div>
          </div>

          <div class="mb-4 grid gap-3 rounded-2xl border border-[var(--color-line)] bg-white p-4 sm:grid-cols-2">
            <label class="text-sm sm:col-span-2">
              Título
              <input
                v-model="form.titulo"
                type="text"
                class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
              >
            </label>
            <label class="text-sm">
              Tipo
              <select
                v-model="form.tipo"
                class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
              >
                <option value="link">
                  Link
                </option>
                <option value="archivo">
                  Archivo
                </option>
              </select>
            </label>
            <label
              v-if="form.tipo === 'link'"
              class="text-sm"
            >
              URL
              <input
                v-model="form.url"
                type="url"
                class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
              >
            </label>
            <label
              v-else
              class="text-sm"
            >
              Archivo
              <input
                type="file"
                class="mt-1 w-full text-sm"
                @change="onArchivoChange"
              >
            </label>
            <label class="text-sm sm:col-span-2">
              Descripción (opcional)
              <input
                v-model="form.descripcion"
                type="text"
                class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
              >
            </label>
            <button
              class="w-fit rounded-lg bg-[var(--color-ink)] px-4 py-2 text-sm text-[var(--color-parchment)] disabled:opacity-60 sm:col-span-2"
              :disabled="creando || !form.titulo.trim()"
              @click="crear"
            >
              {{ creando ? 'Subiendo…' : `Subir a «${carpetaActual.nombre}»` }}
            </button>
          </div>

          <div
            v-if="subcarpetas.length"
            class="mb-4"
          >
            <p class="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-ink)]/45">
              Subcarpetas
            </p>
            <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              <button
                v-for="s in subcarpetas"
                :key="s.id"
                class="flex items-center gap-2 rounded-xl border border-[var(--color-line)] bg-white px-3 py-2.5 text-left text-sm transition-all hover:-translate-y-0.5 hover:border-[var(--color-sage)] hover:shadow-sm"
                @click="seleccionar(s.id)"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="shrink-0 opacity-60"
                ><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>
                <span class="min-w-0 flex-1 truncate">{{ s.nombre }}</span>
                <svg
                  v-if="!s.publica"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="shrink-0 opacity-40"
                ><rect
                  x="5"
                  y="11"
                  width="14"
                  height="9"
                  rx="2"
                /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
              </button>
            </div>
          </div>

          <p class="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-ink)]/45">
            Archivos
          </p>
          <p
            v-if="recursos.length === 0"
            class="text-sm text-[var(--color-ink)]/50"
          >
            Esta carpeta todavía no tiene archivos.
          </p>
          <div
            v-else
            class="space-y-2"
          >
            <div
              v-for="r in recursos"
              :key="r.id"
              class="flex items-center gap-3 rounded-2xl border border-[var(--color-line)] bg-white p-3"
            >
              <RecursoIcono
                :recurso="r"
                size="sm"
              />
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium">
                  {{ r.titulo }}
                </p>
                <p class="truncate text-xs text-[var(--color-ink)]/50">
                  {{ r.tipo === 'link' ? r.url : r.archivoNombre }}
                </p>
              </div>
              <button
                class="shrink-0 text-xs text-[var(--color-sage)] hover:underline"
                @click="abrirAccesoRecurso(r)"
              >
                Compartir
              </button>
              <button
                class="shrink-0 text-xs text-[var(--color-danger)] hover:underline"
                @click="borrarRecurso(r)"
              >
                Eliminar
              </button>
            </div>
          </div>
        </template>
      </div>
    </div>

    <AppModal
      v-if="accesoAbierto"
      :title="accesoTitulo"
      @close="cerrarAcceso"
    >
      <div
        v-if="accesoAbierto.tipo === 'carpeta'"
        class="mb-4 flex items-center justify-between rounded-xl bg-[var(--color-parchment)]/50 px-3 py-2.5"
      >
        <div>
          <p class="text-sm font-medium">
            {{ accesoAbierto.carpeta.publica ? 'Carpeta pública' : 'Carpeta privada' }}
          </p>
          <p class="text-xs text-[var(--color-ink)]/55">
            {{ accesoAbierto.carpeta.publica
              ? 'Visible para todos tus coachees.'
              : 'Solo ven esta carpeta las personas con acceso otorgado abajo.' }}
          </p>
        </div>
        <button
          type="button"
          class="relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors"
          :class="accesoAbierto.carpeta.publica ? 'bg-[var(--color-sage)]' : 'bg-[var(--color-line)]'"
          @click="alternarPublica"
        >
          <span
            class="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform"
            :class="accesoAbierto.carpeta.publica ? 'translate-x-4' : 'translate-x-0.5'"
          />
        </button>
      </div>
      <p
        v-else
        class="mb-4 text-xs text-[var(--color-ink)]/55"
      >
        Comparte este archivo puntualmente, aunque su carpeta sea privada.
      </p>

      <input
        v-model="personaBusqueda"
        type="text"
        placeholder="Buscar coachee por nombre o correo…"
        class="mb-3 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
      >

      <ul class="max-h-72 space-y-1 overflow-y-auto">
        <li
          v-for="c in coacheesFiltrados"
          :key="c.id"
          class="flex flex-wrap items-center justify-between gap-2 rounded-lg px-2 py-2 text-sm hover:bg-[var(--color-parchment)]/40"
        >
          <div class="min-w-0">
            <p class="truncate font-medium">
              {{ c.nombre }}
            </p>
            <p class="truncate text-xs text-[var(--color-ink)]/50">
              {{ c.user?.email }}
            </p>
          </div>
          <div class="flex shrink-0 items-center gap-2">
            <template v-if="accesoOtorgadaA(c.id)">
              <span
                class="text-xs"
                :class="accesoExpirada(c.id) ? 'text-[var(--color-danger)]' : 'text-[var(--color-sage)]'"
              >
                {{ accesoTextoVencimiento(c.id) }}
              </span>
              <button
                class="text-xs text-[var(--color-danger)] hover:underline"
                @click="quitarAcceso(c.id)"
              >
                Quitar
              </button>
            </template>
            <template v-else>
              <input
                v-model="vencimientoPorCoachee[c.id]"
                type="datetime-local"
                title="Vencimiento (opcional)"
                class="rounded-lg border border-[var(--color-line)] px-2 py-1 text-xs"
              >
              <button
                class="rounded-lg bg-[var(--color-ink)] px-2.5 py-1 text-xs text-[var(--color-parchment)]"
                @click="otorgarAcceso(c.id)"
              >
                Dar acceso
              </button>
            </template>
          </div>
        </li>
      </ul>
      <p
        v-if="coacheesFiltrados.length === 0"
        class="py-2 text-center text-sm text-[var(--color-ink)]/50"
      >
        No se encontraron coachees.
      </p>
    </AppModal>
  </AppShell>
</template>
