<script setup lang="ts">
import { ref } from 'vue'
import AppButton from './AppButton.vue'
import {
  descargarJson,
  exportarCoachee,
  getMisDatos,
  solicitarSupresion,
  suprimirCoachee,
} from '../api/privacidad'
import { ApiError } from '../api/client'
import { confirmDialog, notifyError, notifySuccess, promptDialog } from '../lib/notify'

// Una sola pieza para los dos lados del derecho de acceso y supresión (Ley 21.719):
// el titular (coachee) descarga sus datos y pide eliminarlos; el coach, que atiende esa
// solicitud, descarga los datos de un coachee y ejecuta la eliminación.
const props = defineProps<{
  modo: 'titular' | 'coach'
  coacheeId?: string
  coacheeNombre?: string
}>()
const emit = defineEmits<{ suprimido: [] }>()

const descargando = ref(false)
const procesando = ref(false)

function mensajeDe(err: unknown): string {
  return err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.'
}

async function descargar() {
  descargando.value = true
  try {
    if (props.modo === 'titular') {
      descargarJson(await getMisDatos(), 'mis-datos-coachnexus')
    } else if (props.coacheeId) {
      descargarJson(await exportarCoachee(props.coacheeId), 'datos-coachee')
    }
  } catch (err) {
    await notifyError('No se pudo descargar', mensajeDe(err))
  } finally {
    descargando.value = false
  }
}

async function pedirSupresion() {
  const ok = await confirmDialog({
    title: '¿Pedir la eliminación de tus datos?',
    text: 'Tu coach recibirá un aviso y, al atenderlo, se borrarán tu cuenta, sesiones, planes, documentos y fotos. No se puede deshacer.',
    confirmText: 'Enviar solicitud',
    danger: true,
  })
  if (!ok) return
  procesando.value = true
  try {
    await solicitarSupresion()
    await notifySuccess('Solicitud enviada', 'Tu coach fue avisado.')
  } catch (err) {
    await notifyError('No se pudo enviar', mensajeDe(err))
  } finally {
    procesando.value = false
  }
}

async function eliminarDefinitivo() {
  if (!props.coacheeId || !props.coacheeNombre) return
  const nombre = await promptDialog({
    title: 'Eliminar definitivamente',
    inputLabel: `Se borrarán sus sesiones, planes, documentos y fotos. Es irreversible. Para confirmar escribe: ${props.coacheeNombre}`,
    confirmText: 'Eliminar',
  })
  if (nombre === null) return
  procesando.value = true
  try {
    await suprimirCoachee(props.coacheeId, nombre)
    await notifySuccess('Datos eliminados')
    emit('suprimido')
  } catch (err) {
    await notifyError('No se pudo eliminar', mensajeDe(err))
  } finally {
    procesando.value = false
  }
}
</script>

<template>
  <div class="space-y-3">
    <p class="text-xs text-[var(--color-muted)]">
      <template v-if="modo === 'titular'">
        Puedes descargar una copia de todos los datos que esta plataforma guarda sobre ti, o pedir
        que se eliminen.
      </template>
      <template v-else>
        Atiende aquí las solicitudes de acceso y eliminación de datos de {{ coacheeNombre }}. La
        eliminación borra su cuenta y todo lo asociado, y no se puede deshacer.
      </template>
    </p>
    <div class="flex flex-wrap gap-2">
      <AppButton
        variant="secondary"
        :loading="descargando"
        @click="descargar"
      >
        Descargar {{ modo === 'titular' ? 'mis datos' : 'sus datos' }}
      </AppButton>
      <AppButton
        v-if="modo === 'titular'"
        variant="secondary"
        :loading="procesando"
        @click="pedirSupresion"
      >
        Pedir eliminación de mis datos
      </AppButton>
      <AppButton
        v-else
        variant="danger"
        :loading="procesando"
        @click="eliminarDefinitivo"
      >
        Eliminar definitivamente
      </AppButton>
    </div>
  </div>
</template>
