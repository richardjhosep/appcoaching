import { apiDownload } from '../api/client'

// Tipos que el navegador sabe mostrar en una pestaña; el resto (Word, Excel…) no tiene visor
// propio, así que se descarga en vez de dejar una pestaña en blanco.
const PREVISUALIZABLE = /^(application\/pdf|image\/|text\/plain|audio\/|video\/)/

function descargar(blob: Blob, nombreArchivo: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombreArchivo
  a.click()
  URL.revokeObjectURL(url)
}

/** Abre un archivo protegido (que exige el token) en una pestaña nueva, sin descargarlo. */
export async function verArchivo(path: string, nombreArchivo: string): Promise<void> {
  // La pestaña se abre antes del `await`: abrirla después de la petición la bloquea el
  // bloqueador de ventanas emergentes porque ya no cuenta como respuesta a un clic.
  const pestana = window.open('', '_blank')
  try {
    const blob = await apiDownload(path)
    if (!pestana || !PREVISUALIZABLE.test(blob.type)) {
      pestana?.close()
      descargar(blob, nombreArchivo)
      return
    }
    const url = URL.createObjectURL(blob)
    pestana.location.href = url
    // Margen para que la pestaña alcance a cargar el blob antes de liberarlo.
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  } catch (err) {
    pestana?.close()
    throw err
  }
}
