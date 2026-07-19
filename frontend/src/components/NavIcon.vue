<script setup lang="ts">
defineProps<{ name: string }>()
</script>

<template>
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="shrink-0"
  >
    <template v-if="name === 'dashboard'">
      <rect
        x="3"
        y="3"
        width="7"
        height="7"
        rx="1.5"
      /><rect
        x="14"
        y="3"
        width="7"
        height="7"
        rx="1.5"
      /><rect
        x="3"
        y="14"
        width="7"
        height="7"
        rx="1.5"
      /><rect
        x="14"
        y="14"
        width="7"
        height="7"
        rx="1.5"
      />
    </template>
    <template v-else-if="name === 'planes'">
      <path d="M6 3h9l4 4v14H6z" /><path d="M9 12h6M9 16h6M9 8h3" />
    </template>
    <template v-else-if="name === 'recursos'">
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z" /><path d="M4 19V5.5" />
    </template>
    <template v-else-if="name === 'negocio'">
      <path d="M4 20V10M11 20V4M18 20v-7" />
    </template>
    <template v-else-if="name === 'legal'">
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
    </template>
    <template v-else-if="name === 'auditoria'">
      <circle
        cx="12"
        cy="12"
        r="8.5"
      /><path d="M12 7.5V12l3 2" />
    </template>
    <template v-else-if="name === 'comercial'">
      <rect
        x="3"
        y="8"
        width="18"
        height="12"
        rx="1.5"
      /><path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18" />
    </template>
    <template v-else-if="name === 'empresas'">
      <rect
        x="4"
        y="3"
        width="12"
        height="18"
        rx="1"
      /><path d="M9 8h2M9 12h2M9 16h2M16 11h4v10h-4z" />
    </template>
    <template v-else-if="name === 'administracion'">
      <circle
        cx="12"
        cy="12"
        r="3"
      /><path d="M19.4 13.5a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1h-.2a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h.1a1.7 1.7 0 0 0 1-1.6v-.2a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.6 1h.2a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.6 1z" />
    </template>
    <template v-else-if="name === 'sesiones'">
      <rect
        x="3"
        y="4.5"
        width="18"
        height="16"
        rx="1.5"
      /><path d="M3 9h18M8 3v3M16 3v3" />
    </template>
    <template v-else-if="name === 'progreso'">
      <path d="M4 17l5-5 4 4 7-8" /><path d="M15 8h5v5" />
    </template>
    <template v-else-if="name === 'biblioteca'">
      <path d="M4 4.5v15l4-2 4 2 4-2 4 2v-15l-4-2-4 2-4-2z" />
    </template>
    <template v-else-if="name === 'coachees'">
      <circle
        cx="9"
        cy="8"
        r="3.2"
      /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><circle
        cx="17.5"
        cy="9"
        r="2.6"
      /><path d="M15.5 12.2A5.6 5.6 0 0 1 21.5 17.5" />
    </template>
    <template v-else-if="name === 'satisfaccion'">
      <path d="M12 3.5l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17.4l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />
    </template>
    <template v-else-if="name === 'logout'">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5M21 12H9" />
    </template>
  </svg>
</template>
