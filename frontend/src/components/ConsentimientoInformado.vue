<script setup lang="ts">
import { ref } from 'vue'
import { setConsentimiento, solicitarConsentimiento } from '../api/coachees'
import { ApiError } from '../api/client'
import { notifySuccess, notifyError } from '../lib/notify'
import NavIcon from './NavIcon.vue'

const props = defineProps<{
  coacheeId: string
  nombre: string
  informado: boolean
  fecha?: string | null
}>()
const emit = defineEmits<{
  actualizado: [{ consentimientoInformado: boolean; consentimientoFecha: string | null }]
}>()

const guardando = ref(false)
const error = ref<string | null>(null)

async function toggle() {
  guardando.value = true
  error.value = null
  try {
    const actualizado = await setConsentimiento(props.coacheeId, !props.informado)
    emit('actualizado', {
      consentimientoInformado: actualizado.consentimientoInformado,
      consentimientoFecha: actualizado.consentimientoFecha,
    })
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'No se pudo actualizar el consentimiento.'
  } finally {
    guardando.value = false
  }
}

async function enviarSolicitud() {
  try {
    await solicitarConsentimiento(props.coacheeId)
    await notifySuccess('Solicitud enviada', `Le enviamos un correo a ${props.nombre} para que confirme su consentimiento.`)
  } catch (err) {
    const mensaje = err instanceof ApiError ? err.message : 'No se pudo enviar la solicitud.'
    await notifyError('No se pudo enviar', mensaje)
  }
}
</script>

<template>
  <div class="rounded-lg border border-[var(--color-line)] p-3">
    <div class="mb-1.5 flex items-center justify-between gap-2">
      <p class="text-xs font-medium uppercase text-[var(--color-ink)]/60">
        Consentimiento informado
      </p>
      <span
        class="rounded-full px-2 py-0.5 text-xs"
        :class="informado
          ? 'bg-[var(--color-sage)]/20 text-[var(--color-sage)]'
          : 'bg-[var(--color-danger)]/15 text-[var(--color-danger)]'"
      >
        {{ informado ? 'Firmado' : 'Pendiente' }}
      </span>
    </div>

    <p
      v-if="informado"
      class="text-xs text-[var(--color-ink)]/60"
    >
      Firmado<template v-if="fecha">
        el {{ new Date(fecha).toLocaleDateString('es-CL') }}
      </template>
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
        :disabled="guardando"
        @click="toggle"
      >
        {{ informado ? 'Marcar como pendiente' : 'Marcar como firmado' }}
      </button>
      <button
        type="button"
        class="inline-flex items-center gap-1 rounded-full border border-[var(--color-line)] px-2.5 py-1 text-xs text-[var(--color-saltup)] hover:bg-[var(--color-parchment)]/60"
        @click="enviarSolicitud"
      >
        <NavIcon
          name="correo"
          :size="13"
        /> Enviar solicitud por correo
      </button>
    </div>
  </div>
</template>
