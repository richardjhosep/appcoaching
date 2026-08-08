<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { getCoachee, type Coachee } from '../../../api/coachees'
import ConsentimientoInformado from '../../../components/ConsentimientoInformado.vue'

const props = defineProps<{ coacheeId: string }>()

const coachee = ref<Coachee | null>(null)
const loading = ref(true)

const formatoCLP = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

async function load() {
  loading.value = true
  coachee.value = await getCoachee(props.coacheeId)
  loading.value = false
}

onMounted(load)
watch(() => props.coacheeId, load)

function onConsentimientoActualizado(actualizado: { consentimientoInformado: boolean; consentimientoFecha: string | null }) {
  if (!coachee.value) return
  coachee.value = { ...coachee.value, ...actualizado }
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

    <ConsentimientoInformado
      :coachee-id="coachee.id"
      :nombre="coachee.nombre"
      :informado="coachee.consentimientoInformado"
      :fecha="coachee.consentimientoFecha"
      @actualizado="onConsentimientoActualizado"
    />
  </div>
</template>
