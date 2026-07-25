<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  getMisNotificaciones,
  getNoLeidasCount,
  marcarNotificacionLeida,
  type Notificacion,
} from '../api/notificaciones'

const router = useRouter()

const open = ref(false)
const notificaciones = ref<Notificacion[]>([])
const unreadCount = ref(0)
let pollHandle: ReturnType<typeof setInterval> | undefined

async function refreshCount() {
  const { count } = await getNoLeidasCount()
  unreadCount.value = count
}

async function loadList() {
  notificaciones.value = await getMisNotificaciones()
}

async function toggle() {
  open.value = !open.value
  if (open.value) {
    await loadList()
  }
}

async function onClickNotificacion(n: Notificacion) {
  if (!n.leida) {
    await marcarNotificacionLeida(n.id)
    n.leida = true
    unreadCount.value = Math.max(0, unreadCount.value - 1)
  }
  open.value = false
  if (n.link) {
    await router.push(n.link)
  }
}

onMounted(() => {
  void refreshCount()
  pollHandle = setInterval(() => void refreshCount(), 60_000)
})

onUnmounted(() => {
  if (pollHandle) clearInterval(pollHandle)
})
</script>

<template>
  <div class="relative">
    <button
      type="button"
      aria-label="Notificaciones"
      class="relative flex h-9 w-9 items-center justify-center rounded-full hover:bg-[var(--color-parchment)]/60"
      @click="toggle"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      <span
        v-if="unreadCount > 0"
        class="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-saltup)] px-1 text-[10px] font-medium text-white"
      >
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>
    </button>

    <button
      v-if="open"
      aria-label="Cerrar notificaciones"
      class="fixed inset-0 z-20 cursor-default"
      @click="open = false"
    />
    <div
      v-if="open"
      class="absolute right-0 top-full z-30 mt-2 w-80 rounded-xl border border-[var(--color-line)] bg-white p-2 shadow-xl"
    >
      <p
        v-if="notificaciones.length === 0"
        class="p-3 text-sm text-[var(--color-ink)]/60"
      >
        No tienes notificaciones.
      </p>
      <ul
        v-else
        class="max-h-96 space-y-1 overflow-y-auto"
      >
        <li
          v-for="n in notificaciones"
          :key="n.id"
        >
          <button
            type="button"
            class="flex w-full flex-col gap-0.5 rounded-lg p-3 text-left text-sm hover:bg-[var(--color-parchment)]/50"
            :class="{ 'font-medium': !n.leida }"
            @click="onClickNotificacion(n)"
          >
            <span class="flex items-center gap-2">
              <span
                v-if="!n.leida"
                class="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-saltup)]"
              />
              {{ n.mensaje }}
            </span>
            <span class="text-xs text-[var(--color-ink)]/50">
              {{ new Date(n.createdAt).toLocaleString('es-CL') }}
            </span>
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>
