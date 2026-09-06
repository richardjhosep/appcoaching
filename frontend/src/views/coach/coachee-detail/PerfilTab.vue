<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { getCoachee, obtenerUrlFotoDeCoachee, type Coachee } from '../../../api/coachees'
import ConsentimientoInformado from '../../../components/ConsentimientoInformado.vue'
import SkeletonBlock from '../../../components/SkeletonBlock.vue'
import { iniciales } from '../../../lib/avatar'

const props = defineProps<{ coacheeId: string }>()

const coachee = ref<Coachee | null>(null)
const loading = ref(true)
const fotoUrl = ref<string | null>(null)

const formatoCLP = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

async function load() {
  loading.value = true
  coachee.value = await getCoachee(props.coacheeId)
  // Solo se pide la foto si el coachee activó el interruptor — nunca antes (ver
  // coachees.controller.ts:114-133, la ruta existe igual, pero el frontend decide si llamarla).
  fotoUrl.value = coachee.value.compartirPerfilConCoach
    ? await obtenerUrlFotoDeCoachee(props.coacheeId)
    : null
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
  <SkeletonBlock v-if="loading" />
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
      <h2 class="mb-3 text-sm font-medium">
        Perfil personal
      </h2>
      <template v-if="coachee.compartirPerfilConCoach">
        <div class="flex items-start gap-3">
          <img
            v-if="fotoUrl"
            :src="fotoUrl"
            alt=""
            class="h-12 w-12 shrink-0 rounded-full object-cover"
          >
          <div
            v-else
            class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-ink)] text-sm font-semibold text-[var(--color-parchment)]"
          >
            {{ iniciales(coachee.nombre) }}
          </div>
          <p
            v-if="coachee.bio"
            class="flex-1 text-[var(--color-ink)]/80"
          >
            {{ coachee.bio }}
          </p>
          <p
            v-else
            class="flex-1 text-[var(--color-ink)]/50"
          >
            {{ coachee.nombre.split(' ')[0] }} todavía no escribió una presentación.
          </p>
        </div>
      </template>
      <p
        v-else
        class="text-[var(--color-ink)]/50"
      >
        Este coachee no ha compartido su perfil personal contigo.
      </p>
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
