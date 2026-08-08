import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ConsentimientoInformado from './ConsentimientoInformado.vue'
import type { CoacheeListItem } from '../api/coachees'

vi.mock('../api/coachees', async () => {
  const actual = await vi.importActual<typeof import('../api/coachees')>('../api/coachees')
  return { ...actual, setConsentimiento: vi.fn(), solicitarConsentimiento: vi.fn() }
})
vi.mock('../lib/notify', () => ({
  notifySuccess: vi.fn(),
  notifyError: vi.fn(),
}))

import { setConsentimiento, solicitarConsentimiento } from '../api/coachees'
import { notifySuccess, notifyError } from '../lib/notify'

const actualizado: CoacheeListItem = {
  id: 'c1',
  nombre: 'Rodrigo Peña',
  empresaId: null,
  consentimientoInformado: true,
  consentimientoFecha: '2026-08-01T12:00:00.000Z',
}

describe('ConsentimientoInformado', () => {
  beforeEach(() => {
    vi.mocked(setConsentimiento).mockResolvedValue(actualizado)
    vi.mocked(solicitarConsentimiento).mockResolvedValue({ success: true })
  })

  it('shows "Pendiente" when not informado, with no date', () => {
    const wrapper = mount(ConsentimientoInformado, {
      props: { coacheeId: 'c1', nombre: 'Rodrigo Peña', informado: false },
    })

    expect(wrapper.text()).toContain('Pendiente')
    expect(wrapper.text()).toContain('Sin firmar todavía.')
  })

  it('shows "Firmado" with the date when informado', () => {
    const wrapper = mount(ConsentimientoInformado, {
      props: { coacheeId: 'c1', nombre: 'Rodrigo Peña', informado: true, fecha: '2026-08-01T12:00:00.000Z' },
    })

    const text = wrapper.text()
    expect(text).toContain('Firmado')
    expect(text).toContain('01-08-2026')
  })

  it('toggles the state and emits the updated coachee', async () => {
    const wrapper = mount(ConsentimientoInformado, {
      props: { coacheeId: 'c1', nombre: 'Rodrigo Peña', informado: false },
    })

    const toggleBtn = wrapper.findAll('button').find((b) => b.text() === 'Marcar como firmado')
    await toggleBtn!.trigger('click')
    await flushPromises()

    expect(setConsentimiento).toHaveBeenCalledWith('c1', true)
    expect(wrapper.emitted('actualizado')).toEqual([
      [{ consentimientoInformado: true, consentimientoFecha: '2026-08-01T12:00:00.000Z' }],
    ])
  })

  it('sends the email request and shows a success toast', async () => {
    const wrapper = mount(ConsentimientoInformado, {
      props: { coacheeId: 'c1', nombre: 'Rodrigo Peña', informado: false },
    })

    const enviarBtn = wrapper.findAll('button').find((b) => b.text().includes('Enviar solicitud por correo'))
    await enviarBtn!.trigger('click')
    await flushPromises()

    expect(solicitarConsentimiento).toHaveBeenCalledWith('c1')
    expect(notifySuccess).toHaveBeenCalled()
  })

  it('shows an error message when toggling fails', async () => {
    vi.mocked(setConsentimiento).mockRejectedValue(new Error('boom'))
    const wrapper = mount(ConsentimientoInformado, {
      props: { coacheeId: 'c1', nombre: 'Rodrigo Peña', informado: false },
    })

    const toggleBtn = wrapper.findAll('button').find((b) => b.text() === 'Marcar como firmado')
    await toggleBtn!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('No se pudo actualizar el consentimiento.')
  })

  it('shows an error toast when sending the email request fails', async () => {
    vi.mocked(solicitarConsentimiento).mockRejectedValue(new Error('boom'))
    const wrapper = mount(ConsentimientoInformado, {
      props: { coacheeId: 'c1', nombre: 'Rodrigo Peña', informado: false },
    })

    const enviarBtn = wrapper.findAll('button').find((b) => b.text().includes('Enviar solicitud por correo'))
    await enviarBtn!.trigger('click')
    await flushPromises()

    expect(notifyError).toHaveBeenCalled()
  })
})
