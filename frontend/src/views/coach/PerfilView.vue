<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import AppShell from '../../components/AppShell.vue'
import SectionCard from '../../components/SectionCard.vue'
import SkeletonBlock from '../../components/SkeletonBlock.vue'
import ExperienciaLogo from '../../components/ExperienciaLogo.vue'
import { notifyError, notifySuccess } from '../../lib/notify'
import { iniciales } from '../../lib/avatar'
import { formatoPeriodo } from '../../lib/experienciaCoach'
import { ApiError } from '../../api/client'
import {
  getMiPerfil,
  updateMiPerfil,
  subirFoto,
  subirCv,
  agregarCertificacion,
  eliminarCertificacion,
  agregarExperiencia,
  eliminarExperiencia,
  obtenerUrlFoto,
  descargarCv,
  descargarCertificacion,
  type PerfilCoach,
} from '../../api/perfilCoach'

const loading = ref(true)
const perfil = ref<PerfilCoach | null>(null)
const fotoUrl = ref<string | null>(null)

const form = reactive({
  nombre: '',
  titulo: '',
  bio: '',
  metodologia: '',
  linkedinUrl: '',
  sitioWeb: '',
  instagramUrl: '',
  facebookUrl: '',
  youtubeUrl: '',
  telefono: '',
  emailContacto: '',
})
const guardandoDatos = ref(false)
const subiendoFoto = ref(false)
const subiendoCv = ref(false)

function aplicarPerfil(p: PerfilCoach) {
  perfil.value = p
  form.nombre = p.nombre
  form.titulo = p.titulo ?? ''
  form.bio = p.bio ?? ''
  form.metodologia = p.metodologia ?? ''
  form.linkedinUrl = p.linkedinUrl ?? ''
  form.sitioWeb = p.sitioWeb ?? ''
  form.instagramUrl = p.instagramUrl ?? ''
  form.facebookUrl = p.facebookUrl ?? ''
  form.youtubeUrl = p.youtubeUrl ?? ''
  form.telefono = p.telefono ?? ''
  form.emailContacto = p.emailContacto ?? ''
}

async function cargarFoto() {
  fotoUrl.value = perfil.value?.fotoPath ? await obtenerUrlFoto() : null
}

async function load() {
  loading.value = true
  aplicarPerfil(await getMiPerfil())
  await cargarFoto()
  loading.value = false
}
onMounted(load)

async function guardarDatos() {
  guardandoDatos.value = true
  try {
    aplicarPerfil(
      await updateMiPerfil({
        nombre: form.nombre.trim(),
        titulo: form.titulo.trim() || undefined,
        bio: form.bio.trim() || undefined,
        metodologia: form.metodologia.trim() || undefined,
        linkedinUrl: form.linkedinUrl.trim() || undefined,
        sitioWeb: form.sitioWeb.trim() || undefined,
        instagramUrl: form.instagramUrl.trim() || undefined,
        facebookUrl: form.facebookUrl.trim() || undefined,
        youtubeUrl: form.youtubeUrl.trim() || undefined,
        telefono: form.telefono.trim() || undefined,
        emailContacto: form.emailContacto.trim() || undefined,
      }),
    )
    await notifySuccess('Perfil actualizado')
  } catch (err) {
    await notifyError('No se pudo guardar', err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.')
  } finally {
    guardandoDatos.value = false
  }
}

async function onFotoChange(e: Event) {
  const input = e.target as HTMLInputElement
  const archivo = input.files?.[0]
  if (!archivo) return
  subiendoFoto.value = true
  try {
    aplicarPerfil(await subirFoto(archivo))
    await cargarFoto()
    await notifySuccess('Foto actualizada')
    // No se limpia el input tras un éxito: el navegador sigue mostrando el nombre del
    // archivo elegido, que es justo la confirmación visual de que sí se subió.
  } catch (err) {
    await notifyError('No se pudo subir la foto', err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.')
    input.value = ''
  } finally {
    subiendoFoto.value = false
  }
}

async function onCvChange(e: Event) {
  const input = e.target as HTMLInputElement
  const archivo = input.files?.[0]
  if (!archivo) return
  subiendoCv.value = true
  try {
    aplicarPerfil(await subirCv(archivo))
    await notifySuccess('CV actualizado')
  } catch (err) {
    await notifyError('No se pudo subir el CV', err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.')
    input.value = ''
  } finally {
    subiendoCv.value = false
  }
}

async function verCv() {
  if (!perfil.value?.cvPath) return
  await descargarCv(perfil.value.cvNombre ?? 'CV.pdf')
}

// --- Certificaciones ---
const nuevaCert = reactive({ nombre: '', entidadEmisora: '', fecha: '', archivo: null as File | null })
const agregandoCert = ref(false)

function onCertArchivoChange(e: Event) {
  nuevaCert.archivo = (e.target as HTMLInputElement).files?.[0] ?? null
}

async function agregarCert() {
  if (!nuevaCert.nombre.trim()) return
  agregandoCert.value = true
  try {
    const cert = await agregarCertificacion({
      nombre: nuevaCert.nombre.trim(),
      entidadEmisora: nuevaCert.entidadEmisora.trim() || undefined,
      fecha: nuevaCert.fecha || undefined,
      archivo: nuevaCert.archivo ?? undefined,
    })
    if (perfil.value) {
      perfil.value = { ...perfil.value, certificaciones: [...(perfil.value.certificaciones ?? []), cert] }
    }
    nuevaCert.nombre = ''
    nuevaCert.entidadEmisora = ''
    nuevaCert.fecha = ''
    nuevaCert.archivo = null
    const archivoInput = document.getElementById('cert-archivo-input') as HTMLInputElement | null
    if (archivoInput) archivoInput.value = ''
  } catch (err) {
    await notifyError('No se pudo agregar la certificación', err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.')
  } finally {
    agregandoCert.value = false
  }
}

async function eliminarCert(id: string) {
  try {
    await eliminarCertificacion(id)
    if (perfil.value) {
      perfil.value = { ...perfil.value, certificaciones: (perfil.value.certificaciones ?? []).filter((c) => c.id !== id) }
    }
  } catch (err) {
    await notifyError('No se pudo eliminar', err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.')
  }
}

async function verCertificacion(id: string, nombre: string, archivoNombre: string | null) {
  await descargarCertificacion(id, archivoNombre ?? `${nombre}.pdf`)
}

// --- Experiencia ---
const nuevaExp = reactive({
  empresa: '',
  cargo: '',
  fechaInicio: '',
  fechaFin: '',
  descripcion: '',
  logo: null as File | null,
})
const agregandoExp = ref(false)

function onExpLogoChange(e: Event) {
  nuevaExp.logo = (e.target as HTMLInputElement).files?.[0] ?? null
}

async function agregarExp() {
  if (!nuevaExp.empresa.trim() || !nuevaExp.fechaInicio) return
  agregandoExp.value = true
  try {
    const exp = await agregarExperiencia({
      empresa: nuevaExp.empresa.trim(),
      cargo: nuevaExp.cargo.trim() || undefined,
      fechaInicio: nuevaExp.fechaInicio,
      fechaFin: nuevaExp.fechaFin || undefined,
      descripcion: nuevaExp.descripcion.trim() || undefined,
      logo: nuevaExp.logo ?? undefined,
    })
    if (perfil.value) {
      // Más reciente primero, igual criterio que ya aplica el backend.
      perfil.value = {
        ...perfil.value,
        experiencias: [exp, ...(perfil.value.experiencias ?? [])].sort((a, b) =>
          b.fechaInicio.localeCompare(a.fechaInicio),
        ),
      }
    }
    nuevaExp.empresa = ''
    nuevaExp.cargo = ''
    nuevaExp.fechaInicio = ''
    nuevaExp.fechaFin = ''
    nuevaExp.descripcion = ''
    nuevaExp.logo = null
    const logoInput = document.getElementById('exp-logo-input') as HTMLInputElement | null
    if (logoInput) logoInput.value = ''
  } catch (err) {
    await notifyError('No se pudo agregar la experiencia', err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.')
  } finally {
    agregandoExp.value = false
  }
}

async function eliminarExp(id: string) {
  try {
    await eliminarExperiencia(id)
    if (perfil.value) {
      perfil.value = { ...perfil.value, experiencias: (perfil.value.experiencias ?? []).filter((e) => e.id !== id) }
    }
  } catch (err) {
    await notifyError('No se pudo eliminar', err instanceof ApiError ? err.message : 'Ocurrió un error inesperado.')
  }
}
</script>

<template>
  <AppShell>
    <h1 class="mb-1 font-[family-name:var(--font-heading)] text-xl font-semibold">
      Mi perfil
    </h1>
    <p class="mb-4 text-sm text-[var(--color-ink)]/60">
      Esto es lo que verán tus coachees y las empresas cliente en "Mi Coach".
    </p>

    <SkeletonBlock v-if="loading" />
    <div
      v-else
      class="space-y-4"
    >
      <SectionCard
        title="Foto de perfil"
        icon="contacto"
      >
        <div class="flex items-center gap-4">
          <img
            v-if="fotoUrl"
            :src="fotoUrl"
            alt=""
            class="h-16 w-16 shrink-0 rounded-full object-cover"
          >
          <div
            v-else
            class="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[var(--color-ink)] text-lg font-semibold text-[var(--color-parchment)]"
          >
            {{ iniciales(form.nombre || 'Coach') }}
          </div>
          <label class="text-xs">
            {{ fotoUrl ? 'Reemplazar foto' : 'Subir foto' }}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              :disabled="subiendoFoto"
              class="mt-0.5 block w-full text-xs file:mr-2 file:rounded-full file:border-0 file:bg-[var(--color-ink)] file:px-3 file:py-1 file:text-xs file:text-[var(--color-parchment)]"
              @change="onFotoChange"
            >
          </label>
        </div>
      </SectionCard>

      <SectionCard
        title="Datos"
        icon="contacto"
      >
        <form
          class="space-y-3"
          @submit.prevent="guardarDatos"
        >
          <div class="grid gap-3 sm:grid-cols-2">
            <label class="block text-xs">
              Nombre
              <input
                v-model="form.nombre"
                type="text"
                required
                class="mt-0.5 w-full rounded-lg border border-[var(--color-line)] px-2 py-1.5 text-sm"
              >
            </label>
            <label class="block text-xs">
              Título (ej. "Coach Ejecutivo")
              <input
                v-model="form.titulo"
                type="text"
                class="mt-0.5 w-full rounded-lg border border-[var(--color-line)] px-2 py-1.5 text-sm"
              >
            </label>
          </div>
          <label class="block text-xs">
            Presentación / bio
            <textarea
              v-model="form.bio"
              rows="3"
              class="mt-0.5 w-full rounded-lg border border-[var(--color-line)] px-2 py-1.5 text-sm"
            />
          </label>
          <label class="block text-xs">
            Metodología
            <textarea
              v-model="form.metodologia"
              rows="3"
              class="mt-0.5 w-full rounded-lg border border-[var(--color-line)] px-2 py-1.5 text-sm"
            />
          </label>
          <div class="grid gap-3 sm:grid-cols-2">
            <label class="block text-xs">
              LinkedIn
              <input
                v-model="form.linkedinUrl"
                type="url"
                placeholder="https://www.linkedin.com/in/…"
                class="mt-0.5 w-full rounded-lg border border-[var(--color-line)] px-2 py-1.5 text-sm"
              >
            </label>
            <label class="block text-xs">
              Sitio web
              <input
                v-model="form.sitioWeb"
                type="url"
                placeholder="https://…"
                class="mt-0.5 w-full rounded-lg border border-[var(--color-line)] px-2 py-1.5 text-sm"
              >
            </label>
            <label class="block text-xs">
              Instagram
              <input
                v-model="form.instagramUrl"
                type="url"
                placeholder="https://www.instagram.com/…"
                class="mt-0.5 w-full rounded-lg border border-[var(--color-line)] px-2 py-1.5 text-sm"
              >
            </label>
            <label class="block text-xs">
              Facebook
              <input
                v-model="form.facebookUrl"
                type="url"
                placeholder="https://www.facebook.com/…"
                class="mt-0.5 w-full rounded-lg border border-[var(--color-line)] px-2 py-1.5 text-sm"
              >
            </label>
            <label class="block text-xs">
              YouTube
              <input
                v-model="form.youtubeUrl"
                type="url"
                placeholder="https://www.youtube.com/…"
                class="mt-0.5 w-full rounded-lg border border-[var(--color-line)] px-2 py-1.5 text-sm"
              >
            </label>
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <label class="block text-xs">
              Email de contacto
              <input
                v-model="form.emailContacto"
                type="email"
                class="mt-0.5 w-full rounded-lg border border-[var(--color-line)] px-2 py-1.5 text-sm"
              >
            </label>
            <label class="block text-xs">
              Teléfono
              <input
                v-model="form.telefono"
                type="tel"
                class="mt-0.5 w-full rounded-lg border border-[var(--color-line)] px-2 py-1.5 text-sm"
              >
            </label>
          </div>
          <button
            type="submit"
            class="rounded-lg bg-[var(--color-ink)] px-3 py-1.5 text-xs text-[var(--color-parchment)] disabled:opacity-50"
            :disabled="guardandoDatos"
          >
            {{ guardandoDatos ? 'Guardando…' : 'Guardar' }}
          </button>
        </form>
      </SectionCard>

      <SectionCard
        title="CV"
        icon="lista"
      >
        <div class="flex flex-wrap items-center gap-2">
          <button
            v-if="perfil?.cvPath"
            type="button"
            class="rounded-full border border-[var(--color-line)] px-2.5 py-1 text-xs text-[var(--color-saltup)] hover:bg-[var(--color-parchment)]/60"
            @click="verCv"
          >
            ⬇ Ver CV actual
          </button>
          <label class="text-xs">
            {{ perfil?.cvPath ? 'Reemplazar CV' : 'Subir CV (PDF)' }}
            <input
              type="file"
              accept="application/pdf"
              :disabled="subiendoCv"
              class="mt-0.5 block text-xs file:mr-2 file:rounded-full file:border-0 file:bg-[var(--color-ink)] file:px-3 file:py-1 file:text-xs file:text-[var(--color-parchment)]"
              @change="onCvChange"
            >
          </label>
        </div>
      </SectionCard>

      <SectionCard
        title="Experiencia"
        icon="negocio"
      >
        <ul
          v-if="perfil?.experiencias && perfil.experiencias.length > 0"
          class="mb-3 space-y-2"
        >
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
            <div class="min-w-0 flex-1">
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
            <button
              type="button"
              class="shrink-0 text-xs text-[var(--color-danger)]/70 hover:underline"
              @click="eliminarExp(exp.id)"
            >
              Eliminar
            </button>
          </li>
        </ul>
        <p
          v-else
          class="mb-3 text-sm text-[var(--color-ink)]/50"
        >
          Sin experiencia registrada todavía.
        </p>

        <form
          class="space-y-2 border-t border-[var(--color-line)] pt-3"
          @submit.prevent="agregarExp"
        >
          <div class="grid gap-2 sm:grid-cols-2">
            <label class="block text-xs">
              Empresa
              <input
                v-model="nuevaExp.empresa"
                type="text"
                required
                class="mt-0.5 w-full rounded-lg border border-[var(--color-line)] px-2 py-1.5 text-sm"
              >
            </label>
            <label class="block text-xs">
              Cargo
              <input
                v-model="nuevaExp.cargo"
                type="text"
                class="mt-0.5 w-full rounded-lg border border-[var(--color-line)] px-2 py-1.5 text-sm"
              >
            </label>
          </div>
          <div class="grid gap-2 sm:grid-cols-2">
            <label class="block text-xs">
              Fecha inicio
              <input
                v-model="nuevaExp.fechaInicio"
                type="date"
                required
                class="mt-0.5 w-full rounded-lg border border-[var(--color-line)] px-2 py-1.5 text-sm"
              >
            </label>
            <label class="block text-xs">
              Fecha fin (vacío = actualidad)
              <input
                v-model="nuevaExp.fechaFin"
                type="date"
                class="mt-0.5 w-full rounded-lg border border-[var(--color-line)] px-2 py-1.5 text-sm"
              >
            </label>
          </div>
          <label class="block text-xs">
            Descripción
            <textarea
              v-model="nuevaExp.descripcion"
              rows="2"
              class="mt-0.5 w-full rounded-lg border border-[var(--color-line)] px-2 py-1.5 text-sm"
            />
          </label>
          <label class="block text-xs">
            Logo de la empresa (opcional)
            <input
              id="exp-logo-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              class="mt-0.5 block w-full text-xs file:mr-2 file:rounded-full file:border-0 file:bg-[var(--color-ink)] file:px-3 file:py-1 file:text-xs file:text-[var(--color-parchment)]"
              @change="onExpLogoChange"
            >
          </label>
          <button
            type="submit"
            class="rounded-lg bg-[var(--color-ink)] px-3 py-1.5 text-xs text-[var(--color-parchment)] disabled:opacity-50"
            :disabled="agregandoExp"
          >
            {{ agregandoExp ? 'Agregando…' : '+ Agregar experiencia' }}
          </button>
        </form>
      </SectionCard>

      <SectionCard
        title="Certificaciones"
        icon="certificado"
      >
        <ul
          v-if="perfil?.certificaciones && perfil.certificaciones.length > 0"
          class="mb-3 space-y-2"
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
            <div class="flex shrink-0 items-center gap-3">
              <button
                v-if="cert.archivoPath"
                type="button"
                class="text-xs text-[var(--color-saltup)] hover:underline"
                @click="verCertificacion(cert.id, cert.nombre, cert.archivoNombre)"
              >
                Ver
              </button>
              <button
                type="button"
                class="text-xs text-[var(--color-danger)]/70 hover:underline"
                @click="eliminarCert(cert.id)"
              >
                Eliminar
              </button>
            </div>
          </li>
        </ul>
        <p
          v-else
          class="mb-3 text-sm text-[var(--color-ink)]/50"
        >
          Sin certificaciones registradas todavía.
        </p>

        <form
          class="space-y-2 border-t border-[var(--color-line)] pt-3"
          @submit.prevent="agregarCert"
        >
          <div class="grid gap-2 sm:grid-cols-2">
            <label class="block text-xs">
              Nombre de la certificación
              <input
                v-model="nuevaCert.nombre"
                type="text"
                required
                class="mt-0.5 w-full rounded-lg border border-[var(--color-line)] px-2 py-1.5 text-sm"
              >
            </label>
            <label class="block text-xs">
              Entidad emisora
              <input
                v-model="nuevaCert.entidadEmisora"
                type="text"
                class="mt-0.5 w-full rounded-lg border border-[var(--color-line)] px-2 py-1.5 text-sm"
              >
            </label>
          </div>
          <div class="grid gap-2 sm:grid-cols-2">
            <label class="block text-xs">
              Fecha
              <input
                v-model="nuevaCert.fecha"
                type="date"
                class="mt-0.5 w-full rounded-lg border border-[var(--color-line)] px-2 py-1.5 text-sm"
              >
            </label>
            <label class="block text-xs">
              Diploma / respaldo (PDF o imagen)
              <input
                id="cert-archivo-input"
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp"
                class="mt-0.5 block w-full text-xs file:mr-2 file:rounded-full file:border-0 file:bg-[var(--color-ink)] file:px-3 file:py-1 file:text-xs file:text-[var(--color-parchment)]"
                @change="onCertArchivoChange"
              >
            </label>
          </div>
          <button
            type="submit"
            class="rounded-lg bg-[var(--color-ink)] px-3 py-1.5 text-xs text-[var(--color-parchment)] disabled:opacity-50"
            :disabled="agregandoCert"
          >
            {{ agregandoCert ? 'Agregando…' : '+ Agregar certificación' }}
          </button>
        </form>
      </SectionCard>
    </div>
  </AppShell>
</template>
