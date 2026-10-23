<script setup lang="ts">
// Glosario breve de los términos que aparecen en los indicadores del portal de empresa.
import AyudaHerramienta from './AyudaHerramienta.vue'
</script>

<template>
  <AyudaHerramienta
    titulo="Glosario: ciclo, asistencia, avance y niveles"
    class="print:hidden"
  >
    <dl class="space-y-2">
      <div>
        <dt class="font-semibold text-[var(--color-ink)]">
          Ciclo
        </dt>
        <dd>
          El proceso de coaching de una persona, con un número acordado de sesiones. Lo abre y
          lo cierra tu coach, que registra el resultado al terminar.
        </dd>
      </div>
      <div>
        <dt class="font-semibold text-[var(--color-ink)]">
          Tasa de asistencia
        </dt>
        <dd>
          Porcentaje de sesiones a las que la persona asistió, sobre las sesiones cuya
          asistencia ya registró tu coach.
        </dd>
      </div>
      <div>
        <dt class="font-semibold text-[var(--color-ink)]">
          Avance
        </dt>
        <dd>
          Se calcula con las autoevaluaciones que la persona completa después de cada sesión.
          Es una percepción propia, no una evaluación externa. Desde 80 % se considera alto;
          entre 40 % y 79 %, medio; bajo 40 %, bajo.
        </dd>
      </div>
      <div>
        <dt class="font-semibold text-[var(--color-ink)]">
          Niveles de competencia
        </dt>
        <dd>
          Cada competencia describe sus niveles de dominio y el comportamiento esperado en cada
          uno. Las competencias propias de tu empresa y sus niveles se definen en la sección
          Competencias.
        </dd>
      </div>
    </dl>
  </AyudaHerramienta>
</template>
