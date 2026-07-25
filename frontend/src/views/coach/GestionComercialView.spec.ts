import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises, DOMWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import GestionComercialView from './GestionComercialView.vue'
import type { SolicitudProceso } from '../../api/satisfaccion'
import type { CicloCerrado } from '../../api/ciclos'
import type { SolicitudReagendamiento } from '../../api/solicitudes-reagendamiento'

vi.mock('../../api/satisfaccion', async () => {
  const actual = await vi.importActual<typeof import('../../api/satisfaccion')>('../../api/satisfaccion')
  return {
    ...actual,
    getSolicitudes: vi.fn(),
    atenderSolicitud: vi.fn(),
  }
})
vi.mock('../../api/ciclos', async () => {
  const actual = await vi.importActual<typeof import('../../api/ciclos')>('../../api/ciclos')
  return {
    ...actual,
    getCiclosCerrados: vi.fn(),
  }
})
vi.mock('../../api/solicitudes-reagendamiento', async () => {
  const actual = await vi.importActual<typeof import('../../api/solicitudes-reagendamiento')>('../../api/solicitudes-reagendamiento')
  return {
    ...actual,
    getSolicitudesReagendamiento: vi.fn(),
    responderSolicitudReagendamiento: vi.fn(),
  }
})
vi.mock('../../lib/notify', () => ({
  notifySuccess: vi.fn(),
  notifyError: vi.fn(),
}))

import { getSolicitudes, atenderSolicitud } from '../../api/satisfaccion'
import { getCiclosCerrados } from '../../api/ciclos'
import {
  getSolicitudesReagendamiento,
  responderSolicitudReagendamiento,
} from '../../api/solicitudes-reagendamiento'

const solicitudes: SolicitudProceso[] = [
  {
    id: 'sol-1',
    empresaId: 'e1',
    nombreSugerido: 'Nuevo Coachee',
    mensaje: 'Necesitamos apoyo',
    estado: 'pendiente',
    createdAt: '2026-07-02T00:00:00.000Z',
    empresa: { id: 'e1', nombre: 'Empresa Uno' },
  },
]

const cerrados: CicloCerrado[] = [
  {
    id: 'ciclo-1',
    coacheeId: 'coachee-1',
    totalSesiones: 10,
    fechaApertura: '2026-01-01T00:00:00.000Z',
    fechaCierre: '2026-06-01T00:00:00.000Z',
    resultado: 'logrado',
    resumenReunionInicial: null,
    informeFinal: null,
    informePdfNombre: null,
    informePdfPath: null,
    sesionesRealizadas: 10,
    sesionesRestantes: 0,
    alertaPorVencer: false,
    coachee: { id: 'coachee-1', nombre: 'Coachee Uno' },
  },
]

const solicitudesReagendamiento: SolicitudReagendamiento[] = [
  {
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
  },
]

describe('GestionComercialView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getSolicitudes).mockResolvedValue(solicitudes)
    vi.mocked(getCiclosCerrados).mockResolvedValue(cerrados)
    vi.mocked(atenderSolicitud).mockResolvedValue({ ...solicitudes[0], estado: 'atendida' })
    vi.mocked(getSolicitudesReagendamiento).mockResolvedValue(solicitudesReagendamiento)
    vi.mocked(responderSolicitudReagendamiento).mockResolvedValue({
      ...solicitudesReagendamiento[0],
      estado: 'resuelta',
    })
  })

  it('shows pending solicitudes with their empresa name', async () => {
    const wrapper = mount(GestionComercialView)
    await flushPromises()

    expect(wrapper.text()).toContain('Nuevo Coachee')
    expect(wrapper.text()).toContain('Empresa Uno')
  })

  it('removes a solicitud from the list once atendida', async () => {
    const wrapper = mount(GestionComercialView)
    await flushPromises()

    const atenderBtn = wrapper.findAll('button').find((b) => b.text() === 'Atender')
    await atenderBtn!.trigger('click')
    await flushPromises()

    expect(atenderSolicitud).toHaveBeenCalledWith('sol-1')
    expect(wrapper.text()).not.toContain('Nuevo Coachee')
  })

  it('shows procesos cerrados with a link to open a new one', async () => {
    const wrapper = mount(GestionComercialView)
    await flushPromises()

    expect(wrapper.text()).toContain('Abrir nuevo proceso con Coachee Uno')
  })

  it('shows pending reagendamiento requests with coachee nombre and fecha', async () => {
    const wrapper = mount(GestionComercialView)
    await flushPromises()

    expect(wrapper.text()).toContain('Ana')
    expect(wrapper.text()).toContain('tengo un viaje')
  })

  it('responds to a reagendamiento request and removes it from the queue', async () => {
    const wrapper = mount(GestionComercialView)
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
    expect(wrapper.text()).not.toContain('tengo un viaje')
  })
})
