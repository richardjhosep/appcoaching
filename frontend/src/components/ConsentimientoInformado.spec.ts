import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ConsentimientoInformado from './ConsentimientoInformado.vue'
import type { CoacheeListItem } from '../api/coachees'

vi.mock('../api/coachees', async () => {
  const actual = await vi.importActual<typeof import('../api/coachees')>('../api/coachees')
  return { ...actual, setConsentimiento: vi.fn() }
})

import { setConsentimiento } from '../api/coachees'

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
  })

  it('shows "Pendiente" when not informado, with no date', () => {
    const wrapper = mount(ConsentimientoInformado, {
      props: { coacheeId: 'c1', informado: false },
    })

    expect(wrapper.text()).toContain('Pendiente')
    expect(wrapper.text()).toContain('Sin firmar todavía.')
  })

  it('shows "Firmado" with the date when informado', () => {
    const wrapper = mount(ConsentimientoInformado, {
      props: { coacheeId: 'c1', informado: true, fecha: '2026-08-01T12:00:00.000Z' },
    })

    const text = wrapper.text()
    expect(text).toContain('Firmado')
    expect(text).toContain('01-08-2026')
  })

  it('toggles the state and emits the updated coachee', async () => {
    const wrapper = mount(ConsentimientoInformado, {
      props: { coacheeId: 'c1', informado: false },
    })

    const toggleBtn = wrapper.findAll('button').find((b) => b.text() === 'Marcar como firmado')
    await toggleBtn!.trigger('click')
    await flushPromises()

    expect(setConsentimiento).toHaveBeenCalledWith('c1', true)
    expect(wrapper.emitted('actualizado')).toEqual([
      [{ consentimientoInformado: true, consentimientoFecha: '2026-08-01T12:00:00.000Z' }],
    ])
  })

  it('does not offer to request the consent by email', () => {
    const wrapper = mount(ConsentimientoInformado, { props: { coacheeId: 'c1', informado: false } })

    expect(wrapper.findAll('button')).toHaveLength(1)
    expect(wrapper.text()).not.toContain('correo')
  })

  it('shows an error message when toggling fails', async () => {
    vi.mocked(setConsentimiento).mockRejectedValue(new Error('boom'))
    const wrapper = mount(ConsentimientoInformado, {
      props: { coacheeId: 'c1', informado: false },
    })

    const toggleBtn = wrapper.findAll('button').find((b) => b.text() === 'Marcar como firmado')
    await toggleBtn!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('No se pudo actualizar el consentimiento.')
  })
})
