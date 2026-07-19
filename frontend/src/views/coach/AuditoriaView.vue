<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AppShell from '../../components/AppShell.vue'
import { getAuditLog, type AuditLog } from '../../api/audit'

const logs = ref<AuditLog[]>([])
const loading = ref(true)
const filtroAccion = ref('')
const filtroCoacheeId = ref('')

async function load() {
  loading.value = true
  logs.value = await getAuditLog({
    action: filtroAccion.value || undefined,
    targetId: filtroCoacheeId.value || undefined,
  })
  loading.value = false
}

onMounted(load)
</script>

<template>
  <AppShell>
    <h1 class="mb-4 font-[family-name:var(--font-heading)] text-xl font-semibold">
      Historial de auditoría
    </h1>

    <div class="mb-4 flex flex-col gap-2 sm:flex-row">
      <input
        v-model="filtroAccion"
        type="text"
        placeholder="Filtrar por acción (ej. CICLO_CERRADO)"
        class="flex-1 rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
        @keyup.enter="load"
      >
      <input
        v-model="filtroCoacheeId"
        type="text"
        placeholder="Filtrar por ID de coachee"
        class="flex-1 rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm"
        @keyup.enter="load"
      >
      <button
        class="rounded-lg border border-[var(--color-line)] px-3 py-2 text-sm hover:bg-[var(--color-parchment)]/50"
        @click="load"
      >
        Filtrar
      </button>
    </div>

    <div
      v-if="loading"
      class="text-sm text-[var(--color-ink)]/60"
    >
      Cargando…
    </div>
    <p
      v-else-if="logs.length === 0"
      class="text-sm text-[var(--color-ink)]/60"
    >
      No hay registros con este filtro.
    </p>
    <div
      v-else
      class="overflow-x-auto"
    >
      <table
        class="w-full text-left text-sm"
      >
        <thead>
          <tr class="text-xs text-[var(--color-ink)]/60">
            <th class="py-1">
              Fecha
            </th>
            <th class="py-1">
              Acción
            </th>
            <th class="py-1">
              Sobre
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="log in logs"
            :key="log.id"
            class="border-t border-[var(--color-line)]"
          >
            <td class="py-2 font-[family-name:var(--font-mono)] text-xs">
              {{ new Date(log.createdAt).toLocaleString('es-CL') }}
            </td>
            <td class="py-2">
              {{ log.action }}
            </td>
            <td class="py-2 text-xs text-[var(--color-ink)]/60">
              {{ log.targetType ?? '—' }} {{ log.targetId ? `(${log.targetId})` : '' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </AppShell>
</template>
