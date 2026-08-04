import Swal from 'sweetalert2'

const base = Swal.mixin({
  confirmButtonColor: '#121212',
  cancelButtonColor: '#b08d57',
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
    confirmButtonColor: options.danger ? '#dc2626' : '#121212',
    reverseButtons: true,
  })
  return result.isConfirmed
}
