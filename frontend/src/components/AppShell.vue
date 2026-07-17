<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()

async function handleLogout() {
  await auth.logout()
  await router.push({ name: 'login' })
}
</script>

<template>
  <div class="min-h-screen bg-[var(--color-ivory)] text-[var(--color-ink)]">
    <header
      class="flex items-center justify-between border-b border-[var(--color-line)] bg-[var(--color-ink)] px-4 py-3 text-[var(--color-parchment)] sm:px-6"
    >
      <span class="font-[family-name:var(--font-heading)] text-base font-semibold">
        Coach Fernando Ramos
      </span>
      <div
        v-if="auth.user"
        class="flex items-center gap-3 text-sm"
      >
        <nav
          v-if="auth.user.role === 'coachee'"
          class="hidden gap-3 sm:flex"
        >
          <RouterLink
            to="/coachee/plan"
            class="hover:underline"
          >
            Plan
          </RouterLink>
          <RouterLink
            to="/coachee/sesiones"
            class="hover:underline"
          >
            Sesiones
          </RouterLink>
          <RouterLink
            to="/coachee/progreso"
            class="hover:underline"
          >
            Progreso
          </RouterLink>
          <RouterLink
            to="/coachee/biblioteca"
            class="hover:underline"
          >
            Biblioteca
          </RouterLink>
        </nav>
        <nav
          v-else-if="auth.user.role === 'coach'"
          class="hidden gap-3 sm:flex"
        >
          <RouterLink
            to="/coach/planes"
            class="hover:underline"
          >
            Planes
          </RouterLink>
          <RouterLink
            to="/coach/recursos"
            class="hover:underline"
          >
            Recursos
          </RouterLink>
        </nav>
        <span class="hidden sm:inline">{{ auth.user.email }}</span>
        <button
          class="rounded-lg border border-[var(--color-parchment)]/40 px-3 py-1 text-xs transition-colors hover:bg-[var(--color-parchment)]/10"
          @click="handleLogout"
        >
          Cerrar sesión
        </button>
      </div>
    </header>
    <main class="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <slot />
    </main>
  </div>
</template>
