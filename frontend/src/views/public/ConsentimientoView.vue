<script setup lang="ts">
import { onMounted, ref } from 'vue'
import SkeletonBlock from '../../components/SkeletonBlock.vue'
import {
  getSolicitud,
  aceptarSolicitud,
  rechazarSolicitud,
  type SolicitudConsentimientoPublica,
} from '../../api/consentimientoPublico'
import { ApiError } from '../../api/client'

const props = defineProps<{ token: string }>()

type Vista = 'cargando' | 'no-encontrado' | 'vencido' | 'formulario' | 'ya-respondido' | 'confirmado'

const vista = ref<Vista>('cargando')
const solicitud = ref<SolicitudConsentimientoPublica | null>(null)
const enviando = ref(false)
const error = ref<string | null>(null)
const ultimaRespuesta = ref<boolean | null>(null)

async function cargar() {
  try {
    const s = await getSolicitud(props.token)
    solicitud.value = s
    if (s.expirada) {
      vista.value = 'vencido'
    } else if (s.estado !== 'pendiente') {
      ultimaRespuesta.value = s.estado === 'aceptado'
      vista.value = 'ya-respondido'
    } else {
      vista.value = 'formulario'
    }
  } catch {
    vista.value = 'no-encontrado'
  }
}

onMounted(cargar)

async function responder(aceptado: boolean) {
  enviando.value = true
  error.value = null
  try {
    if (aceptado) await aceptarSolicitud(props.token)
    else await rechazarSolicitud(props.token)
    ultimaRespuesta.value = aceptado
    vista.value = 'confirmado'
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'No se pudo enviar tu respuesta. Intenta de nuevo.'
  } finally {
    enviando.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-[var(--color-parchment)] p-4">
    <div class="w-full max-w-md rounded-2xl border border-[var(--color-line)] bg-white p-6 shadow-sm">
      <h1 class="mb-4 font-[family-name:var(--font-heading)] text-lg font-semibold">
        Coach<span class="text-[var(--color-bronze)]">Nexus</span>
      </h1>

      <SkeletonBlock v-if="vista === 'cargando'" />

      <div v-else-if="vista === 'no-encontrado'">
        <p class="text-sm text-[var(--color-danger)]">
          Este enlace no es válido. Revisa que copiaste la dirección completa, o pide a tu coach que te envíe uno nuevo.
        </p>
      </div>

      <div v-else-if="vista === 'vencido'">
        <p class="text-sm text-[var(--color-danger)]">
          Este enlace ya venció. Pide a tu coach que te envíe una nueva solicitud de consentimiento.
        </p>
      </div>

      <div v-else-if="vista === 'ya-respondido'">
        <p class="text-sm text-[var(--color-ink)]/70">
          Hola {{ solicitud?.nombre }}, ya registramos tu respuesta:
          <strong>{{ ultimaRespuesta ? 'aceptaste' : 'no aceptaste' }}</strong> el consentimiento informado.
          Si quieres cambiarla, contacta a tu coach.
        </p>
      </div>

      <div v-else-if="vista === 'formulario'">
        <p class="mb-3 text-sm text-[var(--color-ink)]/80">
          Hola {{ solicitud?.nombre }}, tu coach te pide confirmar tu <strong>consentimiento informado</strong>
          para participar del proceso de coaching en CoachNexus.
        </p>
        <div class="mb-4 rounded-xl border border-[var(--color-line)] bg-[var(--color-parchment)]/40 p-4 text-xs text-[var(--color-ink)]/70">
          <p class="mb-2">
            Al aceptar, confirmas que:
          </p>
          <ul class="list-disc space-y-1 pl-4">
            <li>Participas voluntariamente del proceso de coaching.</li>
            <li>Autorizas el tratamiento de tus datos personales para ese fin (tus notas privadas de sesión nunca son visibles para tu coach ni tu empresa; tu empresa solo accede a datos agregados del proceso).</li>
            <li>Puedes revocar este consentimiento en cualquier momento contactando a tu coach.</li>
          </ul>
        </div>

        <p
          v-if="error"
          class="mb-3 text-sm text-[var(--color-danger)]"
        >
          {{ error }}
        </p>

        <div class="flex gap-2">
          <button
            type="button"
            class="flex-1 rounded-lg bg-[var(--color-sage)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            :disabled="enviando"
            @click="responder(true)"
          >
            Acepto
          </button>
          <button
            type="button"
            class="flex-1 rounded-lg border border-[var(--color-line)] px-4 py-2 text-sm text-[var(--color-ink)]/70 disabled:opacity-50"
            :disabled="enviando"
            @click="responder(false)"
          >
            No acepto
          </button>
        </div>
      </div>

      <div v-else-if="vista === 'confirmado'">
        <p class="text-sm text-[var(--color-sage)]">
          {{ ultimaRespuesta
            ? 'Gracias — registramos que aceptaste el consentimiento informado.'
            : 'Registramos que no aceptaste el consentimiento informado. Tu coach quedará al tanto.' }}
        </p>
      </div>
    </div>
  </div>
</template>
