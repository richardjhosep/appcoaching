<script setup lang="ts">
import AppShell from '../../components/AppShell.vue'
import SectionCard from '../../components/SectionCard.vue'

// Contenido estático — tomado del sitio y la propuesta comercial reales del coach.
// Sin backend: es contenido de marca/trayectoria, no un dato del negocio que cambie
// por coachee o por empresa. Si más adelante se necesita editable desde la UI, el
// patrón a seguir es el mismo de PlanDesarrollo (tabla 1-a-1 con el coach).
const teAyudoA = [
  'Acelerar tu desarrollo profesional',
  'Desarrollar liderazgo transformador',
  'Impulsar resultados estratégicos',
  'Mejorar la gestión de equipos',
  'Diseñar y ejecutar con excelencia los procesos',
  'Fortalecer la toma de decisiones',
  'Liderar iniciativas de alto impacto',
]
</script>

<template>
  <AppShell>
    <h1 class="mb-4 font-[family-name:var(--font-heading)] text-xl font-semibold">
      Mi Coach
    </h1>

    <div class="space-y-4">
      <SectionCard
        title="Sobre mí"
        icon="contacto"
      >
        <p class="mb-3 text-sm font-medium text-[var(--color-ink)]/80">
          Fernando Ramos — Coach Ejecutivo
        </p>
        <p class="mb-3 text-sm">
          Integro 20 años liderando operaciones y equipos —en Chile y en el extranjero— con
          coaching ejecutivo certificado, para ayudarte a acelerar tu desarrollo y lograr
          resultados sostenibles en tu organización.
        </p>
        <p class="text-sm">
          He ocupado posiciones directivas en áreas estratégicas y operacionales, en compañías
          nacionales y multinacionales. Diseñar estrategia, rediseñar procesos y liderar su
          ejecución hasta lograr resultados sostenibles ha sido el hilo conductor de mi carrera —
          hoy pongo esa misma experiencia al servicio de tu proceso de coaching.
        </p>
      </SectionCard>

      <SectionCard
        title="Cómo ayudo"
        icon="objetivo"
      >
        <p class="mb-3 text-sm text-[var(--color-ink)]/60">
          Un enfoque práctico, orientado a resultados: no es solo conversar — es diseñar,
          ejecutar y sostener el cambio que tu rol necesita.
        </p>
        <ul class="grid gap-2 sm:grid-cols-2">
          <li
            v-for="(item, i) in teAyudoA"
            :key="item"
            class="flex items-start gap-2 rounded-lg border border-[var(--color-line)] p-2 text-sm"
          >
            <span class="font-[family-name:var(--font-mono)] text-xs text-[var(--color-bronze)]">{{ String(i + 1).padStart(2, '0') }}</span>
            <span>{{ item }}</span>
          </li>
        </ul>
      </SectionCard>

      <SectionCard
        title="Metodología"
        icon="lista"
      >
        <p class="text-sm">
          Sesiones individuales con enfoque apreciativo y basado en modelos reconocidos como el
          de GROW (Whitmore) y fortalezas (Zenger & Folkman), orientadas a objetivos definidos por
          cada participante y alineados con los intereses institucionales.
        </p>
      </SectionCard>
    </div>
  </AppShell>
</template>
