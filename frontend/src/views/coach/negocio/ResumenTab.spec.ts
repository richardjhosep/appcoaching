import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ResumenTab from './ResumenTab.vue'
import type { ResumenNegocio, Alertas, AvancePorArea } from '../../../api/negocio'

vi.mock('../../../api/negocio', async () => {
  const actual = await vi.importActual<typeof import('../../../api/negocio')>('../../../api/negocio')
  return {
    ...actual,
    getResumenNegocio: vi.fn(),
    getAlertas: vi.fn(),
    getAvancePorArea: vi.fn(),
  }
})
vi.mock('../../../api/empresas', () => ({ updateEmpresa: vi.fn() }))
vi.mock('../../../api/indicadores', () => ({ getUfHoy: vi.fn() }))

const jsonToSheet = vi.fn().mockReturnValue({})
const bookAppendSheet = vi.fn()
const writeFile = vi.fn()
vi.mock('xlsx', () => ({
  utils: {
    json_to_sheet: (...args: unknown[]) => jsonToSheet(...args),
    book_new: () => ({}),
    book_append_sheet: (...args: unknown[]) => bookAppendSheet(...args),
  },
  writeFile: (...args: unknown[]) => writeFile(...args),
}))

import { getResumenNegocio, getAlertas, getAvancePorArea } from '../../../api/negocio'
import { getUfHoy } from '../../../api/indicadores'

const resumen: ResumenNegocio = {
  porEmpresa: [
    {
      empresaId: 'e1',
      nombre: 'Empresa Uno',
      pagada: true,
      horasContratadas: 10, horasFijas: true,
      horasConsumidas: 4,
      ingresoDelPeriodo: 120000,
      ingresoProyectado: 60000,
    },
  ],
  porCoachee: [
    { coacheeId: 'c1', nombre: 'Coachee de Empresa', empresaNombre: 'Empresa Uno', horasRealizadas: 4, ingresoDelPeriodo: 120000, ingresoProyectado: 60000 },
    { coacheeId: 'c2', nombre: 'Coachee Independiente', empresaNombre: null, horasRealizadas: 2, ingresoDelPeriodo: 45000, ingresoProyectado: 0 },
  ],
  horasRealizadasTotal: 4,
  ingresoDelPeriodoTotal: 120000,
  ingresoProyectadoTotal: 60000,
  coacheesActivos: 3,
  carteraCoachees: [
    { coacheeId: 'c1', nombre: 'Coachee de Empresa', empresaNombre: 'Empresa Uno', empresaPagada: true, totalSesiones: 8, sesionesRealizadas: 4, horasDelPeriodo: 4, montoAgendadoDelPeriodo: 180000, ingresoConfirmadoDelPeriodo: 180000 },
    { coacheeId: 'c2', nombre: 'Coachee Independiente', empresaNombre: null, empresaPagada: null, totalSesiones: 6, sesionesRealizadas: 2, horasDelPeriodo: 2, montoAgendadoDelPeriodo: 45000, ingresoConfirmadoDelPeriodo: 45000 },
    { coacheeId: 'c3', nombre: 'Coachee Nuevo Ferronor', empresaNombre: 'Ferronor', empresaPagada: false, totalSesiones: null, sesionesRealizadas: 0, horasDelPeriodo: 0, montoAgendadoDelPeriodo: 0, ingresoConfirmadoDelPeriodo: 0 },
  ],
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

describe('ResumenTab', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getResumenNegocio).mockResolvedValue(resumen)
    vi.mocked(getAlertas).mockResolvedValue(alertas)
    vi.mocked(getAvancePorArea).mockResolvedValue(avancePorArea)
    vi.mocked(getUfHoy).mockResolvedValue({ valorUf: 40000, fecha: '2026-09-12', fuente: 'cmf', desactualizado: false })
  })

  it('shows the KPI cards with formatted currency and satisfaction', async () => {
    const wrapper = mount(ResumenTab)
    await flushPromises()

    expect(wrapper.text()).toContain('4') // horas realizadas
    expect(wrapper.text()).toContain('$120.000')
    expect(wrapper.text()).toContain('4.5 ★')
  })

  it('converts KPI amounts to UF when toggled, keeping the underlying totals in CLP', async () => {
    const wrapper = mount(ResumenTab)
    await flushPromises()

    const ufBtn = wrapper.findAll('button').find((b) => b.text() === 'UF')
    await ufBtn!.trigger('click')

    // 120.000 CLP / 40.000 CLP por UF = 3,00 UF
    expect(wrapper.text()).toContain('3,00 UF')
    expect(wrapper.text()).not.toContain('$120.000')
  })

  it('shows the seguimiento alerts grouped by type', async () => {
    const wrapper = mount(ResumenTab)
    await flushPromises()

    expect(wrapper.text()).toContain('Ciclos por vencer (1)')
    expect(wrapper.text()).toContain('Sin próxima sesión (0)')
    expect(wrapper.text()).toContain('Coachee Uno')
  })

  it('shows a muted empty state for an alert category with nothing pending, instead of a blank column', async () => {
    const wrapper = mount(ResumenTab)
    await flushPromises()

    // coacheesSinProximaSesion is empty in the fixture — its card must say so explicitly.
    expect(wrapper.text()).toContain('Sin pendientes.')
  })

  it('shows the empresa row with its pagada state and horas contratadas', async () => {
    const wrapper = mount(ResumenTab)
    await flushPromises()

    expect(wrapper.text()).toContain('Empresa Uno')
    const checkbox = wrapper.find('input[type="checkbox"]')
    expect((checkbox.element as HTMLInputElement).checked).toBe(true)
    const horasInput = wrapper.find('input[type="number"]')
    expect((horasInput.element as HTMLInputElement).value).toBe('10')
  })

  it('shows the whole active cartera, including a new coachee without sessions nor ciclo from an empresa not marked as pagada', async () => {
    const wrapper = mount(ResumenTab)
    await flushPromises()

    const text = wrapper.text()
    expect(text).toContain('Cartera de coachees')
    expect(text).toContain('Coachee de Empresa')
    expect(text).toContain('Coachee Independiente')
    expect(text).toContain('Coachee Nuevo Ferronor')
    expect(text).toContain('Pago pendiente')
    expect(text).toContain('Sin ciclo')
    expect(text).toContain('4/8')
  })

  it('exports both empresas AND independientes to Excel, in separate sheets — not just empresas', async () => {
    const wrapper = mount(ResumenTab)
    await flushPromises()

    const exportarBtn = wrapper.findAll('button').find((b) => b.text() === 'Exportar Excel')!
    await exportarBtn.trigger('click')

    expect(jsonToSheet).toHaveBeenCalledTimes(2)
    const [filasEmpresa] = jsonToSheet.mock.calls[0]
    const [filasCoachee] = jsonToSheet.mock.calls[1]

    expect(filasEmpresa).toEqual([
      { Empresa: 'Empresa Uno', Pagada: 'Sí', 'Horas contratadas': 10, 'Horas consumidas': 4, 'Ingreso del período': 120000, 'Ingreso proyectado': 60000 },
    ])
    expect(filasCoachee).toHaveLength(3)
    expect(filasCoachee[0]).toEqual({
      Coachee: 'Coachee de Empresa',
      Empresa: 'Empresa Uno',
      'Pago empresa': 'Confirmado',
      'Sesiones del proceso': 8,
      'Sesiones realizadas': 4,
      'Horas del período': 4,
      'Agendado del período': 180000,
      'Ingreso confirmado': 180000,
    })
    expect(filasCoachee[1]).toEqual(expect.objectContaining({ Empresa: 'Independiente', 'Pago empresa': '—' }))
    expect(filasCoachee[2]).toEqual(expect.objectContaining({ 'Pago empresa': 'Pendiente', 'Sesiones del proceso': '' }))

    expect(bookAppendSheet).toHaveBeenCalledWith(expect.anything(), expect.anything(), 'Cobros por empresa')
    expect(bookAppendSheet).toHaveBeenCalledWith(expect.anything(), expect.anything(), 'Cartera de coachees')
    expect(writeFile).toHaveBeenCalledTimes(1)
  })

  it('renders the avance por área bar chart', async () => {
    const wrapper = mount(ResumenTab)
    await flushPromises()

    expect(wrapper.text()).toContain('Comercial')
    expect(wrapper.text()).toContain('80%')
  })
})
