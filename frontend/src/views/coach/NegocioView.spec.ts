import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import NegocioView from './NegocioView.vue'
import type { ResumenNegocio, Alertas, AvancePorArea } from '../../api/negocio'

vi.mock('../../api/negocio', async () => {
  const actual = await vi.importActual<typeof import('../../api/negocio')>('../../api/negocio')
  return {
    ...actual,
    getResumenNegocio: vi.fn(),
    getAlertas: vi.fn(),
    getAvancePorArea: vi.fn(),
  }
})
vi.mock('../../api/empresas', () => ({ updateEmpresa: vi.fn() }))

import { getResumenNegocio, getAlertas, getAvancePorArea } from '../../api/negocio'

const resumen: ResumenNegocio = {
  porEmpresa: [
    {
      empresaId: 'e1',
      nombre: 'Empresa Uno',
      pagada: true,
      horasContratadas: 10,
      horasConsumidas: 4,
      ingresoDelPeriodo: 120000,
      ingresoProyectado: 60000,
    },
  ],
  horasRealizadasTotal: 4,
  ingresoDelPeriodoTotal: 120000,
  ingresoProyectadoTotal: 60000,
  coacheesActivos: 2,
  satisfaccionPromedio: 4.5,
}

const alertas: Alertas = {
  ciclosPorVencer: [{ coacheeId: 'c1', nombre: 'Coachee Uno', sesionesRestantes: 1 }],
  coacheesSinLogros: [{ coacheeId: 'c1', nombre: 'Coachee Uno' }],
  coacheesSinProximaSesion: [],
}

const avancePorArea: AvancePorArea[] = [
  { area: 'Comercial', avancePromedio: 80, coacheesCount: 2 },
]

describe('NegocioView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getResumenNegocio).mockResolvedValue(resumen)
    vi.mocked(getAlertas).mockResolvedValue(alertas)
    vi.mocked(getAvancePorArea).mockResolvedValue(avancePorArea)
  })

  it('shows the KPI cards with formatted currency and satisfaction', async () => {
    const wrapper = mount(NegocioView)
    await flushPromises()

    expect(wrapper.text()).toContain('4') // horas realizadas
    expect(wrapper.text()).toContain('$120.000')
    expect(wrapper.text()).toContain('4.5 ★')
  })

  it('shows the seguimiento alerts grouped by type', async () => {
    const wrapper = mount(NegocioView)
    await flushPromises()

    expect(wrapper.text()).toContain('Ciclos por vencer (1)')
    expect(wrapper.text()).toContain('Sin próxima sesión (0)')
    expect(wrapper.text()).toContain('Coachee Uno')
  })

  it('shows the empresa row with its pagada state and horas contratadas', async () => {
    const wrapper = mount(NegocioView)
    await flushPromises()

    expect(wrapper.text()).toContain('Empresa Uno')
    const checkbox = wrapper.find('input[type="checkbox"]')
    expect((checkbox.element as HTMLInputElement).checked).toBe(true)
    const horasInput = wrapper.find('input[type="number"]')
    expect((horasInput.element as HTMLInputElement).value).toBe('10')
  })

  it('renders the avance por área bar chart', async () => {
    const wrapper = mount(NegocioView)
    await flushPromises()

    expect(wrapper.text()).toContain('Comercial')
    expect(wrapper.text()).toContain('80%')
  })
})
