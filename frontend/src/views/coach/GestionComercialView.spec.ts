import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import GestionComercialView from './GestionComercialView.vue'
import type { SolicitudProceso } from '../../api/satisfaccion'
import type { CicloCerrado } from '../../api/ciclos'

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

import { getSolicitudes, atenderSolicitud } from '../../api/satisfaccion'
import { getCiclosCerrados } from '../../api/ciclos'

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

describe('GestionComercialView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getSolicitudes).mockResolvedValue(solicitudes)
    vi.mocked(getCiclosCerrados).mockResolvedValue(cerrados)
    vi.mocked(atenderSolicitud).mockResolvedValue({ ...solicitudes[0], estado: 'atendida' })
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
})
