<script setup lang="ts">
// Aviso fijo del portal de empresa: qué información del proceso llega a la empresa y cuál no.
// El texto se limita a lo que el backend realmente expone al rol empresa (ver
// docs/flujos-por-rol.md): las notas privadas del coach se eliminan antes de responder
// (SesionesService.stripPrivateNotes) y el post-sesión, el diario, los mapas y la pizarra del
// coachee no tienen ninguna ruta para este rol.
import NavIcon from './NavIcon.vue'
</script>

<template>
  <section
    aria-labelledby="nota-confidencialidad-titulo"
    class="rounded-2xl border border-[var(--color-saltup)]/30 bg-[var(--color-saltup)]/5 p-4 print:hidden"
  >
    <h2
      id="nota-confidencialidad-titulo"
      class="mb-2 flex items-center gap-2 font-[family-name:var(--font-heading)] text-sm font-semibold"
    >
      <NavIcon
        name="legal"
        :size="16"
        class="text-[var(--color-saltup)]"
      />
      Qué ve tu empresa y qué no
    </h2>
    <div class="grid gap-3 text-sm text-[var(--color-muted)] md:grid-cols-2">
      <p>
        <strong class="text-[var(--color-ink)]">Ves:</strong> el avance general de cada persona,
        sus sesiones realizadas y la próxima agendada, el objetivo de su plan, el resultado,
        el feedback y el impacto en el negocio al cerrar el proceso, y los documentos compartidos.
      </p>
      <p>
        <strong class="text-[var(--color-ink)]">No ves:</strong> las notas privadas de tu coach,
        el detalle de lo conversado en cada sesión ni las herramientas personales del coachee
        (diario, mapas y pizarra).
      </p>
    </div>
  </section>
</template>
