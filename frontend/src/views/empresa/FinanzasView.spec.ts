import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import FinanzasView from './FinanzasView.vue'
import DonutChart from '../../components/DonutChart.vue'
import type {
  ResumenFinanzasEmpresa,
  ProyeccionMesEmpresa,
  ResumenAcumuladoEmpresa,
  RetornoInversionEmpresa,
} from '../../api/negocio'
import type { Empresa } from '../../api/empresas'

vi.mock('../../api/negocio', async () => {
  const actual = await vi.importActual<typeof import('../../api/negocio')>('../../api/negocio')
  return {
    ...actual,
    getMiResumenFinanciero: vi.fn(),
    getMiProyeccionFinanciera: vi.fn(),
    getMiResumenAcumulado: vi.fn(),
    getMiRetornoInversion: vi.fn(),
  }
})
vi.mock('../../api/empresas', async () => {
  const actual = await vi.importActual<typeof import('../../api/empresas')>('../../api/empresas')
  return { ...actual, getMyEmpresa: vi.fn() }
})

import {
  getMiResumenFinanciero,
  getMiProyeccionFinanciera,
  getMiResumenAcumulado,
  getMiRetornoInversion,
} from '../../api/negocio'
import { getMyEmpresa } from '../../api/empresas'

const resumenPendiente: ResumenFinanzasEmpresa = {
  pagada: false,
  horasContratadas: 40,
  horasConsumidas: 5,
  gastoDelPeriodo: 150000,
  gastoProyectado: 60000,
  gastoPendiente: 150000,
  porCoachee: [
    {
      coacheeId: 'c1',
      nombre: 'QA Paleta Verify',
      empresaNombre: 'QA Empresa Verify',
      horasRealizadas: 5,
      gastoBrutoDelPeriodo: 150000,
      gastoBrutoProyectado: 60000,
    },
  ],
}

const proyeccion: ProyeccionMesEmpresa[] = [
  { mes: '2026-08', etiqueta: "Ago '26", total: 210000, porCoachee: [{ nombre: 'QA Paleta Verify', monto: 210000 }] },
]

const acumulado: ResumenAcumuladoEmpresa = {
  anio: 2026,
  semestre: 2,
  gastoEjecutadoSemestre: 450000,
  gastoAgendadoSemestre: 60000,
  gastoEjecutadoAnio: 450000,
  gastoAgendadoAnio: 60000,
}

const retornoVacio: RetornoInversionEmpresa = {
  costoTotalProcesosCerrados: 0,
  costoPromedioPorProceso: null,
  distribucionResultados: { logrado: 0, medianamente_logrado: 0, no_logrado: 0 },
  procesos: [],
}

const retornoConProcesos: RetornoInversionEmpresa = {
  costoTotalProcesosCerrados: 200000,
  costoPromedioPorProceso: 100000,
  distribucionResultados: { logrado: 1, medianamente_logrado: 0, no_logrado: 1 },
  procesos: [
    {
      coacheeNombre: 'QA Paleta Verify',
      cicloId: 'ciclo-1',
      fechaApertura: '2026-07-01T00:00:00.000Z',
      fechaCierre: '2026-08-01T00:00:00.000Z',
      costo: 120000,
      resultado: 'logrado',
      impactoNegocio: 'Redujo el tiempo de respuesta a clientes en 20%.',
    },
    {
      coacheeNombre: 'QA Paleta Verify',
      cicloId: 'ciclo-2',
      fechaApertura: '2026-05-01T00:00:00.000Z',
      fechaCierre: '2026-06-01T00:00:00.000Z',
      costo: 80000,
      resultado: 'no_logrado',
      impactoNegocio: null,
    },
  ],
}

const empresa: Empresa = {
  id: 'empresa-1',
  nombre: 'QA Empresa Verify',
  tarifaHora: 30000,
  isActive: true,
  pagada: false,
  horasContratadas: 40,
  fechaInicio: null,
  fechaFin: null,
}

async function mountView() {
  const wrapper = mount(FinanzasView)
  await flushPromises()
  return wrapper
}

describe('FinanzasView (empresa)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getMiProyeccionFinanciera).mockResolvedValue(proyeccion)
    vi.mocked(getMiResumenAcumulado).mockResolvedValue(acumulado)
    vi.mocked(getMyEmpresa).mockResolvedValue(empresa)
    vi.mocked(getMiRetornoInversion).mockResolvedValue(retornoVacio)
  })

  it('shows gasto del período, horas and the "Pendiente" badge when not pagada', async () => {
    vi.mocked(getMiResumenFinanciero).mockResolvedValue(resumenPendiente)

    const wrapper = await mountView()

    expect(wrapper.text()).toContain('$150.000')
    expect(wrapper.text()).toContain('5 / 40')
    expect(wrapper.text()).toContain('Pendiente')
  })

  it('shows the "Al día" badge and $0 pendiente once pagada', async () => {
    vi.mocked(getMiResumenFinanciero).mockResolvedValue({
      ...resumenPendiente,
      pagada: true,
      gastoPendiente: 0,
    })

    const wrapper = await mountView()

    expect(wrapper.text()).toContain('Al día')
    expect(wrapper.text()).toContain('$0')
  })

  it('lists gasto por coachee and the 6-month projection', async () => {
    vi.mocked(getMiResumenFinanciero).mockResolvedValue(resumenPendiente)

    const wrapper = await mountView()

    expect(wrapper.text()).toContain('QA Paleta Verify')
    expect(wrapper.text()).toContain("Ago '26")
  })

  it('shows the empresa name, emission date, and prints via window.print', async () => {
    vi.mocked(getMiResumenFinanciero).mockResolvedValue(resumenPendiente)
    window.print = vi.fn()
    const printSpy = window.print

    const wrapper = await mountView()

    expect(wrapper.text()).toContain('QA Empresa Verify')

    const botonImprimir = wrapper.findAll('button').find((b) => b.text().includes('Descargar / Imprimir'))
    await botonImprimir!.trigger('click')
    expect(printSpy).toHaveBeenCalled()
  })

  it('switches the proyección view between mensual, semestral and anual', async () => {
    vi.mocked(getMiResumenFinanciero).mockResolvedValue(resumenPendiente)

    const wrapper = await mountView()

    // Mensual es la vista inicial: se ve el gráfico mensual, no los montos acumulados.
    expect(wrapper.text()).toContain("Ago '26")
    expect(wrapper.text()).not.toContain('2do semestre 2026')

    const botonSemestral = wrapper.findAll('button').find((b) => b.text() === 'Semestral')
    await botonSemestral!.trigger('click')
    expect(wrapper.text()).toContain('2do semestre 2026')
    // Semestre: 450.000 ejecutado + 60.000 agendado = 510.000 total
    expect(wrapper.text()).toContain('$510.000')

    const botonAnual = wrapper.findAll('button').find((b) => b.text() === 'Anual')
    await botonAnual!.trigger('click')
    expect(wrapper.text()).toContain('Año 2026')
    expect(wrapper.text()).toContain('$510.000')
  })

  it('shows an empty state for Retorno de la inversión when there are no closed procesos', async () => {
    vi.mocked(getMiResumenFinanciero).mockResolvedValue(resumenPendiente)

    const wrapper = await mountView()

    expect(wrapper.text()).toContain('Retorno de la inversión')
    expect(wrapper.text()).toContain('Todavía no hay procesos cerrados')
  })

  it('shows the ROI kpis and one card per proceso cerrado, with impacto only when present', async () => {
    vi.mocked(getMiResumenFinanciero).mockResolvedValue(resumenPendiente)
    vi.mocked(getMiRetornoInversion).mockResolvedValue(retornoConProcesos)

    const wrapper = await mountView()

    expect(wrapper.text()).toContain('$200.000') // invertido en procesos cerrados
    expect(wrapper.text()).toContain('$100.000') // costo promedio
    expect(wrapper.text()).toContain('50%') // 1 de 2 logrado
    expect(wrapper.text()).toContain('Logrado')
    expect(wrapper.text()).toContain('No logrado')
    expect(wrapper.text()).toContain('Redujo el tiempo de respuesta a clientes en 20%.')

    const donut = wrapper.findComponent(DonutChart)
    expect(donut.props('centerValue')).toBe(2)
    expect(donut.props('segments')).toEqual([
      { label: 'Logrado', count: 1, pct: 50, color: 'var(--color-sage)' },
      { label: 'No logrado', count: 1, pct: 50, color: 'var(--color-danger)' },
    ])
  })
})
