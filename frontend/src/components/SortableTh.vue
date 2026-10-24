<script setup lang="ts">
import NavIcon from './NavIcon.vue'
// Cabecera de columna ordenable: <th scope="col" aria-sort> con un botón que alterna
// ascendente/descendente. El orden vive en la vista (ver lib/ordenar.ts).
defineProps<{ label: string; activo: boolean; dir: 'asc' | 'desc' }>()
defineEmits<{ ordenar: [] }>()
</script>

<template>
  <th
    scope="col"
    :aria-sort="activo ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'"
  >
    <button
      type="button"
      class="inline-flex items-center gap-1 rounded font-medium hover:text-[var(--color-ink)]"
      @click="$emit('ordenar')"
    >
      {{ label }}
      <NavIcon
        :name="activo ? (dir === 'asc' ? 'flecha-arriba' : 'flecha-abajo') : 'ordenar'"
        :size="14"
        aria-hidden="true"
        :class="activo ? 'text-[var(--color-ink)]' : 'text-[var(--color-subtle)]'"
      />
    </button>
  </th>
</template>
