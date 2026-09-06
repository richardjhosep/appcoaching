<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import AppShell from '../../components/AppShell.vue'
import SectionCard from '../../components/SectionCard.vue'
import SkeletonBlock from '../../components/SkeletonBlock.vue'
import { notifyError, notifySuccess } from '../../lib/notify'
import { iniciales } from '../../lib/avatar'
import { ApiError } from '../../api/client'
import {
  getMyCoachee,
  actualizarMiPerfil,
  subirFotoCoachee,
  obtenerUrlMiFotoCoachee,
  type Coachee,
} from '../../api/coachees'

const loading = ref(true)
const coachee = ref<Coachee | null>(null)
const fotoUrl = ref<string | null>(null)

const form = reactive({
  telefono: '',
  emailContacto: '',
  bio: '',
  compartirPerfilConCoach: false,
})
const guardando = ref(false)
const subiendoFoto = ref(false)

function aplicarCoachee(c: Coachee) {
  coachee.value = c
  form.telefono = c.telefono ?? ''
  form.emailContacto = c.emailContacto ?? ''
  form.bio = c.bio ?? ''
  form.compartirPerfilConCoach = c.compartirPerfilConCoach
}

async function cargarFoto() {
  fotoUrl.value = coachee.value?.fotoPath ? await obtenerUrlMiFotoCoachee() : null
}

async function load() {
  loading.value = true
  aplicarCoachee(await getMyCoachee())
  await cargarFoto()
  loading.value = false
}
onMounted(load)

async function guardar() {
  guardando.value = true
  try {
    aplicarCoachee(
      await actualizarMiPerfil({
        telefono: form.telefono.trim() || undefined,
        emailContacto: form.emailContacto.trim() || undefined,
        bio: form.bio.trim() || undefined,
        compartirPerfilConCoach: form.compartirPerfilConCoach,
      }),
    )
    await notifySuccess('Perfil actualizado')
  } catch (err) {
    await notifyError('No se pudo guardar', err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.')
  } finally {
    guardando.value = false
  }
}

async function onFotoChange(e: Event) {
  const input = e.target as HTMLInputElement
  const archivo = input.files?.[0]
  if (!archivo) return
  subiendoFoto.value = true
  try {
    aplicarCoachee(await subirFotoCoachee(archivo))
    await cargarFoto()
    await notifySuccess('Foto actualizada')
  } catch (err) {
    await notifyError('No se pudo subir la foto', err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.')
    input.value = ''
  } finally {
    subiendoFoto.value = false
  }
}
</script>

<template>
  <AppShell>
    <h1 class="mb-1 font-[family-name:var(--font-heading)] text-xl font-semibold">
      Mi perfil
    </h1>
    <p class="mb-4 text-sm text-[var(--color-ink)]/60">
      Tu información personal — nadie la ve salvo que tú lo decidas.
    </p>

    <SkeletonBlock v-if="loading" />
    <div
      v-else-if="coachee"
      class="space-y-4"
    >
      <SectionCard
        title="Foto de perfil"
        icon="contacto"
      >
        <div class="flex items-center gap-4">
          <img
            v-if="fotoUrl"
            :src="fotoUrl"
            alt=""
            class="h-16 w-16 shrink-0 rounded-full object-cover"
          >
          <div
            v-else
            class="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[var(--color-ink)] text-lg font-semibold text-[var(--color-parchment)]"
          >
            {{ iniciales(coachee.nombre) }}
          </div>
          <label class="text-xs">
            {{ fotoUrl ? 'Reemplazar foto' : 'Subir foto' }}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              :disabled="subiendoFoto"
              class="mt-0.5 block w-full text-xs file:mr-2 file:rounded-full file:border-0 file:bg-[var(--color-ink)] file:px-3 file:py-1 file:text-xs file:text-[var(--color-parchment)]"
              @change="onFotoChange"
            >
          </label>
        </div>
      </SectionCard>

      <SectionCard
        title="Datos"
        icon="contacto"
      >
        <form
          class="space-y-3"
          @submit.prevent="guardar"
        >
          <label class="block text-sm">
            Nombre
            <input
              :value="coachee.nombre"
              type="text"
              disabled
              class="mt-1 w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-parchment)]/40 px-3 py-2 text-sm text-[var(--color-ink)]/60"
            >
            <span class="mt-1 block text-xs text-[var(--color-ink)]/50">
              Lo define tu coach — escríbele si necesitas corregirlo.
            </span>
          </label>

          <div class="grid gap-3 sm:grid-cols-2">
            <label class="block text-sm">
              Teléfono
              <input
                v-model="form.telefono"
                type="tel"
                class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
              >
            </label>
            <label class="block text-sm">
              Email de contacto
              <input
                v-model="form.emailContacto"
                type="email"
                class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
              >
            </label>
          </div>

          <label class="block text-sm">
            Sobre mí (opcional)
            <textarea
              v-model="form.bio"
              rows="3"
              placeholder="Cuéntanos algo sobre ti — intereses, qué te gustaría lograr, lo que quieras compartir."
              class="mt-1 w-full rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
            />
          </label>

          <label class="flex items-start gap-3 rounded-lg border border-[var(--color-line)] p-3 text-sm">
            <input
              v-model="form.compartirPerfilConCoach"
              type="checkbox"
              class="mt-0.5"
            >
            <span>
              <span class="block font-medium">Mi coach puede ver mi perfil</span>
              <span class="block text-xs text-[var(--color-ink)]/60">
                Si lo activas, tu coach podrá ver tu foto y lo que escribiste en "Sobre mí".
                Distinto del consentimiento del proceso de coaching — esto es solo tu
                presentación personal, y lo puedes desactivar cuando quieras.
              </span>
            </span>
          </label>

          <div class="flex justify-end pt-2">
            <button
              type="submit"
              :disabled="guardando"
              class="rounded-lg bg-[var(--color-ink)] px-4 py-2 text-sm text-[var(--color-parchment)] disabled:opacity-60"
            >
              {{ guardando ? 'Guardando…' : 'Guardar' }}
            </button>
          </div>
        </form>
      </SectionCard>
    </div>
  </AppShell>
</template>
