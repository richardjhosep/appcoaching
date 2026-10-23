<script setup lang="ts">
interface Paso {
  numero: number
  id: string
  titulo: string
  descripcion: string
  bullets?: string[]
  imagen: string
  tip?: string
}

const pasos: Paso[] = [
  {
    numero: 1,
    id: 'mi-aprendizaje',
    titulo: 'Mi Aprendizaje',
    descripcion:
      'Es la primera pantalla que ves al ingresar — tu punto de partida. Ahí vas a encontrar un resumen de tu próxima sesión, tus tareas pendientes y un vistazo rápido a tu progreso.',
    bullets: [
      'Al principio, antes de tu primera sesión, es normal que esta pantalla se vea vacía.',
      'A medida que avances con tu coach, acá vas a ver tu progreso y lo que te falta por hacer.',
    ],
    imagen: '/manual/mi-aprendizaje.jpg',
  },
  {
    numero: 2,
    id: 'plan',
    titulo: 'Mi plan de desarrollo',
    descripcion:
      'Acá defines, junto a tu coach, la competencia que vas a trabajar durante el ciclo: tu nivel actual, tu nivel objetivo y el plazo para lograrlo. El plan tiene tres pestañas — Definición, Hábito y ejecución y Formación — que se van completando a medida que avanza tu proceso.',
    bullets: [
      'Tu coach abre el ciclo; una vez abierto, vas completando cada etapa a tu ritmo.',
      'Cuando envías tu definición, queda activa de inmediato — no necesitas esperar una aprobación para seguir avanzando.',
    ],
    imagen: '/manual/plan.jpg',
  },
  {
    numero: 3,
    id: 'sesiones',
    titulo: 'Mis sesiones',
    descripcion:
      'Un calendario semanal con los horarios que tu coach dejó disponibles. Tocas un horario libre para solicitarlo: tu coach recibe la solicitud y la aprueba (la sesión queda agendada cuando responde). Desde ahí también puedes pedir reagendar si algo cambia, y ves si tu solicitud sigue pendiente.',
    imagen: '/manual/sesiones.jpg',
    tip: 'Si necesitas reagendar, hazlo con la mayor anticipación posible — tu coach recibe una notificación y responde tu solicitud desde la plataforma.',
  },
  {
    numero: 4,
    id: 'progreso',
    titulo: 'Mi progreso',
    descripcion:
      'Tu espacio personal para llevar registro del camino recorrido: logros puntuales que quieras anotar y un diario de reflexión libre entre sesión y sesión.',
    bullets: [
      'El gráfico de avance general se va llenando con las autoevaluaciones que completas después de cada sesión.',
      'Registrar logros y reflexiones es opcional, pero ayuda mucho a tu coach a entender cómo vas viviendo el proceso.',
    ],
    imagen: '/manual/progreso.jpg',
  },
  {
    numero: 5,
    id: 'mi-coach',
    titulo: 'Mi Coach',
    descripcion:
      'Acá conoces a la persona que va a acompañarte: su experiencia, certificaciones y la metodología que usa durante el proceso.',
    imagen: '/manual/mi-coach.jpg',
  },
  {
    numero: 6,
    id: 'biblioteca',
    titulo: 'Biblioteca',
    descripcion:
      'El material que tu coach va compartiendo contigo — textos, audios y videos — organizado por carpetas. Al principio puede estar vacía; se va llenando a medida que tu coach comparte contenido pensado para tu proceso.',
    imagen: '/manual/biblioteca.jpg',
  },
  {
    numero: 7,
    id: 'playground',
    titulo: 'Playground',
    descripcion:
      'Tu espacio para practicar lo que trabajas en sesión: quiz, flashcards, mapas mentales, ejercicios y tu test de estilo. Tu coach publica el contenido y tú lo trabajas a tu ritmo, cuando quieras.',
    bullets: [
      'Quiz y ejercicios: los completas y quedan registrados para que tu coach vea tus respuestas.',
      'Flashcards: son para repasar — no se corrigen ni se califican.',
      'Mapas mentales: los explora tu coach contigo; también tienes tu propio espacio de "Mis mapas" y una pizarra 100% personal.',
      'Test de estilo: te ayuda a ti y a tu coach a entender mejor tu forma de trabajar bajo presión.',
    ],
    imagen: '/manual/playground.jpg',
  },
]
</script>

<template>
  <div class="min-h-screen bg-[var(--color-parchment)]">
    <header class="rounded-b-2xl bg-[var(--color-ink)] px-6 py-12 text-center text-[var(--color-ivory)]">
      <p class="mb-4 font-[family-name:var(--font-heading)] text-sm font-semibold tracking-[0.08em] text-[var(--color-bronze)] uppercase">
        Coach<span class="text-[var(--color-bronze)]">Nexus</span>
      </p>
      <h1 class="mx-auto max-w-xl font-[family-name:var(--font-heading)] text-2xl font-semibold sm:text-3xl">
        Bienvenido/a a tu proceso de coaching
      </h1>
      <p class="mx-auto mt-3 max-w-md text-sm text-[var(--color-ivory)]/70">
        Esta guía te muestra, paso a paso y con capturas reales, cómo moverte dentro de la plataforma durante tu proceso.
      </p>
    </header>

    <main class="mx-auto max-w-3xl px-4 pb-16">
      <div class="mt-8 rounded-2xl border border-[var(--color-line)] bg-white p-6 text-sm leading-relaxed">
        <p class="mb-2">
          Ya recibiste tu correo de bienvenida con tu usuario y contraseña temporal. Esta guía complementa ese correo:
          te muestra qué vas a encontrar en cada sección de la plataforma para que llegues a tu primera sesión
          sabiendo moverte con confianza.
        </p>
        <p>No necesitas leerla de corrido — puedes volver a este enlace cuando quieras.</p>
      </div>

      <nav class="mt-6 rounded-2xl border border-[var(--color-line)] bg-white p-6">
        <h2 class="mb-3 font-[family-name:var(--font-heading)] text-xs font-semibold tracking-[0.06em] text-[var(--color-muted)] uppercase">
          Contenido
        </h2>
        <ol class="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <li
            v-for="paso in pasos"
            :key="paso.id"
          >
            <a
              :href="`#${paso.id}`"
              class="text-[var(--color-bronze)] hover:underline"
            >{{ paso.numero }}. {{ paso.titulo }}</a>
          </li>
        </ol>
      </nav>

      <section
        v-for="paso in pasos"
        :id="paso.id"
        :key="paso.id"
        class="mt-14 scroll-mt-6"
      >
        <div class="mb-3 flex items-center gap-3">
          <span class="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[var(--color-bronze)] font-[family-name:var(--font-heading)] text-sm font-semibold text-[var(--color-ivory)]">
            {{ paso.numero }}
          </span>
          <h2 class="font-[family-name:var(--font-heading)] text-lg font-semibold">
            {{ paso.titulo }}
          </h2>
        </div>
        <p class="mb-3 text-sm leading-relaxed">
          {{ paso.descripcion }}
        </p>
        <ul
          v-if="paso.bullets"
          class="mb-4 list-disc space-y-1.5 pl-5 text-sm text-[var(--color-ink)]/80"
        >
          <li
            v-for="b in paso.bullets"
            :key="b"
          >
            {{ b }}
          </li>
        </ul>
        <div class="overflow-hidden rounded-xl border border-[var(--color-line)] shadow-sm">
          <img
            :src="paso.imagen"
            :alt="`Pantalla ${paso.titulo}`"
            class="block w-full"
            loading="lazy"
          >
        </div>
        <div
          v-if="paso.tip"
          class="mt-3 rounded-xl border border-[var(--color-sage)]/30 bg-[var(--color-sage)]/10 p-3 text-xs text-[var(--color-sage)]"
        >
          <strong>Tip:</strong> {{ paso.tip }}
        </div>
      </section>

      <footer class="mt-16 border-t border-[var(--color-line)] pt-6 text-center text-xs text-[var(--color-muted)]">
        <p>© {{ new Date().getFullYear() }} CoachNexus · Gestiona tu práctica. Multiplica tu impacto.</p>
        <p class="mt-1">Si tienes dudas sobre cómo usar la plataforma, consúltalas directamente con tu coach.</p>
      </footer>
    </main>
  </div>
</template>
