import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises, DOMWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SesionesTab from './SesionesTab.vue'
import type { SolicitudReagendamiento } from '../../../api/solicitudes-reagendamiento'

vi.mock('../../../api/sesiones', async () => {
  const actual = await vi.importActual<typeof import('../../../api/sesiones')>('../../../api/sesiones')
  return { ...actual, getSesionesDeCoachee: vi.fn() }
})
vi.mock('../../../api/seguimiento', async () => {
  const actual = await vi.importActual<typeof import('../../../api/seguimiento')>('../../../api/seguimiento')
  return {
    ...actual,
    getAvanceDeCoachee: vi.fn(),
    getLineaProgresoDeCoachee: vi.fn(),
    getLogrosDeCoachee: vi.fn(),
  }
})
vi.mock('../../../api/solicitudes-reagendamiento', async () => {
  const actual = await vi.importActual<typeof import('../../../api/solicitudes-reagendamiento')>('../../../api/solicitudes-reagendamiento')
  return {
    ...actual,
    getSolicitudesReagendamiento: vi.fn(),
    responderSolicitudReagendamiento: vi.fn(),
  }
})

import { getSesionesDeCoachee } from '../../../api/sesiones'
import { getAvanceDeCoachee, getLineaProgresoDeCoachee, getLogrosDeCoachee } from '../../../api/seguimiento'
import { getSolicitudesReagendamiento, responderSolicitudReagendamiento } from '../../../api/solicitudes-reagendamiento'

const solicitudDeEsteCoachee: SolicitudReagendamiento = {
  id: 'reag-1',
  sesionId: 'sesion-1',
  coacheeId: 'coachee-1',
  motivo: 'tengo un viaje',
  estado: 'pendiente',
  respuestaCoach: null,
  createdAt: '2026-07-02T00:00:00.000Z',
  resolvedAt: null,
  sesion: { id: 'sesion-1', fechaHora: '2026-08-05T15:00:00.000Z' },
  coachee: { id: 'coachee-1', nombre: 'Ana' },
}

const solicitudDeOtroCoachee: SolicitudReagendamiento = {
  ...solicitudDeEsteCoachee,
  id: 'reag-2',
  coacheeId: 'coachee-2',
  coachee: { id: 'coachee-2', nombre: 'Beto' },
}

describe('SesionesTab — solicitudes de reagendamiento', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getSesionesDeCoachee).mockResolvedValue([])
    vi.mocked(getAvanceDeCoachee).mockResolvedValue({ avance: null })
    vi.mocked(getLineaProgresoDeCoachee).mockResolvedValue([])
    vi.mocked(getLogrosDeCoachee).mockResolvedValue([])
    vi.mocked(getSolicitudesReagendamiento).mockResolvedValue([])
    vi.mocked(responderSolicitudReagendamiento).mockResolvedValue({
      ...solicitudDeEsteCoachee,
      estado: 'resuelta',
    })
  })

  it('shows only pending requests for this coachee, filtering out other coachees', async () => {
    vi.mocked(getSolicitudesReagendamiento).mockResolvedValue([
      solicitudDeEsteCoachee,
      solicitudDeOtroCoachee,
    ])

    const wrapper = mount(SesionesTab, { props: { coacheeId: 'coachee-1' } })
    await flushPromises()

    expect(wrapper.text()).toContain('Solicitudes de reagendamiento (1)')
    expect(wrapper.text()).toContain('tengo un viaje')
  })

  it('shows nothing when this coachee has no pending requests', async () => {
    vi.mocked(getSolicitudesReagendamiento).mockResolvedValue([solicitudDeOtroCoachee])

    const wrapper = mount(SesionesTab, { props: { coacheeId: 'coachee-1' } })
    await flushPromises()

    expect(wrapper.text()).not.toContain('Solicitudes de reagendamiento')
  })

  it('responds to a request and removes it from the list', async () => {
    vi.mocked(getSolicitudesReagendamiento).mockResolvedValue([solicitudDeEsteCoachee])

    const wrapper = mount(SesionesTab, { props: { coacheeId: 'coachee-1' } })
    await flushPromises()

    const responderBtn = wrapper.findAll('button').find((b) => b.text() === 'Responder')
    await responderBtn!.trigger('click')
    await flushPromises()

    const modal = new DOMWrapper(document.body)
    await modal.find('textarea').setValue('Nos vemos el jueves')
    await modal.find('form').trigger('submit')
    await flushPromises()

    expect(responderSolicitudReagendamiento).toHaveBeenCalledWith('reag-1', {
      nuevaFechaHora: undefined,
      respuestaCoach: 'Nos vemos el jueves',
    })
    expect(wrapper.text()).not.toContain('Solicitudes de reagendamiento')
  })
})
