<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import AppShell from '../../components/AppShell.vue'
import AppModal from '../../components/AppModal.vue'
import IconButton from '../../components/IconButton.vue'
import StatusToggle from '../../components/StatusToggle.vue'
import SectionCard from '../../components/SectionCard.vue'
import SkeletonBlock from '../../components/SkeletonBlock.vue'
import {
  actualizarParametro,
  crearParametro,
  eliminarParametro,
  listarParametros,
  type ParametroConfiguracion,
} from '../../api/configuracion'
import { ApiError } from '../../api/client'
import { notifyError, notifySuccess, confirmDialog } from '../../lib/notify'

const loading = ref(true)
const parametros = ref<ParametroConfiguracion[]>([])
const filtroGrupo = ref('')

async function load() {
  loading.value = true
  parametros.value = await listarParametros()
  loading.value = false
}

onMounted(load)

// Un grupo puede ser un "índice" (su valor apunta a otro grupo, como RETROALIMENTACION_BLOQUES)
// o una hoja con los propios parámetros — se listan juntos, agrupados, en el orden en que
// aparecen por primera vez (mismo orden clave ASC que ya trae el backend).
const grupos = computed(() => [...new Set(parametros.value.map((p) => p.grupo))])

const filtrados = computed(() =>
  filtroGrupo.value ? parametros.value.filter((p) => p.grupo === filtroGrupo.value) : parametros.value,
)

const agrupados = computed(() => {
  const mapa = new Map<string, ParametroConfiguracion[]>()
  for (const p of filtrados.value) {
    if (!mapa.has(p.grupo)) mapa.set(p.grupo, [])
    mapa.get(p.grupo)!.push(p)
  }
  return [...mapa.entries()]
})

async function toggleEstado(parametro: ParametroConfiguracion) {
  try {
    await actualizarParametro(parametro.id, { estado: !parametro.estado })
    await load()
  } catch (err) {
    await notifyError('No se pudo cambiar el estado', err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.')
  }
}

// --- Modal de creación/edición ---
const modalOpen = ref(false)
const editando = ref<ParametroConfiguracion | null>(null)
const guardando = ref(false)
const form = reactive({ grupo: '', clave: '', valor: '', estado: true })
const errors = reactive<{ grupo?: string; clave?: string; valor?: string }>({})
const serverError = ref<string | null>(null)

function abrirCrear() {
  editando.value = null
  form.grupo = filtroGrupo.value || ''
  form.clave = ''
  form.valor = ''
  form.estado = true
  errors.grupo = undefined
  errors.clave = undefined
  errors.valor = undefined
  serverError.value = null
  modalOpen.value = true
}

function abrirEditar(parametro: ParametroConfiguracion) {
  editando.value = parametro
  form.grupo = parametro.grupo
  form.clave = parametro.clave
  form.valor = parametro.valor
  form.estado = parametro.estado
  errors.grupo = undefined
  errors.clave = undefined
  errors.valor = undefined
  serverError.value = null
  modalOpen.value = true
}

function validar(): boolean {
  errors.grupo = form.grupo.trim() ? undefined : 'Ingresa un grupo.'
  errors.clave = form.clave.trim() ? undefined : 'Ingresa una clave.'
  errors.valor = form.valor.trim() ? undefined : 'Ingresa un valor.'
  return !errors.grupo && !errors.clave && !errors.valor
}

async function guardar() {
  if (!validar()) return
  guardando.value = true
  serverError.value = null
  try {
    if (editando.value) {
      await actualizarParametro(editando.value.id, {
        grupo: form.grupo.trim(),
        clave: form.clave.trim(),
        valor: form.valor.trim(),
        estado: form.estado,
      })
    } else {
      await crearParametro({
        grupo: form.grupo.trim(),
        clave: form.clave.trim(),
        valor: form.valor.trim(),
        estado: form.estado,
      })
    }
    modalOpen.value = false
    await load()
    await notifySuccess(editando.value ? 'Parámetro actualizado' : 'Parámetro creado')
  } catch (err) {
    serverError.value = err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.'
  } finally {
    guardando.value = false
  }
}

async function eliminar(parametro: ParametroConfiguracion) {
  const confirmado = await confirmDialog({
    title: '¿Eliminar este parámetro?',
    text: `Se eliminará "${parametro.valor}" (${parametro.grupo} / ${parametro.clave}) de forma definitiva.`,
    confirmText: 'Eliminar',
    danger: true,
  })
  if (!confirmado) return
  try {
    await eliminarParametro(parametro.id)
    await load()
    await notifySuccess('Parámetro eliminado')
  } catch (err) {
    await notifyError('No se pudo eliminar', err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.')
  }
}
</script>

<template>
  <AppShell>
    <div class="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 class="font-[family-name:var(--font-heading)] text-xl font-semibold">
          Configuración
        </h1>
        <p class="text-sm text-[var(--color-ink)]/60">
          Datos parametrizables del sistema — grupo, clave, valor y estado. Editables sin
          necesidad de un despliegue.
        </p>
      </div>
      <button
        class="rounded-lg bg-[var(--color-ink)] px-4 py-2 text-sm font-medium text-[var(--color-parchment)]"
        @click="abrirCrear"
      >
        + Nuevo parámetro
      </button>
    </div>

    <SkeletonBlock v-if="loading" />
    <div
      v-else
      class="space-y-4"
    >
      <div class="flex flex-wrap items-center gap-2">
        <select
          v-model="filtroGrupo"
          class="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-sm"
        >
          <option value="">
            Grupo: Todos
          </option>
          <option
            v-for="g in grupos"
            :key="g"
            :value="g"
          >
            {{ g }}
          </option>
        </select>
        <span class="ml-auto text-xs text-[var(--color-ink)]/50">{{ filtrados.length }} parámetro(s)</span>
      </div>

      <SectionCard
        v-for="[grupo, filas] in agrupados"
        :key="grupo"
        :title="grupo"
        icon="configuracion"
      >
        <div class="overflow-x-auto rounded-xl border border-[var(--color-line)]">
          <table class="w-full text-left text-sm">
            <thead>
              <tr class="border-b border-[var(--color-line)] bg-[var(--color-parchment)] text-xs text-[var(--color-ink)]/60">
                <th class="w-16 px-4 py-2.5">
                  Clave
                </th>
                <th class="px-4 py-2.5">
                  Valor
                </th>
                <th class="w-28 px-4 py-2.5">
                  Estado
                </th>
                <th class="w-24 px-4 py-2.5">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="p in filas"
                :key="p.id"
                class="border-b border-[var(--color-line)] align-top last:border-0"
              >
                <td class="px-4 py-3 font-[family-name:var(--font-mono)] text-xs text-[var(--color-ink)]/60">
                  {{ p.clave }}
                </td>
                <td class="px-4 py-3">
                  {{ p.valor }}
                </td>
                <td class="px-4 py-3">
                  <StatusToggle
                    :active="p.estado"
                    @toggle="toggleEstado(p)"
                  />
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <IconButton
                      icon="editar"
                      title="Editar"
                      @click="abrirEditar(p)"
                    />
                    <IconButton
                      icon="eliminar"
                      title="Eliminar"
                      @click="eliminar(p)"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>

    <AppModal
      v-if="modalOpen"
      :title="editando ? 'Editar parámetro' : 'Nuevo parámetro'"
      @close="modalOpen = false"
    >
      <form
        class="space-y-4"
        @submit.prevent="guardar"
      >
        <p
          v-if="serverError"
          class="text-sm text-[var(--color-danger)]"
        >
          {{ serverError }}
        </p>
        <label class="block text-sm">
          Grupo
          <input
            v-model="form.grupo"
            type="text"
            class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            :class="errors.grupo ? 'border-[var(--color-danger)]' : 'border-[var(--color-line)]'"
          >
          <span
            v-if="errors.grupo"
            class="mt-1 block text-xs text-[var(--color-danger)]"
          >{{ errors.grupo }}</span>
        </label>
        <label class="block text-sm">
          Clave
          <input
            v-model="form.clave"
            type="text"
            class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            :class="errors.clave ? 'border-[var(--color-danger)]' : 'border-[var(--color-line)]'"
          >
          <span
            v-if="errors.clave"
            class="mt-1 block text-xs text-[var(--color-danger)]"
          >{{ errors.clave }}</span>
        </label>
        <label class="block text-sm">
          Valor
          <textarea
            v-model="form.valor"
            rows="3"
            class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            :class="errors.valor ? 'border-[var(--color-danger)]' : 'border-[var(--color-line)]'"
          />
          <span
            v-if="errors.valor"
            class="mt-1 block text-xs text-[var(--color-danger)]"
          >{{ errors.valor }}</span>
        </label>
        <label class="flex items-center gap-2 text-sm">
          <input
            v-model="form.estado"
            type="checkbox"
            class="h-4 w-4 rounded border-[var(--color-line)]"
          >
          Activo
        </label>

        <div class="flex justify-end gap-2 pt-2">
          <button
            type="button"
            class="rounded-lg border border-[var(--color-line)] px-4 py-2 text-sm"
            @click="modalOpen = false"
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
