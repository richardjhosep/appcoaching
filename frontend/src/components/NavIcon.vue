<script setup lang="ts">
withDefaults(defineProps<{ name: string; size?: number }>(), { size: 18 })
</script>

<template>
  <svg
    :width="size"
    :height="size"
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
    <template v-else-if="name === 'administracion'">
      <circle
        cx="12"
        cy="12"
        r="3"
      /><path d="M19.4 13.5a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1h-.2a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h.1a1.7 1.7 0 0 0 1-1.6v-.2a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.6 1h.2a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.6 1z" />
    </template>
    <template v-else-if="name === 'empresas'">
      <rect
        x="5"
        y="3"
        width="14"
        height="18"
        rx="1"
      /><path d="M9 21v-4h6v4M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1" />
    </template>
    <template v-else-if="name === 'usuarios'">
      <circle
        cx="12"
        cy="8"
        r="3.5"
      /><path d="M5 20a7 7 0 0 1 14 0" />
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
    <template v-else-if="name === 'prospectos'">
      <path d="M4 4h16l-6 8v6l-4 2v-8z" />
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
    <template v-else-if="name === 'password'">
      <rect
        x="5"
        y="11"
        width="14"
        height="9"
        rx="1.5"
      /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </template>
    <template v-else-if="name === 'buscar'">
      <circle
        cx="11"
        cy="11"
        r="7"
      /><path d="m20 20-3.5-3.5" />
    </template>
    <template v-else-if="name === 'flecha-izquierda'">
      <path d="M19 12H5" /><path d="M11 18l-6-6 6-6" />
    </template>
    <template v-else-if="name === 'correo'">
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2"
      /><path d="m4 7 8 6 8-6" />
    </template>
    <template v-else-if="name === 'telefono'">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
    </template>
    <template v-else-if="name === 'contacto'">
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="1.5"
      /><circle
        cx="8.5"
        cy="12"
        r="2"
      /><path d="M6 16.5a2.5 2.5 0 0 1 5 0M13 10h5M13 14h3" />
    </template>
    <template v-else-if="name === 'objetivo'">
      <circle
        cx="12"
        cy="12"
        r="8.5"
      /><circle
        cx="12"
        cy="12"
        r="4.5"
      /><circle
        cx="12"
        cy="12"
        r="1"
        fill="currentColor"
        stroke="none"
      />
    </template>
    <template v-else-if="name === 'lista'">
      <path d="M4 6.3l1.4 1.4L8 5" /><path d="M4 12.3l1.4 1.4 2.6-2.7" /><path d="M4 18.3l1.4 1.4 2.6-2.7" /><path d="M11 6.5h9M11 12.5h9M11 18.5h9" />
    </template>
    <template v-else-if="name === 'habito'">
      <path d="M17 2.1l4 4-4 4" /><path d="M3 12.1v-2a4 4 0 0 1 4-4h14" /><path d="M7 21.9l-4-4 4-4" /><path d="M21 11.9v2a4 4 0 0 1-4 4H3" />
    </template>
    <template v-else-if="name === 'formacion'">
      <path d="M12 3l10 5-10 5L2 8z" /><path d="M6 10.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-5.5" /><path d="M22 8v6" />
    </template>
    <template v-else-if="name === 'diario'">
      <path d="M12 6.5c-1.6-1.1-4-1.6-6-1v13c2-.6 4.4-.1 6 1 1.6-1.1 4-1.6 6-1v-13c-2-.6-4.4-.1-6 1z" /><path d="M12 6.5v13" />
    </template>
    <template v-else-if="name === 'quiz'">
      <circle
        cx="12"
        cy="12"
        r="9"
      /><path d="M9.2 9.3a2.8 2.8 0 0 1 5.4.9c0 1.8-2.4 2.3-2.4 4" /><circle
        cx="12"
        cy="17"
        r="0.6"
        fill="currentColor"
        stroke="none"
      />
    </template>
    <template v-else-if="name === 'flashcards'">
      <rect
        x="6"
        y="3.5"
        width="14"
        height="10"
        rx="1.5"
      /><rect
        x="3.5"
        y="8.5"
        width="14"
        height="10"
        rx="1.5"
      />
    </template>
    <template v-else-if="name === 'pizarra'">
      <rect
        x="3"
        y="4"
        width="18"
        height="13"
        rx="1.5"
      /><path d="M8 21h8M12 17v4" />
    </template>
    <template v-else-if="name === 'mapa'">
      <circle
        cx="6"
        cy="12"
        r="2.6"
      /><circle
        cx="17"
        cy="6"
        r="2.6"
      /><circle
        cx="17"
        cy="18"
        r="2.6"
      /><path d="M8.4 10.8L14.6 7.2M8.4 13.2L14.6 16.8" />
    </template>
    <template v-else-if="name === 'ejercicios'">
      <path d="M4 5h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-9l-4 4v-4H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" /><circle
        cx="9"
        cy="11"
        r="0.6"
        fill="currentColor"
        stroke="none"
      /><circle
        cx="13"
        cy="11"
        r="0.6"
        fill="currentColor"
        stroke="none"
      /><circle
        cx="17"
        cy="11"
        r="0.6"
        fill="currentColor"
        stroke="none"
      />
    </template>
    <template v-else-if="name === 'estilo'">
      <path d="M4 12h16M4 12l4-4M4 12l4 4M20 12l-4-4M20 12l-4 4" /><circle
        cx="12"
        cy="12"
        r="1.8"
        fill="currentColor"
        stroke="none"
      />
    </template>
    <template v-else-if="name === 'playground'">
      <path d="M7 8h10a4 4 0 0 1 4 4v2a3 3 0 0 1-3 3c-1 0-1.5-.5-2-1l-1-1H9l-1 1c-.5.5-1 1-2 1a3 3 0 0 1-3-3v-2a4 4 0 0 1 4-4z" /><path d="M7.5 12h3M9 10.5v3" /><circle
        cx="15"
        cy="11"
        r="0.7"
        fill="currentColor"
        stroke="none"
      /><circle
        cx="17"
        cy="13"
        r="0.7"
        fill="currentColor"
        stroke="none"
      />
    </template>
    <template v-else-if="name === 'trofeo'">
      <path d="M8 4h8v4a4 4 0 0 1-8 0z" /><path d="M8 5H5a3 3 0 0 0 3 5" /><path d="M16 5h3a3 3 0 0 1-3 5" /><path d="M12 12v3" /><path d="M9 20h6" /><path d="M10 17h4v3h-4z" />
    </template>
    <template v-else-if="name === 'certificado'">
      <circle
        cx="12"
        cy="8"
        r="6.5"
      /><path d="M8.2 13.7L7 22l5-3 5 3-1.2-8.3" />
    </template>
    <template v-else-if="name === 'linkedin'">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4V9h4v1.5A5.98 5.98 0 0 1 16 8z" /><rect
        x="2"
        y="9"
        width="4"
        height="12"
      /><circle
        cx="4"
        cy="4"
        r="2"
      />
    </template>
    <template v-else-if="name === 'instagram'">
      <rect
        x="2"
        y="2"
        width="20"
        height="20"
        rx="5"
      /><circle
        cx="12"
        cy="12"
        r="4"
      /><circle
        cx="17.5"
        cy="6.5"
        r="0.6"
        fill="currentColor"
        stroke="none"
      />
    </template>
    <template v-else-if="name === 'facebook'">
      <path d="M15 3h-2a5 5 0 0 0-5 5v3H5v4h3v6h4v-6h3l1-4h-4V8a1 1 0 0 1 1-1h3z" />
    </template>
    <template v-else-if="name === 'youtube'">
      <path d="M22 8.2a3 3 0 0 0-2.1-2.1C18.1 5.6 12 5.6 12 5.6s-6.1 0-7.9.5A3 3 0 0 0 2 8.2a31 31 0 0 0-.5 5.8 31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.8.5 7.9.5 7.9.5s6.1 0 7.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-5.8 31 31 0 0 0-.5-5.8z" /><path
        d="M9.9 17.1 15.8 14 9.9 10.9z"
        fill="currentColor"
        stroke="none"
      />
    </template>
    <template v-else-if="name === 'sitio-web'">
      <circle
        cx="12"
        cy="12"
        r="9"
      /><path d="M3 12h18M12 3a15 15 0 0 1 3.5 9 15 15 0 0 1-3.5 9 15 15 0 0 1-3.5-9A15 15 0 0 1 12 3z" />
    </template>
    <template v-else-if="name === 'enlace-externo'">
      <path d="M17 13.5V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h4.5" /><path d="M14 3h7v7" /><path d="M10.5 13.5 21 3" />
    </template>
    <template v-else-if="name === 'impacto'">
      <path
        d="M13 2 4 14h6l-1 8 9-12h-6l1-8z"
        stroke-linejoin="round"
      />
    </template>
    <template v-else-if="name === 'chevron'">
      <path d="M9 6l6 6-6 6" />
    </template>
    <template v-else-if="name === 'configuracion'">
      <circle
        cx="12"
        cy="12"
        r="3"
      /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9.6a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </template>
  </svg>
</template>
