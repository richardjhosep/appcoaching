import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SatisfaccionView from './SatisfaccionView.vue'
import type { Encuesta, KpisEmpresa, SolicitudProceso } from '../../api/satisfaccion'

vi.mock('../../api/satisfaccion', async () => {
  const actual = await vi.importActual<typeof import('../../api/satisfaccion')>('../../api/satisfaccion')
  return {
    ...actual,
    getMisKpis: vi.fn(),
    getMisEncuestas: vi.fn(),
    getMisSolicitudes: vi.fn(),
    crearEncuesta: vi.fn(),
    crearSolicitud: vi.fn(),
  }
})

import { getMisKpis, getMisEncuestas, getMisSolicitudes } from '../../api/satisfaccion'

const kpis: KpisEmpresa = {
  procesosTerminados: 2,
  procesosEnCurso: 1,
  tasaAsistencia: 75,
  satisfaccionPromedio: 4.5,
}

const encuestas: Encuesta[] = [
  { id: 'enc-1', empresaId: 'e1', calificacion: 5, comentario: 'Excelente', createdAt: '2026-07-01T00:00:00.000Z' },
]

const solicitudes: SolicitudProceso[] = [
  { id: 'sol-1', empresaId: 'e1', nombreSugerido: 'Nuevo Coachee', mensaje: null, estado: 'pendiente', createdAt: '2026-07-02T00:00:00.000Z' },
]

describe('SatisfaccionView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getMisKpis).mockResolvedValue(kpis)
    vi.mocked(getMisEncuestas).mockResolvedValue(encuestas)
    vi.mocked(getMisSolicitudes).mockResolvedValue(solicitudes)
  })

  it('shows the KPI cards', async () => {
    const wrapper = mount(SatisfaccionView)
    await flushPromises()

    expect(wrapper.text()).toContain('75%')
    expect(wrapper.text()).toContain('4.5 ★')
    expect(wrapper.text()).toContain('2')
    expect(wrapper.text()).toContain('1')
  })

  it('shows past encuestas and solicitudes', async () => {
    const wrapper = mount(SatisfaccionView)
    await flushPromises()

    expect(wrapper.text()).toContain('Excelente')
    expect(wrapper.text()).toContain('Nuevo Coachee')
    expect(wrapper.text()).toContain('Pendiente')
  })
})
