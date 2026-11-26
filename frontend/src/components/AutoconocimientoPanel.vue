<script setup lang="ts">
import { onMounted, reactive } from 'vue'
import SectionCard from './SectionCard.vue'
import SkeletonBlock from './SkeletonBlock.vue'
import ErrorState from './ErrorState.vue'
import AppButton from './AppButton.vue'
import FormField from './FormField.vue'
import { useCarga } from '../lib/useCarga'
import { notifyError, notifySuccess } from '../lib/notify'
import { ApiError } from '../api/client'
import { useAuthStore } from '../stores/auth'
import { SECCIONES_AUTOCONOCIMIENTO, type DefinicionSeccion } from '../lib/autoconocimiento'
import {
  getMiAutoconocimiento,
  guardarSeccionAutoconocimiento,
  type SeccionAutoconocimiento,
} from '../api/autoconocimiento'

const auth = useAuthStore()

interface EstadoSeccion {
  contenido: string
  complemento: string
  compartida: boolean
  /** Último texto guardado: distingue "con contenido" de un borrador sin guardar. */
  guardado: string
  guardando: boolean
  cambiandoCompartir: boolean
}

const estados = reactive({} as Record<SeccionAutoconocimiento, EstadoSeccion>)

function firma(contenido: string, complemento: string): string {
  return JSON.stringify([contenido.trim(), complemento.trim()])
}
const VACIA = firma('', '')

const { loading, error, recargar } = useCarga(async () => {
  const guardadas = new Map((await getMiAutoconocimiento()).map((s) => [s.seccion, s]))
  for (const { key } of SECCIONES_AUTOCONOCIMIENTO) {
    const s = guardadas.get(key)
    estados[key] = {
      contenido: s?.contenido ?? '',
      complemento: s?.complemento ?? '',
      compartida: s?.compartida ?? false,
      guardado: firma(s?.contenido ?? '', s?.complemento ?? ''),
      guardando: false,
      cambiandoCompartir: false,
    }
  }
})
onMounted(recargar)

function sinGuardar(key: SeccionAutoconocimiento): boolean {
  return firma(estados[key].contenido, estados[key].complemento) !== estados[key].guardado
}

function tieneTexto(key: SeccionAutoconocimiento): boolean {
  return estados[key].guardado !== VACIA
}

function mensajeDe(err: unknown): string {
  return err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.'
}

async function guardar(def: DefinicionSeccion) {
  const estado = estados[def.key]
  estado.guardando = true
  const { contenido, complemento } = estado
  try {
    await guardarSeccionAutoconocimiento(
      def.key,
      def.columnas ? { contenido, complemento } : { contenido },
    )
    estado.guardado = firma(contenido, complemento)
    await notifySuccess('Guardado')
  } catch (err) {
    await notifyError('No se pudo guardar', mensajeDe(err))
  } finally {
    estado.guardando = false
  }
}

async function alternarCompartir(def: DefinicionSeccion) {
  const estado = estados[def.key]
  estado.cambiandoCompartir = true
  try {
    const res = await guardarSeccionAutoconocimiento(def.key, { compartida: !estado.compartida })
    estado.compartida = res.compartida
  } catch (err) {
    await notifyError('No se pudo cambiar', mensajeDe(err))
  } finally {
    estado.cambiandoCompartir = false
  }
}
</script>

<template>
  <SectionCard
    title="Conocerme"
    icon="diario"
  >
    <p class="mb-4 text-sm text-[var(--color-muted)]">
      Un espacio para ti. Ninguna sección es obligatoria y puedes cambiarlas cuando quieras. Todas
      empiezan privadas: tú decides, una por una, cuáles compartes con tu coach.
    </p>
    <p
      v-if="auth.enVerComo"
      class="mb-4 rounded-lg bg-[var(--color-parchment)] p-3 text-xs text-[var(--color-ink)]/80"
    >
      Estás en «Ver como»: aquí solo aparece lo que esta persona comparte con su coach.
    </p>

    <SkeletonBlock v-if="loading" />
    <ErrorState
      v-else-if="error"
      :description="error"
      @retry="recargar"
    />
    <div
      v-else
      class="space-y-2"
    >
      <details
        v-for="def in SECCIONES_AUTOCONOCIMIENTO"
        :key="def.key"
        :data-seccion="def.key"
        class="group rounded-xl border border-[var(--color-line)]"
      >
        <summary class="flex min-h-11 cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 [&::-webkit-details-marker]:hidden">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
            class="shrink-0 text-[var(--color-muted)] transition-transform group-open:rotate-90"
          ><path d="m9 6 6 6-6 6" /></svg>
          <span class="text-sm font-medium text-[var(--color-ink)]">{{ def.titulo }}</span>
          <span
            v-if="def.etiqueta && !tieneTexto(def.key)"
            class="text-xs text-[var(--color-bronze)]"
          >{{ def.etiqueta }}</span>
          <span
            class="ml-auto inline-flex shrink-0 items-center gap-1.5 text-xs"
            :class="estados[def.key].compartida ? 'text-[var(--color-sage)]' : 'text-[var(--color-muted)]'"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z" />
              <circle
                cx="12"
                cy="12"
                r="3"
              />
              <path
                v-if="!estados[def.key].compartida"
                d="m3 3 18 18"
              />
            </svg>
            {{ estados[def.key].compartida ? 'La ve mi coach' : 'Solo yo' }}
          </span>
        </summary>

        <form
          class="space-y-3 border-t border-[var(--color-line)] px-4 py-3"
          @submit.prevent="guardar(def)"
        >
          <p class="text-xs text-[var(--color-muted)]">
            {{ def.ayuda }}
          </p>
          <div
            v-if="def.columnas"
            class="grid gap-3 sm:grid-cols-2"
          >
            <FormField :label="def.columnas[0]">
              <template #default="{ id }">
                <textarea
                  :id="id"
                  v-model="estados[def.key].contenido"
                  rows="4"
                  maxlength="2000"
                  class="field-input"
                />
              </template>
            </FormField>
            <FormField :label="def.columnas[1]">
              <template #default="{ id }">
                <textarea
                  :id="id"
                  v-model="estados[def.key].complemento"
                  rows="4"
                  maxlength="2000"
                  class="field-input"
                />
              </template>
            </FormField>
          </div>
          <textarea
            v-else
            v-model="estados[def.key].contenido"
            :aria-label="def.titulo"
            :placeholder="def.ejemplo"
            rows="3"
            maxlength="2000"
            class="field-input"
          />

          <div class="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              role="switch"
              :aria-checked="estados[def.key].compartida"
              :aria-label="`Compartir «${def.titulo}» con mi coach`"
              :disabled="estados[def.key].cambiandoCompartir"
              class="flex min-h-11 items-center gap-2 text-sm disabled:opacity-50"
              @click="alternarCompartir(def)"
            >
              <span
                class="relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors"
                :class="estados[def.key].compartida ? 'bg-[var(--color-sage)]' : 'bg-[var(--color-line)]'"
              >
                <span
                  class="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform"
                  :class="estados[def.key].compartida ? 'translate-x-4' : 'translate-x-0.5'"
                />
              </span>
              Compartir con mi coach
            </button>
            <div class="flex items-center gap-3">
              <span
                v-if="sinGuardar(def.key)"
                class="text-xs text-[var(--color-bronze)]"
              >Sin guardar</span>
              <AppButton
                type="submit"
                size="sm"
                :loading="estados[def.key].guardando"
                :disabled="!sinGuardar(def.key)"
              >
                Guardar
              </AppButton>
            </div>
          </div>
        </form>
      </details>
    </div>
  </SectionCard>
</template>
