<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import AppShell from '../../components/AppShell.vue'
import SectionCard from '../../components/SectionCard.vue'
import EmptyState from '../../components/EmptyState.vue'
import AppModal from '../../components/AppModal.vue'
import SkeletonBlock from '../../components/SkeletonBlock.vue'
import {
  createCompetenciaEmpresa,
  deleteCompetenciaEmpresa,
  listMisCompetenciasEmpresa,
  updateCompetenciaEmpresa,
  type Competencia,
  type NivelCompetencia,
} from '../../api/competencias'
import { ApiError } from '../../api/client'
import { confirmDialog, notifyError, notifySuccess } from '../../lib/notify'

const loading = ref(true)
const competencias = ref<Competencia[]>([])

async function load() {
  loading.value = true
  competencias.value = await listMisCompetenciasEmpresa()
  loading.value = false
}

onMounted(load)

// --- Modal de crear/editar ---
const modalAbierto = ref(false)
const editando = ref<Competencia | null>(null)
const form = reactive<{ nombre: string; definicion: string; niveles: NivelCompetencia[] }>({
  nombre: '',
  definicion: '',
  niveles: [],
})
const guardando = ref(false)
const error = ref<string | null>(null)

// La plantilla real de Ferronor siempre trae 4 niveles — se arranca con esa forma para no
// obligar a agregarlos uno por uno, pero quedan libres de agregar/quitar.
function nivelesPorDefecto(): NivelCompetencia[] {
  return [1, 2, 3, 4].map((nivel) => ({ nivel, descripcion: '' }))
}

function abrirCrear() {
  editando.value = null
  form.nombre = ''
  form.definicion = ''
  form.niveles = nivelesPorDefecto()
  error.value = null
  modalAbierto.value = true
}

function abrirEditar(competencia: Competencia) {
  editando.value = competencia
  form.nombre = competencia.nombre
  form.definicion = competencia.definicion
  form.niveles = competencia.niveles.map((n) => ({ ...n }))
  error.value = null
  modalAbierto.value = true
}

function agregarNivel() {
  const siguiente = form.niveles.length
    ? Math.max(...form.niveles.map((n) => n.nivel)) + 1
    : 1
  form.niveles.push({ nivel: siguiente, descripcion: '' })
}

function quitarNivel(index: number) {
  form.niveles.splice(index, 1)
}

async function guardar() {
  if (!form.nombre.trim() || !form.definicion.trim()) return
  if (form.niveles.length === 0 || form.niveles.some((n) => !n.descripcion.trim())) {
    error.value = 'Cada nivel necesita su descripción.'
    return
  }
  guardando.value = true
  error.value = null
  const input = {
    nombre: form.nombre.trim(),
    definicion: form.definicion.trim(),
    niveles: form.niveles,
  }
  try {
    if (editando.value) {
      const actualizada = await updateCompetenciaEmpresa(editando.value.id, input)
      const idx = competencias.value.findIndex((c) => c.id === actualizada.id)
      if (idx !== -1) competencias.value[idx] = actualizada
    } else {
      competencias.value = [...competencias.value, await createCompetenciaEmpresa(input)]
    }
    modalAbierto.value = false
    await notifySuccess(editando.value ? 'Competencia actualizada' : 'Competencia creada')
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'No se pudo guardar la competencia.'
  } finally {
    guardando.value = false
  }
}

async function eliminar(competencia: Competencia) {
  const confirmado = await confirmDialog({
    title: '¿Eliminar esta competencia?',
    text: `Se eliminará «${competencia.nombre}» de forma definitiva.`,
    confirmText: 'Eliminar',
    danger: true,
  })
  if (!confirmado) return
  try {
    await deleteCompetenciaEmpresa(competencia.id)
    competencias.value = competencias.value.filter((c) => c.id !== competencia.id)
    await notifySuccess('Competencia eliminada')
  } catch (err) {
    await notifyError(
      'No se pudo eliminar',
      err instanceof ApiError ? err.message : undefined,
    )
  }
}
</script>

<template>
  <AppShell>
    <h1 class="mb-1 font-[family-name:var(--font-heading)] text-xl font-semibold">
      Competencias
    </h1>
    <p class="mb-4 text-sm text-[var(--color-ink)]/60">
      Define las competencias propias de tu empresa — tu coach las va a ver y elegir cuál le
      corresponde desarrollar a cada coachee.
    </p>

    <SkeletonBlock v-if="loading" />
    <SectionCard v-else>
      <div class="mb-4 flex items-center justify-between">
        <p class="text-sm font-medium">
          {{ competencias.length }} competencia{{ competencias.length === 1 ? '' : 's' }}
        </p>
        <button
          class="rounded-lg bg-[var(--color-ink)] px-3 py-2 text-xs font-medium text-[var(--color-parchment)]"
          @click="abrirCrear"
        >
          + Nueva competencia
        </button>
      </div>

      <EmptyState
        v-if="competencias.length === 0"
        icon="objetivo"
        title="Todavía no has cargado ninguna competencia"
        description="Crea la primera para que tu coach pueda asignarla a tus coachees."
      />
      <ul
        v-else
        class="space-y-3"
      >
        <li
          v-for="c in competencias"
          :key="c.id"
          class="rounded-xl border border-[var(--color-line)] p-4"
        >
          <div class="mb-2 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p class="font-[family-name:var(--font-heading)] text-sm font-semibold">
                {{ c.nombre }}
              </p>
              <p class="mt-1 text-sm text-[var(--color-ink)]/70">
                {{ c.definicion }}
              </p>
            </div>
            <div class="flex shrink-0 gap-2">
              <button
                class="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-xs hover:bg-[var(--color-parchment)]/50"
                @click="abrirEditar(c)"
              >
                Editar
              </button>
              <button
                class="rounded-lg border border-[var(--color-danger)]/30 px-3 py-1.5 text-xs text-[var(--color-danger)] hover:bg-[var(--color-danger)]/5"
                @click="eliminar(c)"
              >
                Eliminar
              </button>
            </div>
          </div>
          <ul class="mt-3 space-y-1.5 border-t border-[var(--color-line)] pt-3 text-xs">
            <li
              v-for="n in [...c.niveles].sort((a, b) => a.nivel - b.nivel)"
              :key="n.nivel"
              class="flex gap-2"
            >
              <span class="shrink-0 font-[family-name:var(--font-mono)] font-semibold text-[var(--color-ink)]/60">
                Nivel {{ n.nivel }}
              </span>
              <span class="text-[var(--color-ink)]/70">{{ n.descripcion }}</span>
            </li>
          </ul>
        </li>
      </ul>
    </SectionCard>

    <AppModal
      v-if="modalAbierto"
      :title="editando ? 'Editar competencia' : 'Nueva competencia'"
      size="lg"
      @close="modalAbierto = false"
    >
      <form
        class="space-y-4"
        @submit.prevent="guardar"
      >
        <p
          v-if="error"
          class="text-sm text-[var(--color-danger)]"
        >
          {{ error }}
        </p>

        <label class="block text-sm">
          Nombre de la competencia
          <input
            v-model="form.nombre"
            type="text"
            required
            placeholder="ej. Seguridad Integral"
            class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
          >
        </label>

        <label class="block text-sm">
          Descripción general
          <textarea
            v-model="form.definicion"
            rows="3"
            required
            placeholder="Qué significa esta competencia en tu empresa…"
            class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
          />
        </label>

        <div>
          <div class="mb-2 flex items-center justify-between">
            <p class="text-sm font-medium">
              Niveles
            </p>
            <button
              type="button"
              class="text-xs text-[var(--color-saltup)] hover:underline"
              @click="agregarNivel"
            >
              + Agregar nivel
            </button>
          </div>
          <div class="space-y-3">
            <div
              v-for="(nivel, i) in form.niveles"
              :key="i"
              class="flex gap-2 rounded-lg border border-[var(--color-line)] p-3"
            >
              <input
                v-model.number="nivel.nivel"
                type="number"
                min="1"
                class="h-fit w-16 shrink-0 rounded border border-[var(--color-line)] px-2 py-1 text-sm"
              >
              <textarea
                v-model="nivel.descripcion"
                rows="2"
                placeholder="Descripción del comportamiento esperado en este nivel…"
                class="flex-1 rounded border border-[var(--color-line)] px-2 py-1 text-sm"
              />
              <button
                type="button"
                class="h-fit shrink-0 text-xs text-[var(--color-danger)] hover:underline"
                @click="quitarNivel(i)"
              >
                Quitar
              </button>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button
            type="button"
            class="rounded-lg border border-[var(--color-line)] px-4 py-2 text-sm"
            @click="modalAbierto = false"
          >
            Cancelar
          </button>
          <button
            type="submit"
            :disabled="guardando"
            class="rounded-lg bg-[var(--color-ink)] px-4 py-2 text-sm text-[var(--color-parchment)] disabled:opacity-60"
          >
            {{ guardando ? 'Guardando…' : 'Guardar' }}
          </button>
        </div>
      </form>
    </AppModal>
  </AppShell>
</template>
