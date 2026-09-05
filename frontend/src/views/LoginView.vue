<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { ApiError } from '../api/client'
import AppLogo from '../components/AppLogo.vue'
import PasswordField from '../components/PasswordField.vue'

const auth = useAuthStore()
const router = useRouter()

const email = ref('')
const password = ref('')
const error = ref<string | null>(null)
const loading = ref(false)

async function handleSubmit() {
  error.value = null
  loading.value = true
  try {
    await auth.login(email.value, password.value)
    await router.push('/')
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'No se pudo iniciar sesión.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div
    class="flex min-h-screen items-center justify-center px-4"
    style="background: radial-gradient(circle at 20% 20%, #1c2b20 0%, var(--color-ink) 55%, #0a0a0a 100%);"
  >
    <div class="w-full max-w-sm">
      <div class="mb-6 flex flex-col items-center gap-2 text-center">
        <AppLogo
          :size="56"
          :show-wordmark="false"
          dark
        />
        <p class="font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight text-[var(--color-ivory)]">
          Coach<span class="text-[var(--color-bronze)]">Nexus</span>
        </p>
        <p class="text-sm text-white/60">
          Gestiona tu práctica. Multiplica tu impacto.
        </p>
      </div>

      <form
        class="rounded-2xl border border-white/10 bg-white p-7 shadow-xl shadow-black/20"
        @submit.prevent="handleSubmit"
      >
        <h1
          class="mb-1 font-[family-name:var(--font-heading)] text-lg font-semibold text-[var(--color-ink)]"
        >
          ¡Bienvenido de vuelta!
        </h1>
        <p class="mb-6 text-sm text-[var(--color-ink)]/60">
          Ingresa a tu cuenta para continuar
        </p>

        <label class="mb-4 block text-sm font-medium text-[var(--color-ink)]/80">
          Email
          <input
            v-model="email"
            type="email"
            required
            autocomplete="username"
            placeholder="tu@correo.com"
            class="mt-1.5 w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-ivory)]/60 px-3 py-2.5 text-sm text-[var(--color-ink)] transition-shadow focus:border-[var(--color-sage)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)]/30"
          >
        </label>

        <div class="mb-5">
          <PasswordField
            v-model="password"
            label="Contraseña"
            autocomplete="current-password"
            input-class="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-ivory)]/60 px-3 py-2.5 pr-10 text-sm text-[var(--color-ink)] transition-shadow focus:border-[var(--color-sage)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)]/30"
          />
        </div>

        <p
          v-if="error"
          class="mb-4 rounded-lg bg-[var(--color-danger)]/10 px-3 py-2 text-sm text-[var(--color-danger)]"
        >
          {{ error }}
        </p>

        <button
          type="submit"
          :disabled="loading"
          class="w-full rounded-lg bg-[var(--color-ink)] px-4 py-2.5 text-sm font-medium text-[var(--color-parchment)] transition-colors hover:bg-[var(--color-ink)]/85 disabled:opacity-60"
        >
          {{ loading ? 'Ingresando…' : 'Ingresar' }}
        </button>
      </form>

      <p class="mt-6 text-center text-xs text-white/40">
        CoachNexus · Plataforma de acompañamiento
      </p>
    </div>
  </div>
</template>
