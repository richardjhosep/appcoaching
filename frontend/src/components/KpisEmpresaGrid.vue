<script setup lang="ts">
import KpiCard from './KpiCard.vue'
import { tonoDeNivel } from '../lib/nivelProgreso'
import type { KpisEmpresa } from '../api/satisfaccion'

// Los 4 indicadores principales de la empresa (Resumen e Informe ejecutivo). El color de la
// asistencia y la satisfacción sale de los mismos umbrales que el avance (nivelProgreso);
// satisfacción 1-5 se lleva a escala 0-100 para reutilizarlos.
defineProps<{ kpis: KpisEmpresa }>()
</script>

<template>
  <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
    <KpiCard
      label="Procesos terminados"
      :value="kpis.procesosTerminados"
    />
    <KpiCard
      label="Procesos en curso"
      :value="kpis.procesosEnCurso"
    />
    <KpiCard
      label="Tasa de asistencia"
      :value="kpis.tasaAsistencia !== null ? `${kpis.tasaAsistencia}%` : '—'"
      :tone="tonoDeNivel(kpis.tasaAsistencia)"
    />
    <KpiCard
      label="Satisfacción promedio"
      :value="kpis.satisfaccionPromedio !== null ? `${kpis.satisfaccionPromedio}/5` : '—'"
      :tone="tonoDeNivel(kpis.satisfaccionPromedio !== null ? kpis.satisfaccionPromedio * 20 : null)"
    />
  </div>
</template>
