<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
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
const errorLista = ref(false)
const ariaLabel = computed(() =>
  unreadCount.value > 0 ? `Notificaciones, ${unreadCount.value} sin leer` : 'Notificaciones',
)
let pollHandle: ReturnType<typeof setInterval> | undefined

async function refreshCount() {
  try {
    const { count } = await getNoLeidasCount()
    unreadCount.value = count
  } catch {
    // El contador es decorativo: un fallo de red no debe romper el encabezado ni dejar un
    // rechazo sin manejar cada 60 s.
  }
}

async function loadList() {
  errorLista.value = false
  try {
    notificaciones.value = await getMisNotificaciones()
  } catch {
    errorLista.value = true
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && open.value) open.value = false
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
  document.addEventListener('keydown', onKeydown)
  pollHandle = setInterval(() => void refreshCount(), 60_000)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  if (pollHandle) clearInterval(pollHandle)
})
</script>

<template>
  <div class="relative">
    <button
      type="button"
      :aria-label="ariaLabel"
      aria-haspopup="true"
      :aria-expanded="open"
      class="relative flex h-11 w-11 items-center sm:h-9 sm:w-9 justify-center rounded-full hover:bg-[var(--color-parchment)]/60"
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
        class="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-saltup)] px-1 text-xs font-medium text-white"
        aria-hidden="true"
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
      class="absolute right-0 top-full z-30 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-[var(--color-line)] bg-white p-2 shadow-[var(--shadow-pop)]"
    >
      <p
        v-if="errorLista"
        role="alert"
        class="p-3 text-sm text-[var(--color-danger)]"
      >
        No pudimos cargar tus notificaciones.
        <button
          type="button"
          class="underline"
          @click="loadList"
        >
          Reintentar
        </button>
      </p>
      <p
        v-else-if="notificaciones.length === 0"
        class="p-3 text-sm text-[var(--color-muted)]"
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
            <span class="text-xs text-[var(--color-subtle)]">
              {{ new Date(n.createdAt).toLocaleString('es-CL') }}
            </span>
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>
