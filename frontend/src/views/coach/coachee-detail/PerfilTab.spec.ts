import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import PerfilTab from './PerfilTab.vue'
import type { Coachee } from '../../../api/coachees'

vi.mock('../../../api/coachees', async () => {
  const actual = await vi.importActual<typeof import('../../../api/coachees')>('../../../api/coachees')
  return {
    ...actual,
    getCoachee: vi.fn(),
    setConsentimiento: vi.fn(),
    solicitarConsentimiento: vi.fn(),
    obtenerUrlFotoDeCoachee: vi.fn(),
  }
})
vi.mock('../../../lib/notify', () => ({
  notifySuccess: vi.fn(),
  notifyError: vi.fn(),
}))

import { getCoachee, setConsentimiento, obtenerUrlFotoDeCoachee } from '../../../api/coachees'

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
  fotoPath: null,
  fotoNombre: null,
  bio: null,
  compartirPerfilConCoach: false,
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

  it('shows a neutral message when the coachee has not shared their perfil personal', async () => {
    const wrapper = mount(PerfilTab, { props: { coacheeId: 'c1' } })
    await flushPromises()

    expect(wrapper.text()).toContain('Este coachee no ha compartido su perfil personal contigo.')
    expect(obtenerUrlFotoDeCoachee).not.toHaveBeenCalled()
  })

  it('shows the bio and requests the foto when compartirPerfilConCoach is true', async () => {
    vi.mocked(getCoachee).mockResolvedValue({
      ...coachee,
      bio: 'Me gusta correr y leer.',
      compartirPerfilConCoach: true,
    })
    vi.mocked(obtenerUrlFotoDeCoachee).mockResolvedValue(null)

    const wrapper = mount(PerfilTab, { props: { coacheeId: 'c1' } })
    await flushPromises()

    expect(obtenerUrlFotoDeCoachee).toHaveBeenCalledWith('c1')
    expect(wrapper.text()).toContain('Me gusta correr y leer.')
    expect(wrapper.text()).not.toContain('no ha compartido su perfil personal')
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
