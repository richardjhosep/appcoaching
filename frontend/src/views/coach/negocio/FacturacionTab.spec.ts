import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import FacturacionTab from './FacturacionTab.vue'

vi.mock('../../../api/negocio', async () => {
  const actual = await vi.importActual<typeof import('../../../api/negocio')>('../../../api/negocio')
  return { ...actual, getFacturacionMensual: vi.fn() }
})
import { getFacturacionMensual, type FacturacionCoachee } from '../../../api/negocio'

const fila = (extra: Partial<FacturacionCoachee>): FacturacionCoachee => ({
  coacheeId: 'c1',
  nombre: 'Ana',
  empresaNombre: 'Ferronor',
  sesionesAgendadas: 3,
  sesionesRealizadas: 1,
  montoRealizado: 78000,
  montoPorRealizar: 156000,
  ...extra,
})

describe('FacturacionTab', () => {
  beforeEach(() => {
    vi.useRealTimers()
    vi.mocked(getFacturacionMensual).mockReset()
  })

  it('shows each coachee, a subtotal per empresa and the general total', async () => {
    vi.mocked(getFacturacionMensual).mockResolvedValue({
      mes: '2026-11',
      valorUf: 39000,
      coachees: [
        fila({ coacheeId: 'c3', nombre: 'Indep', empresaNombre: null, sesionesAgendadas: 1, sesionesRealizadas: 1, montoRealizado: 50000, montoPorRealizar: 0 }),
        fila({}),
        fila({ coacheeId: 'c2', nombre: 'Beto', sesionesAgendadas: 2, sesionesRealizadas: 2, montoRealizado: 156000, montoPorRealizar: 0 }),
      ],
    })

    const wrapper = mount(FacturacionTab)
    await flushPromises()

    const subtotales = wrapper.findAll('[data-subtotal]').map((tr) => tr.text())
    expect(subtotales).toHaveLength(2)
    expect(subtotales[0]).toContain('Ferronor')
    expect(subtotales[0]).toContain('$390.000')
    expect(subtotales[1]).toContain('Independientes')
    const celdas = wrapper.find('[data-total]').findAll('td').map((td) => td.text())
    expect(celdas).toEqual(['6', '4', '$284.000', '$156.000', '$440.000'])
  })

  it('moves between months, also across the year boundary', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 11, 31, 12))
    vi.mocked(getFacturacionMensual).mockResolvedValue({ mes: '', valorUf: 0, coachees: [] })

    const wrapper = mount(FacturacionTab)
    await flushPromises()
    expect(getFacturacionMensual).toHaveBeenLastCalledWith('2026-12')
    expect(wrapper.text()).toContain('Sin sesiones este mes')

    await wrapper.find('[aria-label="Mes siguiente"]').trigger('click')
    await flushPromises()
    expect(getFacturacionMensual).toHaveBeenLastCalledWith('2027-01')

    await wrapper.find('[aria-label="Mes anterior"]').trigger('click')
    await wrapper.find('[aria-label="Mes anterior"]').trigger('click')
    await flushPromises()
    expect(getFacturacionMensual).toHaveBeenLastCalledWith('2026-11')
  })

  it('shows an error with retry', async () => {
    vi.mocked(getFacturacionMensual).mockRejectedValue(new Error('sin conexión'))

    const wrapper = mount(FacturacionTab)
    await flushPromises()

    expect(wrapper.find('[role="alert"]').text()).toContain('sin conexión')
  })
})
