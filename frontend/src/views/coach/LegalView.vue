<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppShell from '../../components/AppShell.vue'
import {
  getResumenLegal,
  getCumplimiento,
  upsertDocumentoLegal,
  type EmpresaLegal,
  type MedidaCumplimiento,
  type TipoDocumentoLegal,
} from '../../api/legal'
import { listCoachees, setConsentimiento, type CoacheeListItem } from '../../api/coachees'
import { ApiError } from '../../api/client'

const loading = ref(true)
const resumen = ref<EmpresaLegal[]>([])
const cumplimiento = ref<MedidaCumplimiento[]>([])
const coachees = ref<CoacheeListItem[]>([])
const error = ref<string | null>(null)

const independientes = computed(() => coachees.value.filter((c) => !c.empresaId))

function coacheesDeEmpresa(empresaId: string) {
  return coachees.value.filter((c) => c.empresaId === empresaId)
}

async function load() {
  loading.value = true
  const [r, c, co] = await Promise.all([getResumenLegal(), getCumplimiento(), listCoachees()])
  resumen.value = r
  cumplimiento.value = c
  coachees.value = co
  loading.value = false
}

onMounted(load)

async function guardarDocumento(
  empresaId: string,
  tipo: TipoDocumentoLegal,
  estado: 'firmado' | 'pendiente',
  fecha: string,
  vigencia: string,
) {
  try {
    await upsertDocumentoLegal(empresaId, tipo, {
      estado,
      fecha: fecha || undefined,
      vigencia: vigencia || undefined,
    })
    resumen.value = await getResumenLegal()
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'No se pudo guardar el documento.'
  }
}

async function toggleConsentimiento(coacheeId: string, informado: boolean) {
  try {
    const actualizado = await setConsentimiento(coacheeId, informado)
    coachees.value = coachees.value.map((c) => (c.id === coacheeId ? actualizado : c))
    resumen.value = await getResumenLegal()
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'No se pudo actualizar el consentimiento.'
  }
}
</script>

<template>
  <AppShell>
    <h1 class="mb-4 font-[family-name:var(--font-heading)] text-xl font-semibold">
      Legal y auditoría
    </h1>
    <div
      v-if="loading"
      class="text-sm text-[var(--color-ink)]/60"
    >
      Cargando…
    </div>
    <div
      v-else
      class="space-y-4"
    >
      <p
        v-if="error"
        class="text-sm text-[var(--color-bronze)]"
      >
        {{ error }}
      </p>

      <div
        v-for="empresa in resumen"
        :key="empresa.empresaId"
        class="rounded-2xl border border-[var(--color-line)] bg-white p-4"
      >
        <h2 class="mb-3 text-sm font-medium">
          {{ empresa.nombre }}
        </h2>
        <div class="mb-3 grid gap-3 sm:grid-cols-2">
          <div
            v-for="tipo in (['contrato', 'nda'] as const)"
            :key="tipo"
            class="rounded-lg border border-[var(--color-line)] p-3"
          >
            <p class="mb-2 text-xs font-medium uppercase text-[var(--color-ink)]/60">
              {{ tipo === 'contrato' ? 'Contrato' : 'NDA' }}
            </p>
            <select
              :value="empresa[tipo].estado"
              class="mb-2 w-full rounded-lg border border-[var(--color-line)] px-2 py-1 text-sm"
              @change="
                guardarDocumento(
                  empresa.empresaId,
                  tipo,
                  ($event.target as HTMLSelectElement).value as 'firmado' | 'pendiente',
                  empresa[tipo].fecha ?? '',
                  empresa[tipo].vigencia ?? '',
                )
              "
            >
              <option value="pendiente">
                Pendiente
              </option>
              <option value="firmado">
                Firmado
              </option>
            </select>
            <label class="mb-1 block text-xs">
              Fecha
              <input
                type="date"
                :value="empresa[tipo].fecha ?? ''"
                class="mt-0.5 w-full rounded-lg border border-[var(--color-line)] px-2 py-1 text-sm"
                @change="
                  guardarDocumento(
                    empresa.empresaId,
                    tipo,
                    empresa[tipo].estado,
                    ($event.target as HTMLInputElement).value,
                    empresa[tipo].vigencia ?? '',
                  )
                "
              >
            </label>
            <label class="block text-xs">
              Vigencia
              <input
                type="date"
                :value="empresa[tipo].vigencia ?? ''"
                class="mt-0.5 w-full rounded-lg border border-[var(--color-line)] px-2 py-1 text-sm"
                @change="
                  guardarDocumento(
                    empresa.empresaId,
                    tipo,
                    empresa[tipo].estado,
                    empresa[tipo].fecha ?? '',
                    ($event.target as HTMLInputElement).value,
                  )
                "
              >
            </label>
          </div>
        </div>

        <p class="mb-2 text-xs font-medium text-[var(--color-ink)]/60">
          Consentimiento informado: {{ empresa.coacheesConConsentimiento }} de {{ empresa.coacheesTotal }}
        </p>
        <ul class="space-y-1 text-sm">
          <li
            v-for="c in coacheesDeEmpresa(empresa.empresaId)"
            :key="c.id"
            class="flex items-center gap-2"
          >
            <input
              type="checkbox"
              :checked="c.consentimientoInformado"
              @change="toggleConsentimiento(c.id, ($event.target as HTMLInputElement).checked)"
            >
            {{ c.nombre }}
          </li>
        </ul>
      </div>

      <div
        v-if="independientes.length > 0"
        class="rounded-2xl border border-[var(--color-line)] bg-white p-4"
      >
        <h2 class="mb-3 text-sm font-medium">
          Independientes — consentimiento informado
        </h2>
        <ul class="space-y-1 text-sm">
          <li
            v-for="c in independientes"
            :key="c.id"
            class="flex items-center gap-2"
          >
            <input
              type="checkbox"
              :checked="c.consentimientoInformado"
              @change="toggleConsentimiento(c.id, ($event.target as HTMLInputElement).checked)"
            >
            {{ c.nombre }}
          </li>
        </ul>
      </div>

      <div class="rounded-2xl border border-[var(--color-line)] bg-white p-4">
        <h2 class="mb-3 text-sm font-medium">
          Panel de cumplimiento LPDP
        </h2>
        <ul class="space-y-2 text-sm">
          <li
            v-for="m in cumplimiento"
            :key="m.id"
            class="flex items-start gap-2"
          >
            <span :class="m.activa ? 'text-[var(--color-sage)]' : 'text-[var(--color-bronze)]'">
              {{ m.activa ? '✓' : '○' }}
            </span>
            <span>{{ m.descripcion }}</span>
          </li>
        </ul>
      </div>
    </div>
  </AppShell>
</template>
