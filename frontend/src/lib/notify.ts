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

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}

export function showCredential(email: string, temporaryPassword: string): Promise<unknown> {
  return base.fire({
    icon: 'success',
    title: 'Contraseña temporal generada',
    html: `
      <p class="text-sm">Compártela manualmente con <strong>${escapeHtml(email)}</strong> — no se volverá a mostrar.</p>
      <p class="mt-3 rounded-lg bg-[var(--color-parchment)] px-3 py-2 font-[family-name:var(--font-mono)] text-sm">${escapeHtml(temporaryPassword)}</p>
    `,
    confirmButtonText: 'Entendido',
  })
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
    confirmButtonColor: options.danger ? '#b08d57' : '#121212',
    reverseButtons: true,
  })
  return result.isConfirmed
}
