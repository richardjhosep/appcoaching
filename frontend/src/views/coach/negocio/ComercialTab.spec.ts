import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ComercialTab from './ComercialTab.vue'
import type { SolicitudProceso } from '../../../api/satisfaccion'
import type { CicloCerrado } from '../../../api/ciclos'
import type { ResumenComercial, ProyeccionMes } from '../../../api/negocio'

vi.mock('../../../api/satisfaccion', async () => {
  const actual = await vi.importActual<typeof import('../../../api/satisfaccion')>('../../../api/satisfaccion')
  return {
    ...actual,
    getSolicitudes: vi.fn(),
    atenderSolicitud: vi.fn(),
  }
})
vi.mock('../../../api/ciclos', async () => {
  const actual = await vi.importActual<typeof import('../../../api/ciclos')>('../../../api/ciclos')
  return {
    ...actual,
    getCiclosCerrados: vi.fn(),
  }
})
vi.mock('../../../api/negocio', async () => {
  const actual = await vi.importActual<typeof import('../../../api/negocio')>('../../../api/negocio')
  return {
    ...actual,
    getResumenComercial: vi.fn(),
    getProyeccionMensual: vi.fn(),
  }
})

import { getSolicitudes, atenderSolicitud } from '../../../api/satisfaccion'
import { getCiclosCerrados } from '../../../api/ciclos'
import { getResumenComercial, getProyeccionMensual } from '../../../api/negocio'

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

const resumenComercial: ResumenComercial = {
  periodo: 'mes',
  ingresoDelPeriodo: 500000,
  ingresoProyectado: 150000,
  horasRealizadas: 12,
  solicitudesNuevas: 3,
  solicitudesAtendidas: 1,
  solicitudesPendientes: 2,
  procesosIniciados: 2,
  procesosCerrados: 3,
  procesosCerradosPorResultado: { logrado: 2, medianamente_logrado: 0, no_logrado: 1 },
  reagendamientosSolicitados: 4,
  porCoachee: [
    {
      coacheeId: 'c1',
      nombre: 'Felipe Cortes',
      empresaNombre: 'Orbiflex',
      horasRealizadas: 5,
      ingresoDelPeriodo: 300000,
      ingresoProyectado: 100000,
    },
    {
      coacheeId: 'c2',
      nombre: 'Ana Reagenda',
      empresaNombre: null,
      horasRealizadas: 2,
      ingresoDelPeriodo: 200000,
      ingresoProyectado: 50000,
    },
  ],
}

const proyeccionMensual: ProyeccionMes[] = [
  {
    mes: '2026-08',
    etiqueta: "Ago '26",
    total: 500000,
    porEmpresa: [{ nombre: 'Orbiflex', monto: 500000 }],
    porCoachee: [{ nombre: 'Felipe Cortes', monto: 500000 }],
  },
]

describe('ComercialTab', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getSolicitudes).mockResolvedValue(solicitudes)
    vi.mocked(getCiclosCerrados).mockResolvedValue(cerrados)
    vi.mocked(atenderSolicitud).mockResolvedValue({ ...solicitudes[0], estado: 'atendida' })
    vi.mocked(getResumenComercial).mockResolvedValue(resumenComercial)
    vi.mocked(getProyeccionMensual).mockResolvedValue(proyeccionMensual)
  })

  it('shows the 12-month projected income chart', async () => {
    const wrapper = mount(ComercialTab)
    await flushPromises()

    expect(getProyeccionMensual).toHaveBeenCalled()
    expect(wrapper.text()).toContain('Ingresos proyectados — 12 meses')
    expect(wrapper.text()).toContain("Ago '26")
  })

  it('shows pending solicitudes with their empresa name', async () => {
    const wrapper = mount(ComercialTab)
    await flushPromises()

    expect(wrapper.text()).toContain('Nuevo Coachee')
    expect(wrapper.text()).toContain('Empresa Uno')
  })

  it('removes a solicitud from the list once atendida', async () => {
    const wrapper = mount(ComercialTab)
    await flushPromises()

    const atenderBtn = wrapper.findAll('button').find((b) => b.text() === 'Atender')
    await atenderBtn!.trigger('click')
    await flushPromises()

    expect(atenderSolicitud).toHaveBeenCalledWith('sol-1')
    expect(wrapper.text()).not.toContain('Nuevo Coachee')
  })

  it('shows procesos cerrados with a link to open a new one', async () => {
    const wrapper = mount(ComercialTab)
    await flushPromises()

    expect(wrapper.text()).toContain('Abrir nuevo proceso con Coachee Uno')
  })

  it('loads the "mes" resumen by default and shows its KPIs, including ingreso proyectado', async () => {
    const wrapper = mount(ComercialTab)
    await flushPromises()

    expect(getResumenComercial).toHaveBeenCalledWith('mes')
    const text = wrapper.text()
    expect(text).toContain('$500.000')
    expect(text).toContain('$150.000')
    expect(text).toContain('12')
    expect(text).toContain('1 atendidas · 2 pendientes')
    expect(text).toContain('Logrado (2)')
    expect(text).toContain('Medianamente logrado (0)')
    expect(text).toContain('No logrado (1)')
  })

  it('switches the period and reloads the resumen', async () => {
    const wrapper = mount(ComercialTab)
    await flushPromises()

    const semestreBtn = wrapper.findAll('button').find((b) => b.text() === 'Semestre actual')
    await semestreBtn!.trigger('click')
    await flushPromises()

    expect(getResumenComercial).toHaveBeenCalledWith('semestre')
  })

  it('shows a muted message instead of the result bar when nothing closed in the period', async () => {
    vi.mocked(getResumenComercial).mockResolvedValue({
      ...resumenComercial,
      procesosCerrados: 0,
      procesosCerradosPorResultado: { logrado: 0, medianamente_logrado: 0, no_logrado: 0 },
    })

    const wrapper = mount(ComercialTab)
    await flushPromises()

    expect(wrapper.text()).toContain('Ningún proceso se cerró en este período.')
  })

  it('shows the proyección por coachee table, with "Independiente" when there is no empresa', async () => {
    const wrapper = mount(ComercialTab)
    await flushPromises()

    const text = wrapper.text()
    expect(text).toContain('Felipe Cortes')
    expect(text).toContain('Orbiflex')
    expect(text).toContain('Ana Reagenda')
    expect(text).toContain('Independiente')
    expect(text).toContain('$300.000')
    expect(text).toContain('$100.000')
    expect(text).toContain('$400.000') // total estimado de Felipe: 300.000 + 100.000
  })

  it('shows a muted message instead of the table when no coachee had activity in the period', async () => {
    vi.mocked(getResumenComercial).mockResolvedValue({ ...resumenComercial, porCoachee: [] })

    const wrapper = mount(ComercialTab)
    await flushPromises()

    expect(wrapper.text()).toContain('Sin actividad de coachees en este período.')
  })
})
