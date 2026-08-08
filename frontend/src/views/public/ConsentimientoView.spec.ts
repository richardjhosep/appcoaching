import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ConsentimientoView from './ConsentimientoView.vue'
import { ApiError } from '../../api/client'

vi.mock('../../api/consentimientoPublico', async () => {
  const actual = await vi.importActual<typeof import('../../api/consentimientoPublico')>(
    '../../api/consentimientoPublico',
  )
  return { ...actual, getSolicitud: vi.fn(), aceptarSolicitud: vi.fn(), rechazarSolicitud: vi.fn() }
})

import { getSolicitud, aceptarSolicitud, rechazarSolicitud } from '../../api/consentimientoPublico'

describe('ConsentimientoView', () => {
  beforeEach(() => {
    vi.mocked(aceptarSolicitud).mockResolvedValue({ success: true })
    vi.mocked(rechazarSolicitud).mockResolvedValue({ success: true })
  })

  it('shows an invalid-link message when the token does not resolve', async () => {
    vi.mocked(getSolicitud).mockRejectedValue(new ApiError(404, 'Not found'))

    const wrapper = mount(ConsentimientoView, { props: { token: 'gone' } })
    await flushPromises()

    expect(wrapper.text()).toContain('Este enlace no es válido')
  })

  it('shows an expired message when the solicitud is marked expirada', async () => {
    vi.mocked(getSolicitud).mockResolvedValue({ nombre: 'Rodrigo Peña', estado: 'pendiente', expirada: true })

    const wrapper = mount(ConsentimientoView, { props: { token: 'tok' } })
    await flushPromises()

    expect(wrapper.text()).toContain('ya venció')
  })

  it('shows the already-responded message with the recorded answer', async () => {
    vi.mocked(getSolicitud).mockResolvedValue({ nombre: 'Rodrigo Peña', estado: 'aceptado', expirada: false })

    const wrapper = mount(ConsentimientoView, { props: { token: 'tok' } })
    await flushPromises()

    expect(wrapper.text()).toContain('ya registramos tu respuesta')
    expect(wrapper.text()).toContain('aceptaste')
  })

  it('shows the form with the coachee name and lets them accept', async () => {
    vi.mocked(getSolicitud).mockResolvedValue({ nombre: 'Rodrigo Peña', estado: 'pendiente', expirada: false })

    const wrapper = mount(ConsentimientoView, { props: { token: 'tok-abc' } })
    await flushPromises()

    expect(wrapper.text()).toContain('Rodrigo Peña')
    expect(wrapper.text()).toContain('consentimiento informado')

    const aceptarBtn = wrapper.findAll('button').find((b) => b.text() === 'Acepto')
    await aceptarBtn!.trigger('click')
    await flushPromises()

    expect(aceptarSolicitud).toHaveBeenCalledWith('tok-abc')
    expect(wrapper.text()).toContain('registramos que aceptaste')
  })

  it('lets the coachee decline', async () => {
    vi.mocked(getSolicitud).mockResolvedValue({ nombre: 'Rodrigo Peña', estado: 'pendiente', expirada: false })

    const wrapper = mount(ConsentimientoView, { props: { token: 'tok-abc' } })
    await flushPromises()

    const rechazarBtn = wrapper.findAll('button').find((b) => b.text() === 'No acepto')
    await rechazarBtn!.trigger('click')
    await flushPromises()

    expect(rechazarSolicitud).toHaveBeenCalledWith('tok-abc')
    expect(wrapper.text()).toContain('no aceptaste')
  })
})
