<script setup lang="ts">
import SkeletonBlock from '../../../components/SkeletonBlock.vue'
import { onMounted, ref, watch } from 'vue'
import { getAuditLog, type AuditLog } from '../../../api/audit'
import { verboAuditoria } from '../../../lib/auditFormat'
import { listCoachees, type CoacheeListItem } from '../../../api/coachees'
import { listEmpresas, type Empresa } from '../../../api/empresas'

const logs = ref<AuditLog[]>([])
const loading = ref(true)
const mostrandoTodo = ref(false)

const coachees = ref<CoacheeListItem[]>([])
const empresas = ref<Empresa[]>([])
const targetId = ref('')
const desde = ref('')
const hasta = ref('')

async function cargar() {
  loading.value = true
  logs.value = await getAuditLog({
    scope: mostrandoTodo.value ? 'todo' : 'coaching',
    targetId: targetId.value || undefined,
    desde: desde.value || undefined,
    hasta: hasta.value || undefined,
  })
  loading.value = false
}

watch([targetId, desde, hasta, mostrandoTodo], cargar)

function limpiarFiltros() {
  targetId.value = ''
  desde.value = ''
  hasta.value = ''
}

const hayFiltrosDeTarget = () => targetId.value || desde.value || hasta.value

onMounted(async () => {
  const [co, emp] = await Promise.all([listCoachees(), listEmpresas()])
  coachees.value = co
  empresas.value = emp
  await cargar()
})

function fechaHora(iso: string): { fecha: string; hora: string } {
  const d = new Date(iso)
  return {
    fecha: d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' }),
    hora: d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
  }
}
</script>

<template>
  <div>
    <div class="mb-4 flex flex-wrap items-end gap-3">
      <label class="text-xs text-[var(--color-ink)]/60">
        Empresa o coachee
        <select
          v-model="targetId"
          class="mt-0.5 block rounded-lg border border-[var(--color-line)] px-2 py-1.5 text-sm"
        >
          <option value="">
            Todos
          </option>
          <optgroup label="Empresas">
            <option
              v-for="e in empresas"
              :key="e.id"
              :value="e.id"
            >
              {{ e.nombre }}
            </option>
          </optgroup>
          <optgroup label="Coachees">
            <option
              v-for="c in coachees"
              :key="c.id"
              :value="c.id"
            >
              {{ c.nombre }}
            </option>
          </optgroup>
        </select>
      </label>
      <label class="text-xs text-[var(--color-ink)]/60">
        Desde
        <input
          v-model="desde"
          type="date"
          class="mt-0.5 block rounded-lg border border-[var(--color-line)] px-2 py-1.5 text-sm"
        >
      </label>
      <label class="text-xs text-[var(--color-ink)]/60">
        Hasta
        <input
          v-model="hasta"
          type="date"
          class="mt-0.5 block rounded-lg border border-[var(--color-line)] px-2 py-1.5 text-sm"
        >
      </label>
      <button
        v-if="hayFiltrosDeTarget()"
        type="button"
        class="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-xs text-[var(--color-ink)]/70 hover:bg-[var(--color-parchment)]/60"
        @click="limpiarFiltros"
      >
        Limpiar filtros
      </button>
    </div>

    <SkeletonBlock v-if="loading" />
    <div v-else>
      <p
        v-if="logs.length === 0"
        class="text-sm text-[var(--color-ink)]/60"
      >
        Todavía no hay actividad registrada con estos filtros.
      </p>
      <ul
        v-else
        class="space-y-1"
      >
        <li
          v-for="log in logs"
          :key="log.id"
          class="rounded-xl border border-[var(--color-line)] bg-white px-4 py-2.5 text-sm"
        >
          <span class="font-[family-name:var(--font-mono)] text-xs text-[var(--color-ink)]/50">
            {{ fechaHora(log.createdAt).fecha }} · {{ fechaHora(log.createdAt).hora }}
          </span>
          <span class="text-[var(--color-ink)]/40"> — </span>
          <span class="font-medium">{{ log.actorLabel ?? 'Actor no disponible' }}</span>
          <span class="text-[var(--color-ink)]/40"> — </span>
          <span class="text-[var(--color-ink)]/80">{{ verboAuditoria(log) }}</span>
          <span
            v-if="!log.actorLabel"
            class="ml-1.5 rounded-full bg-[var(--color-parchment)] px-2 py-0.5 text-[10px] text-[var(--color-ink)]/50"
            title="Este registro es de antes de que la auditoría guardara quién hizo cada acción — no es una acción automática del sistema, sólo falta ese dato."
          >
            registro antiguo
          </span>
        </li>
      </ul>

      <button
        type="button"
        class="mt-3 text-xs text-[var(--color-ink)]/50 hover:underline"
        @click="mostrandoTodo = !mostrandoTodo"
      >
        {{ mostrandoTodo
          ? 'Ocultar actividad de la cuenta'
          : 'Mostrar también actividad de la cuenta (inicios de sesión, contraseñas, etc.)' }}
      </button>
    </div>
  </div>
</template>
