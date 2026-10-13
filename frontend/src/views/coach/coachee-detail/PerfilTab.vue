<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { getCoachee, obtenerUrlFotoDeCoachee, type Coachee } from '../../../api/coachees'
import ConsentimientoInformado from '../../../components/ConsentimientoInformado.vue'
import SkeletonBlock from '../../../components/SkeletonBlock.vue'
import DocumentosCoacheePanel from '../../../components/DocumentosCoacheePanel.vue'
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
    class="items-start lg:grid lg:grid-cols-12 lg:gap-6"
  >
    <!-- Columna izquierda: un solo panel, sin "carditis" — antes eran 2 tarjetas
         separadas (Datos del proceso / Perfil personal) con su propio borde cada una. -->
    <div class="rounded-2xl border border-[var(--color-line)] bg-white p-6 text-sm lg:col-span-8">
      <h2 class="mb-4 font-[family-name:var(--font-heading)] text-base font-semibold text-[var(--color-ink)]">
        Datos del proceso
      </h2>

      <div class="mb-5 border-l-4 border-[var(--color-saltup)] py-1.5 pl-4">
        <p class="mb-1 font-[family-name:var(--font-mono)] text-[11px] font-semibold uppercase text-[var(--color-ink)]/60">
          Objetivo del proceso
        </p>
        <p class="text-base font-semibold text-[var(--color-ink)]">
          «{{ coachee.objetivoProceso ?? 'Sin objetivo definido todavía.' }}»
        </p>
      </div>

      <dl class="grid grid-cols-2 gap-4 border-y border-[var(--color-line)] py-4 md:grid-cols-4">
        <div>
          <dt class="font-[family-name:var(--font-mono)] text-[11px] font-semibold uppercase text-[var(--color-ink)]/60">
            Empresa
          </dt>
          <dd class="text-sm font-semibold text-[var(--color-ink)]">
            {{ coachee.empresa?.nombre ?? 'Independiente' }}
          </dd>
        </div>
        <div>
          <dt class="font-[family-name:var(--font-mono)] text-[11px] font-semibold uppercase text-[var(--color-ink)]/60">
            Cargo
          </dt>
          <dd class="text-sm font-semibold text-[var(--color-ink)]">
            {{ coachee.cargo ?? '—' }}
          </dd>
        </div>
        <div>
          <dt class="font-[family-name:var(--font-mono)] text-[11px] font-semibold uppercase text-[var(--color-ink)]/60">
            Área / gerencia
          </dt>
          <dd class="text-sm font-semibold text-[var(--color-ink)]">
            {{ coachee.areaGerencia ?? '—' }}
          </dd>
        </div>
        <div>
          <dt class="font-[family-name:var(--font-mono)] text-[11px] font-semibold uppercase text-[var(--color-ink)]/60">
            Jefe directo
          </dt>
          <dd class="text-sm font-semibold text-[var(--color-ink)]">
            {{ coachee.jefeDirecto ?? '—' }}
          </dd>
        </div>
        <div>
          <dt class="font-[family-name:var(--font-mono)] text-[11px] font-semibold uppercase text-[var(--color-ink)]/60">
            Tarifa acordada
          </dt>
          <dd class="font-[family-name:var(--font-mono)] text-sm font-semibold text-[var(--color-sage)]">
            {{ coachee.tarifaPropia != null ? formatoCLP.format(coachee.tarifaPropia) : '—' }}
          </dd>
        </div>
      </dl>

      <div class="mt-5 border-t border-[var(--color-line)] pt-5">
        <h2 class="mb-3 font-[family-name:var(--font-heading)] text-base font-semibold text-[var(--color-ink)]">
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
              class="flex-1 italic text-[var(--color-ink)]/50"
            >
              {{ coachee.nombre.split(' ')[0] }} todavía no escribió una presentación.
            </p>
          </div>
        </template>
        <p
          v-else
          class="italic text-[var(--color-ink)]/50"
        >
          Este coachee no ha compartido su perfil personal contigo.
        </p>
      </div>

      <div class="mt-6 border-t border-[var(--color-line)] pt-5">
        <h2 class="mb-1 font-[family-name:var(--font-heading)] text-base font-semibold text-[var(--color-ink)]">
          Documentos del proceso
        </h2>
        <p class="mb-3 text-xs text-[var(--color-ink)]/55">
          Compartidos con el coachee y su empresa: lo que cualquiera de los tres suba, lo ven todos.
        </p>
        <DocumentosCoacheePanel :coachee-id="coachee.id" />
      </div>
    </div>

    <!-- Columna derecha -->
    <div class="mt-6 space-y-6 lg:col-span-4 lg:mt-0">
      <div class="rounded-2xl border border-[var(--color-danger)]/25 bg-[var(--color-danger)]/5 p-5">
        <h2 class="mb-3 font-[family-name:var(--font-heading)] text-base font-semibold text-[var(--color-danger)]">
          Consentimiento Legal
        </h2>
        <!-- ConsentimientoInformado es un componente compartido (también vive en
             ContratosTab.vue, en un layout de lista compacta) — se despoja su propia
             tarjeta/borde acá para que se integre en este panel, sin tocar su script ni su
             template (evita romper la otra vista que lo usa). -->
        <div class="[&>div]:rounded-none [&>div]:border-0 [&>div]:bg-transparent [&>div]:p-0">
          <ConsentimientoInformado
            :coachee-id="coachee.id"
            :nombre="coachee.nombre"
            :informado="coachee.consentimientoInformado"
            :fecha="coachee.consentimientoFecha"
            @actualizado="onConsentimientoActualizado"
          />
        </div>
      </div>

      <div class="rounded-2xl border border-[var(--color-line)] bg-white p-5">
        <h2 class="mb-3 font-[family-name:var(--font-heading)] text-base font-semibold text-[var(--color-ink)]">
          Canales de Notificación
        </h2>
        <dl class="space-y-3 text-sm">
          <div>
            <dt class="font-[family-name:var(--font-mono)] text-[11px] font-semibold uppercase text-[var(--color-ink)]/60">
              Correo principal
            </dt>
            <dd class="font-[family-name:var(--font-mono)] font-semibold text-[var(--color-ink)]">
              {{ coachee.emailContacto ?? coachee.user?.email ?? '—' }}
            </dd>
          </div>
          <div>
            <dt class="font-[family-name:var(--font-mono)] text-[11px] font-semibold uppercase text-[var(--color-ink)]/60">
              Teléfono / SMS
            </dt>
            <dd
              class="text-[var(--color-ink)]"
              :class="coachee.telefono ? 'font-semibold' : 'italic text-[var(--color-ink)]/50'"
            >
              {{ coachee.telefono ?? 'No registrado por el coachee' }}
            </dd>
          </div>
        </dl>
        <p class="mt-4 border-t border-[var(--color-line)] pt-3 text-xs text-[var(--color-ink)]/50">
          Datos sincronizados desde la cuenta del coachee (solo lectura).
        </p>
      </div>
    </div>
  </div>
</template>
