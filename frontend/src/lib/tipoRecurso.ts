import type { Recurso } from '../api/recursos'

export type TipoIcono = 'pdf' | 'word' | 'excel' | 'video' | 'link' | 'archivo'

function extension(nombre: string): string {
  const punto = nombre.lastIndexOf('.')
  return punto === -1 ? '' : nombre.slice(punto + 1).toLowerCase()
}

function esYoutube(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    return host === 'youtube.com' || host === 'youtu.be' || host === 'm.youtube.com'
  } catch {
    return false
  }
}

export function tipoIconoDe(recurso: Recurso): TipoIcono {
  if (recurso.tipo === 'link') {
    return recurso.url && esYoutube(recurso.url) ? 'video' : 'link'
  }

  const ext = extension(recurso.archivoNombre ?? '')
  if (ext === 'pdf') return 'pdf'
  if (['doc', 'docx'].includes(ext)) return 'word'
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'excel'
  if (['mp4', 'mov', 'avi', 'webm'].includes(ext)) return 'video'
  return 'archivo'
}
