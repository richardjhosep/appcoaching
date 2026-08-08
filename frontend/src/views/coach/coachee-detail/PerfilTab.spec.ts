import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import PerfilTab from './PerfilTab.vue'
import type { Coachee } from '../../../api/coachees'

vi.mock('../../../api/coachees', async () => {
  const actual = await vi.importActual<typeof import('../../../api/coachees')>('../../../api/coachees')
  return { ...actual, getCoachee: vi.fn(), setConsentimiento: vi.fn(), solicitarConsentimiento: vi.fn() }
})
vi.mock('../../../lib/notify', () => ({
  notifySuccess: vi.fn(),
  notifyError: vi.fn(),
}))

import { getCoachee, setConsentimiento } from '../../../api/coachees'

const coachee: Coachee = {
  id: 'c1',
  nombre: 'Rodrigo Peña',
  empresaId: null,
  telefono: '+56911112222',
  emailContacto: 'rodrigo@personal.com',
  jefeDirecto: null,
  objetivoProceso: 'Liderazgo',
  tarifaPropia: 50000,
  areaGerencia: null,
  consentimientoInformado: false,
  consentimientoFecha: null,
}

describe('PerfilTab', () => {
  beforeEach(() => {
    vi.mocked(getCoachee).mockResolvedValue(coachee)
    vi.mocked(setConsentimiento).mockResolvedValue({
      id: 'c1',
      nombre: 'Rodrigo Peña',
      empresaId: null,
      consentimientoInformado: true,
      consentimientoFecha: '2026-08-01T12:00:00.000Z',
    })
  })

  it('shows the process data and consentimiento via the shared component, not a raw checkbox', async () => {
    const wrapper = mount(PerfilTab, { props: { coacheeId: 'c1' } })
    await flushPromises()

    const text = wrapper.text()
    expect(text).toContain('Liderazgo')
    expect(text).toContain('Consentimiento informado')
    expect(text).toContain('Pendiente')
    expect(wrapper.find('input[type="checkbox"]').exists()).toBe(false)
  })

  it('updates local state when the consentimiento component emits actualizado', async () => {
    const wrapper = mount(PerfilTab, { props: { coacheeId: 'c1' } })
    await flushPromises()

    const toggleBtn = wrapper.findAll('button').find((b) => b.text() === 'Marcar como firmado')
    await toggleBtn!.trigger('click')
    await flushPromises()

    expect(setConsentimiento).toHaveBeenCalledWith('c1', true)
    expect(wrapper.text()).toContain('Firmado')
  })

  it('reloads when the coacheeId prop changes', async () => {
    const wrapper = mount(PerfilTab, { props: { coacheeId: 'c1' } })
    await flushPromises()

    vi.mocked(getCoachee).mockResolvedValue({ ...coachee, id: 'c2', nombre: 'Ana Reagenda' })
    await wrapper.setProps({ coacheeId: 'c2' })
    await flushPromises()

    expect(getCoachee).toHaveBeenCalledWith('c2')
    expect(wrapper.text()).toContain('Contacto de Ana')
  })
})
