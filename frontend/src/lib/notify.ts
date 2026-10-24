import Swal from 'sweetalert2'

const base = Swal.mixin({
  confirmButtonColor: '#1d6a49',
  cancelButtonColor: '#8c5514',
  buttonsStyling: true,
  customClass: {
    popup: 'font-[family-name:var(--font-body)] rounded-2xl',
    confirmButton: 'rounded-lg',
    cancelButton: 'rounded-lg',
  },
})

export function notifySuccess(title: string, text?: string): Promise<unknown> {
  return base.fire({ icon: 'success', title, text, timer: 2200, showConfirmButton: false })
}

export function notifyError(title: string, text?: string): Promise<unknown> {
  return base.fire({ icon: 'error', title, text })
}

export async function promptDialog(options: {
  title: string
  inputLabel?: string
  inputValue?: string
  confirmText?: string
}): Promise<string | null> {
  const result = await base.fire({
    title: options.title,
    input: 'text',
    inputLabel: options.inputLabel,
    inputValue: options.inputValue ?? '',
    showCancelButton: true,
    confirmButtonText: options.confirmText ?? 'Guardar',
    cancelButtonText: 'Cancelar',
    inputValidator: (value) => (value?.trim() ? undefined : 'Este campo es obligatorio'),
  })
  if (!result.isConfirmed) return null
  return String(result.value).trim()
}

export async function confirmDialog(options: {
  title: string
  text?: string
  confirmText?: string
  danger?: boolean
}): Promise<boolean> {
  const result = await base.fire({
    icon: 'warning',
    title: options.title,
    text: options.text,
    showCancelButton: true,
    confirmButtonText: options.confirmText ?? 'Confirmar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: options.danger ? '#b91c1c' : '#1d6a49',
    reverseButtons: true,
  })
  return result.isConfirmed
}

// Variante de tres opciones para acciones sobre una sesión que viene de "repetir
// semanalmente" (mover o eliminar): además de cancelar, hay que elegir si el cambio
// aplica solo a esa sesión o a ella y todas las futuras de la serie.
export async function confirmSerieDialog(options: {
  title: string
  text?: string
  soloEstaText: string
  todaSerieText: string
  danger?: boolean
}): Promise<'solo-esta' | 'toda-serie' | null> {
  const result = await base.fire({
    icon: 'warning',
    title: options.title,
    text: options.text,
    showDenyButton: true,
    showCancelButton: true,
    confirmButtonText: options.todaSerieText,
    denyButtonText: options.soloEstaText,
    cancelButtonText: 'Cancelar',
    confirmButtonColor: options.danger ? '#b91c1c' : '#1d6a49',
    denyButtonColor: options.danger ? '#b91c1c' : '#8c5514',
    reverseButtons: true,
  })
  if (result.isConfirmed) return 'toda-serie'
  if (result.isDenied) return 'solo-esta'
  return null
}
