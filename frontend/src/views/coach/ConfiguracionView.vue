<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import AppShell from '../../components/AppShell.vue'
import AppModal from '../../components/AppModal.vue'
import IconButton from '../../components/IconButton.vue'
import StatusToggle from '../../components/StatusToggle.vue'
import SectionCard from '../../components/SectionCard.vue'
import SkeletonBlock from '../../components/SkeletonBlock.vue'
import ErrorState from '../../components/ErrorState.vue'
import EmptyState from '../../components/EmptyState.vue'
import AppButton from '../../components/AppButton.vue'
import FormField from '../../components/FormField.vue'
import {
  actualizarParametro,
  crearParametro,
  eliminarParametro,
  listarParametros,
  type ParametroConfiguracion,
} from '../../api/configuracion'
import { ApiError } from '../../api/client'
import { notifyError, notifySuccess, confirmDialog } from '../../lib/notify'
import { useCarga } from '../../lib/useCarga'
import { enfocarPrimerInvalido } from '../../lib/enfocarInvalido'

const parametros = ref<ParametroConfiguracion[]>([])
const filtroGrupo = ref('')

async function load() {
  parametros.value = await listarParametros()
}

const { loading, error, recargar } = useCarga(load)

onMounted(recargar)

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
    await recargar()
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
  const valido = !errors.grupo && !errors.clave && !errors.valor
  if (!valido) void enfocarPrimerInvalido()
  return valido
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
    await recargar()
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
    await recargar()
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
        <p class="text-sm text-[var(--color-muted)]">
          Datos parametrizables del sistema — grupo, clave, valor y estado. Editables sin
          necesidad de un despliegue.
        </p>
      </div>
      <AppButton @click="abrirCrear">
        + Nuevo parámetro
      </AppButton>
    </div>

    <SkeletonBlock
      v-if="loading"
      variant="table"
      :rows="6"
    />
    <ErrorState
      v-else-if="error"
      @retry="recargar"
    />
    <EmptyState
      v-else-if="parametros.length === 0"
      icon="configuracion"
      title="Todavía no hay parámetros"
      description="Los catálogos del sistema (fuentes de prospectos, bloques de retroalimentación, etc.) aparecerán aquí."
    >
      <AppButton @click="abrirCrear">
        Crear parámetro
      </AppButton>
    </EmptyState>
    <div
      v-else
      class="space-y-4"
    >
      <div class="flex flex-wrap items-center gap-2">
        <select
          v-model="filtroGrupo"
          aria-label="Filtrar por grupo"
          class="field-input w-auto"
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
        <span class="ml-auto text-xs text-[var(--color-muted)]">{{ filtrados.length }} parámetro(s)</span>
      </div>

      <SectionCard
        v-for="[grupo, filas] in agrupados"
        :key="grupo"
        :title="grupo"
        icon="configuracion"
      >
        <div class="data-table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th
                  scope="col"
                  class="w-16"
                >
                  Clave
                </th>
                <th scope="col">
                  Valor
                </th>
                <th
                  scope="col"
                  class="w-28"
                >
                  Estado
                </th>
                <th
                  scope="col"
                  class="w-24"
                >
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="p in filas"
                :key="p.id"
                class="align-top"
              >
                <td class="cifra text-xs text-[var(--color-muted)]">
                  {{ p.clave }}
                </td>
                <td>
                  {{ p.valor }}
                </td>
                <td>
                  <StatusToggle
                    :active="p.estado"
                    @toggle="toggleEstado(p)"
                  />
                </td>
                <td>
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
        novalidate
        @submit.prevent="guardar"
      >
        <p
          v-if="serverError"
          role="alert"
          class="text-sm text-[var(--color-danger)]"
        >
          {{ serverError }}
        </p>
        <FormField
          v-slot="{ id, describedby, invalid }"
          label="Grupo"
          :error="errors.grupo"
        >
          <input
            :id="id"
            v-model="form.grupo"
            type="text"
            class="field-input"
            :aria-describedby="describedby"
            :aria-invalid="invalid"
          >
        </FormField>
        <FormField
          v-slot="{ id, describedby, invalid }"
          label="Clave"
          :error="errors.clave"
        >
          <input
            :id="id"
            v-model="form.clave"
            type="text"
            class="field-input"
            :aria-describedby="describedby"
            :aria-invalid="invalid"
          >
        </FormField>
        <FormField
          v-slot="{ id, describedby, invalid }"
          label="Valor"
          :error="errors.valor"
        >
          <textarea
            :id="id"
            v-model="form.valor"
            rows="3"
            class="field-input"
            :aria-describedby="describedby"
            :aria-invalid="invalid"
          />
        </FormField>
        <label class="flex items-center gap-2 text-sm">
          <input
            v-model="form.estado"
            type="checkbox"
            class="h-4 w-4 rounded border-[var(--color-line)]"
          >
          Activo
        </label>

        <div class="flex justify-end gap-2 pt-2">
          <AppButton
            variant="secondary"
            @click="modalOpen = false"
          >
            Cancelar
          </AppButton>
          <AppButton
            type="submit"
            :loading="guardando"
          >
            {{ guardando ? 'Guardando…' : 'Guardar' }}
          </AppButton>
        </div>
      </form>
    </AppModal>
  </AppShell>
</template>
