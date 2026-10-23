import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import InformeEjecutivoView from './InformeEjecutivoView.vue'
import DonutChart from '../../components/DonutChart.vue'
import type { Empresa } from '../../api/empresas'
import type { KpisEmpresa, PuntoTendencia } from '../../api/satisfaccion'
import type { ResumenFinanzasEmpresa, RetornoInversionEmpresa } from '../../api/negocio'

vi.mock('../../api/empresas', async () => {
  const actual = await vi.importActual<typeof import('../../api/empresas')>('../../api/empresas')
  return { ...actual, getMyEmpresa: vi.fn() }
})
vi.mock('../../api/satisfaccion', async () => {
  const actual = await vi.importActual<typeof import('../../api/satisfaccion')>('../../api/satisfaccion')
  return { ...actual, getMisKpis: vi.fn(), getMiTendencia: vi.fn() }
})
vi.mock('../../api/negocio', async () => {
  const actual = await vi.importActual<typeof import('../../api/negocio')>('../../api/negocio')
  return { ...actual, getMiResumenFinanciero: vi.fn(), getMiRetornoInversion: vi.fn() }
})

import { getMyEmpresa } from '../../api/empresas'
import { getMisKpis, getMiTendencia } from '../../api/satisfaccion'
import { getMiResumenFinanciero, getMiRetornoInversion } from '../../api/negocio'

const empresa: Empresa = {
  id: 'empresa-1',
  nombre: 'QA Empresa Verify',
  tarifaHora: 30000,
  tarifaHoraMoneda: 'clp',
  isActive: true,
  pagada: true,
  horasContratadas: 40, horasFijas: false,
  fechaInicio: null,
  fechaFin: null,
}

const kpis: KpisEmpresa = {
  procesosTerminados: 2,
  procesosEnCurso: 1,
  tasaAsistencia: 90,
  satisfaccionPromedio: 4.5,
}

const tendencia: PuntoTendencia[] = [
  { mes: '2026-08', etiqueta: "Ago '26", satisfaccionPromedio: 4.5, pctLogrado: 100, tasaAsistencia: 90 },
]

const finanzas: ResumenFinanzasEmpresa = {
  pagada: true,
  horasContratadas: 40,
  horasConsumidas: 10,
  gastoDelPeriodo: 300000,
  gastoProyectado: 0,
  gastoPendiente: 0,
  porCoachee: [],
}

const retorno: RetornoInversionEmpresa = {
  costoTotalProcesosCerrados: 200000,
  costoPromedioPorProceso: 100000,
  distribucionResultados: { logrado: 2, medianamente_logrado: 0, no_logrado: 0 },
  procesos: [
    {
      coacheeNombre: 'QA Paleta Verify',
      cicloId: 'ciclo-1',
      fechaApertura: '2026-07-01T00:00:00.000Z',
      fechaCierre: '2026-08-01T00:00:00.000Z',
      costo: 200000,
      resultado: 'logrado',
      impactoNegocio: 'Redujo el tiempo de respuesta a clientes en 20%.',
    },
  ],
}

async function mountView() {
  const wrapper = mount(InformeEjecutivoView)
  await flushPromises()
  return wrapper
}

describe('InformeEjecutivoView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getMyEmpresa).mockResolvedValue(empresa)
    vi.mocked(getMisKpis).mockResolvedValue(kpis)
    vi.mocked(getMiTendencia).mockResolvedValue(tendencia)
    vi.mocked(getMiResumenFinanciero).mockResolvedValue(finanzas)
    vi.mocked(getMiRetornoInversion).mockResolvedValue(retorno)
  })

  it('shows the header with empresa name and emission date', async () => {
    const wrapper = await mountView()

    expect(wrapper.text()).toContain('Informe ejecutivo')
    expect(wrapper.text()).toContain('QA Empresa Verify')
  })

  it('shows the KPI cards, tendencia, retorno de la inversión and finanzas sections', async () => {
    const wrapper = await mountView()

    expect(wrapper.text()).toContain('4.5/5')
    expect(wrapper.text()).toContain('Tendencia')
    expect(wrapper.text()).toContain('Retorno de la inversión')
    expect(wrapper.text()).toContain('$200.000')
    expect(wrapper.text()).toContain('Logrado')
    expect(wrapper.text()).toContain('Resumen financiero del período')
    expect(wrapper.text()).toContain('$300.000')

    const donut = wrapper.findComponent(DonutChart)
    expect(donut.props('centerValue')).toBe(1)
    expect(donut.props('segments')).toEqual([{ label: 'Logrado', count: 2, pct: 100, color: 'var(--color-sage)' }])
  })

  it('shows the impacto en el negocio only once, inside the proceso card', async () => {
    const wrapper = await mountView()

    const ocurrencias = wrapper.text().split('Redujo el tiempo de respuesta a clientes en 20%.').length - 1
    expect(ocurrencias).toBe(1)
    expect(wrapper.text()).not.toContain('Impactos en el negocio')
  })

  it('triggers window.print when "Imprimir / Guardar como PDF" is clicked', async () => {
    window.print = vi.fn()
    const printSpy = window.print

    const wrapper = await mountView()
    const boton = wrapper.findAll('button').find((b) => b.text().includes('Imprimir / Guardar como PDF'))
    await boton!.trigger('click')

    expect(printSpy).toHaveBeenCalled()
  })

  it('incluye la cabecera de reporte con marca, empresa y fecha de emisión (sin selector de período)', async () => {
    const wrapper = await mountView()

    expect(wrapper.text()).toContain('CoachNexus')
    expect(wrapper.text()).toMatch(/QA Empresa Verify · Emitido el /)
  })

  it('indica que el estado de pago lo registra el coach', async () => {
    const wrapper = await mountView()

    expect(wrapper.text()).toContain('Registrado por tu coach')
  })

  it('muestra ErrorState con Reintentar en vez de un informe parcial si falla una fuente', async () => {
    vi.mocked(getMiRetornoInversion).mockRejectedValueOnce(new Error('sin conexión'))
    const wrapper = await mountView()

    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('Resumen financiero del período')

    await wrapper.find('[role="alert"] button').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Resumen financiero del período')
  })
})
