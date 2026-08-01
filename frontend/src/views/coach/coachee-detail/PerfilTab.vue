<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { getCoachee, setConsentimiento, type Coachee } from '../../../api/coachees'
import { ApiError } from '../../../api/client'

const props = defineProps<{ coacheeId: string }>()

const coachee = ref<Coachee | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const guardandoConsentimiento = ref(false)

const formatoCLP = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

async function load() {
  loading.value = true
  coachee.value = await getCoachee(props.coacheeId)
  loading.value = false
}

onMounted(load)
watch(() => props.coacheeId, load)

async function cambiarConsentimiento(event: Event) {
  if (!coachee.value) return
  const informado = (event.target as HTMLInputElement).checked
  error.value = null
  guardandoConsentimiento.value = true
  try {
    const actualizado = await setConsentimiento(coachee.value.id, informado)
    coachee.value = {
      ...coachee.value,
      consentimientoInformado: actualizado.consentimientoInformado,
      consentimientoFecha: actualizado.consentimientoFecha,
    }
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'No se pudo actualizar el consentimiento.'
  } finally {
    guardandoConsentimiento.value = false
  }
}
</script>

<template>
  <div
    v-if="loading"
    class="text-sm text-[var(--color-ink)]/60"
  >
    Cargando…
  </div>
  <div
    v-else-if="coachee"
    class="space-y-4"
  >
    <p
      v-if="error"
      class="text-sm text-[var(--color-danger)]"
    >
      {{ error }}
    </p>

    <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4 text-sm">
      <h2 class="mb-3 text-sm font-medium">
        Datos del proceso
      </h2>
      <dl class="grid gap-3 sm:grid-cols-2">
        <div>
          <dt class="text-xs text-[var(--color-ink)]/60">
            Empresa
          </dt>
          <dd>{{ coachee.empresa?.nombre ?? 'Independiente' }}</dd>
        </div>
        <div>
          <dt class="text-xs text-[var(--color-ink)]/60">
            Jefe directo
          </dt>
          <dd>{{ coachee.jefeDirecto ?? '—' }}</dd>
        </div>
        <div>
          <dt class="text-xs text-[var(--color-ink)]/60">
            Área / gerencia
          </dt>
          <dd>{{ coachee.areaGerencia ?? '—' }}</dd>
        </div>
        <div>
          <dt class="text-xs text-[var(--color-ink)]/60">
            Tarifa propia
          </dt>
          <dd>{{ coachee.tarifaPropia != null ? formatoCLP.format(coachee.tarifaPropia) : '—' }}</dd>
        </div>
        <div class="sm:col-span-2">
          <dt class="text-xs text-[var(--color-ink)]/60">
            Objetivo del proceso
          </dt>
          <dd>{{ coachee.objetivoProceso ?? '—' }}</dd>
        </div>
      </dl>
    </div>

    <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4 text-sm">
      <h2 class="mb-1 text-sm font-medium">
        Contacto de {{ coachee.nombre.split(' ')[0] }}
      </h2>
      <p class="mb-3 text-xs text-[var(--color-ink)]/50">
        Estos datos los ingresa directamente el coachee desde su cuenta — aquí solo los ves.
      </p>
      <dl class="grid gap-3 sm:grid-cols-2">
        <div>
          <dt class="text-xs text-[var(--color-ink)]/60">
            Teléfono
          </dt>
          <dd>{{ coachee.telefono ?? '—' }}</dd>
        </div>
        <div>
          <dt class="text-xs text-[var(--color-ink)]/60">
            Email
          </dt>
          <dd>{{ coachee.emailContacto ?? '—' }}</dd>
        </div>
      </dl>
    </div>

    <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4 text-sm">
      <h2 class="mb-2 text-sm font-medium">
        Consentimiento informado
      </h2>
      <label class="flex items-center gap-2">
        <input
          type="checkbox"
          :checked="coachee.consentimientoInformado"
          :disabled="guardandoConsentimiento"
          @change="cambiarConsentimiento"
        >
        Firmado{{ coachee.consentimientoFecha ? ` el ${new Date(coachee.consentimientoFecha).toLocaleDateString('es-CL')}` : '' }}
      </label>
    </div>
  </div>
</template>
