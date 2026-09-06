<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import type { PerfilCoach } from '../api/perfilCoach'
import { obtenerUrlFoto, descargarCv, descargarCertificacion } from '../api/perfilCoach'
import { iniciales } from '../lib/avatar'
import { formatoPeriodo } from '../lib/experienciaCoach'
import SectionCard from './SectionCard.vue'
import NavIcon from './NavIcon.vue'
import ExperienciaLogo from './ExperienciaLogo.vue'

const props = defineProps<{ perfil: PerfilCoach }>()

// Bloque de solo lectura, montado igual desde empresa y coachee — la única diferencia entre
// ambas vistas es el título de la página que lo envuelve.
const fotoUrl = ref<string | null>(null)

async function cargarFoto() {
  fotoUrl.value = props.perfil.fotoPath ? await obtenerUrlFoto() : null
}
onMounted(cargarFoto)
watch(() => props.perfil.fotoPath, cargarFoto)

async function verCv() {
  await descargarCv(props.perfil.cvNombre ?? 'CV.pdf')
}

async function verCertificacion(id: string, nombre: string, archivoNombre: string | null) {
  await descargarCertificacion(id, archivoNombre ?? `${nombre}.pdf`)
}
</script>

<template>
  <div class="space-y-4">
    <SectionCard
      title="Sobre mí"
      icon="contacto"
    >
      <div class="mb-3 flex items-center gap-3">
        <img
          v-if="fotoUrl"
          :src="fotoUrl"
          alt=""
          class="h-14 w-14 shrink-0 rounded-full object-cover"
        >
        <div
          v-else
          class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--color-ink)] text-sm font-semibold text-[var(--color-parchment)]"
        >
          {{ iniciales(perfil.nombre || 'Coach') }}
        </div>
        <div class="min-w-0">
          <p class="truncate text-sm font-medium text-[var(--color-ink)]/80">
            {{ perfil.nombre || 'Tu coach' }}
          </p>
          <p
            v-if="perfil.titulo"
            class="truncate text-xs text-[var(--color-ink)]/60"
          >
            {{ perfil.titulo }}
          </p>
        </div>
      </div>
      <p
        v-if="perfil.bio"
        class="text-sm"
      >
        {{ perfil.bio }}
      </p>
      <p
        v-else
        class="text-sm text-[var(--color-ink)]/50"
      >
        Todavía no hay una presentación publicada.
      </p>
    </SectionCard>

    <SectionCard
      v-if="perfil.metodologia"
      title="Metodología"
      icon="lista"
    >
      <p class="text-sm">
        {{ perfil.metodologia }}
      </p>
    </SectionCard>

    <SectionCard
      v-if="perfil.experiencias && perfil.experiencias.length > 0"
      title="Experiencia"
      icon="negocio"
    >
      <ul class="space-y-2">
        <li
          v-for="exp in perfil.experiencias"
          :key="exp.id"
          class="flex items-start gap-3 rounded-lg border border-[var(--color-line)] p-2.5 text-sm"
        >
          <ExperienciaLogo
            :experiencia-id="exp.id"
            :tiene-logo="!!exp.logoPath"
            :empresa="exp.empresa"
          />
          <div class="min-w-0">
            <p class="truncate font-medium">
              {{ exp.cargo ? `${exp.cargo} · ${exp.empresa}` : exp.empresa }}
            </p>
            <p class="text-xs text-[var(--color-ink)]/60">
              {{ formatoPeriodo(exp.fechaInicio, exp.fechaFin) }}
            </p>
            <p
              v-if="exp.descripcion"
              class="mt-1 text-xs text-[var(--color-ink)]/70"
            >
              {{ exp.descripcion }}
            </p>
          </div>
        </li>
      </ul>
    </SectionCard>

    <SectionCard
      title="Certificaciones y CV"
      icon="certificado"
    >
      <button
        v-if="perfil.cvPath"
        type="button"
        class="mb-3 flex items-center gap-2 rounded-full border border-[var(--color-line)] px-3 py-1.5 text-xs text-[var(--color-saltup)] hover:bg-[var(--color-parchment)]/60"
        @click="verCv"
      >
        ⬇ Descargar CV
      </button>

      <ul
        v-if="perfil.certificaciones && perfil.certificaciones.length > 0"
        class="space-y-2"
      >
        <li
          v-for="cert in perfil.certificaciones"
          :key="cert.id"
          class="flex items-start justify-between gap-2 rounded-lg border border-[var(--color-line)] p-2.5 text-sm"
        >
          <div class="min-w-0">
            <p class="truncate font-medium">
              {{ cert.nombre }}
            </p>
            <p
              v-if="cert.entidadEmisora"
              class="truncate text-xs text-[var(--color-ink)]/60"
            >
              {{ cert.entidadEmisora }}
            </p>
          </div>
          <button
            v-if="cert.archivoPath"
            type="button"
            class="shrink-0 text-xs text-[var(--color-saltup)] hover:underline"
            @click="verCertificacion(cert.id, cert.nombre, cert.archivoNombre)"
          >
            Ver
          </button>
        </li>
      </ul>
      <p
        v-else
        class="text-sm text-[var(--color-ink)]/50"
      >
        Sin certificaciones registradas todavía.
      </p>
    </SectionCard>

    <SectionCard
      v-if="perfil.linkedinUrl || perfil.sitioWeb || perfil.instagramUrl || perfil.facebookUrl || perfil.youtubeUrl || perfil.emailContacto || perfil.telefono"
      title="Contacto directo"
      icon="correo"
    >
      <div class="flex flex-wrap gap-2">
        <a
          v-if="perfil.linkedinUrl"
          :href="perfil.linkedinUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-1.5 rounded-full border border-[var(--color-line)] px-3 py-1.5 text-xs text-[var(--color-bronze)] hover:bg-[var(--color-parchment)]/60"
        >
          <NavIcon
            name="linkedin"
            :size="14"
          />
          LinkedIn
          <NavIcon
            name="enlace-externo"
            :size="11"
          />
        </a>
        <a
          v-if="perfil.sitioWeb"
          :href="perfil.sitioWeb"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-1.5 rounded-full border border-[var(--color-line)] px-3 py-1.5 text-xs text-[var(--color-bronze)] hover:bg-[var(--color-parchment)]/60"
        >
          <NavIcon
            name="sitio-web"
            :size="14"
          />
          Sitio web
          <NavIcon
            name="enlace-externo"
            :size="11"
          />
        </a>
        <a
          v-if="perfil.instagramUrl"
          :href="perfil.instagramUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-1.5 rounded-full border border-[var(--color-line)] px-3 py-1.5 text-xs text-[var(--color-bronze)] hover:bg-[var(--color-parchment)]/60"
        >
          <NavIcon
            name="instagram"
            :size="14"
          />
          Instagram
          <NavIcon
            name="enlace-externo"
            :size="11"
          />
        </a>
        <a
          v-if="perfil.facebookUrl"
          :href="perfil.facebookUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-1.5 rounded-full border border-[var(--color-line)] px-3 py-1.5 text-xs text-[var(--color-bronze)] hover:bg-[var(--color-parchment)]/60"
        >
          <NavIcon
            name="facebook"
            :size="14"
          />
          Facebook
          <NavIcon
            name="enlace-externo"
            :size="11"
          />
        </a>
        <a
          v-if="perfil.youtubeUrl"
          :href="perfil.youtubeUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-1.5 rounded-full border border-[var(--color-line)] px-3 py-1.5 text-xs text-[var(--color-bronze)] hover:bg-[var(--color-parchment)]/60"
        >
          <NavIcon
            name="youtube"
            :size="14"
          />
          YouTube
          <NavIcon
            name="enlace-externo"
            :size="11"
          />
        </a>
        <a
          v-if="perfil.emailContacto"
          :href="`mailto:${perfil.emailContacto}`"
          class="flex items-center gap-1.5 rounded-full border border-[var(--color-line)] px-3 py-1.5 text-xs text-[var(--color-bronze)] hover:bg-[var(--color-parchment)]/60"
        >
          <NavIcon
            name="correo"
            :size="14"
          />
          {{ perfil.emailContacto }}
        </a>
        <a
          v-if="perfil.telefono"
          :href="`tel:${perfil.telefono}`"
          class="flex items-center gap-1.5 rounded-full border border-[var(--color-line)] px-3 py-1.5 text-xs text-[var(--color-bronze)] hover:bg-[var(--color-parchment)]/60"
        >
          <NavIcon
            name="telefono"
            :size="14"
          />
          {{ perfil.telefono }}
        </a>
      </div>
    </SectionCard>
  </div>
</template>
