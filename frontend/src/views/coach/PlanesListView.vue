<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '../../components/AppShell.vue'
import { listPlanes, type PlanDesarrollo, type EstadoPlan } from '../../api/planesDesarrollo'

const router = useRouter()
const planes = ref<PlanDesarrollo[]>([])
const loading = ref(true)
const filtro = ref<EstadoPlan | ''>('pendiente_aprobacion')

const estadoLabel: Record<string, string> = {
  sin_enviar: 'Sin enviar',
  pendiente_aprobacion: 'Pendiente de aprobación',
  aprobado: 'Aprobado',
  cambios_solicitados: 'Cambios solicitados',
}

async function load() {
  loading.value = true
  planes.value = await listPlanes(filtro.value || undefined)
  loading.value = false
}

onMounted(load)

function verDetalle(coacheeId: string) {
  void router.push({ name: 'coach-plan-detail', params: { coacheeId } })
}
</script>

<template>
  <AppShell>
    <h1 class="mb-4 font-[family-name:var(--font-heading)] text-xl font-semibold">
      Planes de desarrollo
    </h1>

    <select
      v-model="filtro"
      class="mb-4 rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
      @change="load"
    >
      <option value="">
        Todos los estados
      </option>
      <option value="pendiente_aprobacion">
        Pendientes de aprobación
      </option>
      <option value="cambios_solicitados">
        Cambios solicitados
      </option>
      <option value="aprobado">
        Aprobados
      </option>
      <option value="sin_enviar">
        Sin enviar
      </option>
    </select>

    <div
      v-if="loading"
      class="text-sm text-[var(--color-ink)]/60"
    >
      Cargando…
    </div>
    <p
      v-else-if="planes.length === 0"
      class="text-sm text-[var(--color-ink)]/60"
    >
      No hay planes con este filtro.
    </p>
    <ul
      v-else
      class="space-y-2"
    >
      <li
        v-for="p in planes"
        :key="p.id"
        class="flex cursor-pointer items-center justify-between rounded-xl border border-[var(--color-line)] bg-white p-3 text-sm hover:border-[var(--color-sage)]"
        @click="verDetalle(p.coacheeId)"
      >
        <span>{{ p.coachee?.nombre ?? p.coacheeId }}</span>
        <span class="font-[family-name:var(--font-mono)] text-xs text-[var(--color-ink)]/60">
          {{ estadoLabel[p.estado] }}
        </span>
      </li>
    </ul>
  </AppShell>
</template>
