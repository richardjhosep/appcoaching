import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { ApiError } from '../../api/client'
import DashboardView from './DashboardView.vue'
import type { CoacheeListItem } from '../../api/coachees'
import type { Ciclo } from '../../api/ciclos'
import type { Empresa } from '../../api/empresas'
import type { KpisEmpresa } from '../../api/satisfaccion'

vi.mock('../../api/satisfaccion', async () => {
  const actual = await vi.importActual<typeof import('../../api/satisfaccion')>('../../api/satisfaccion')
  return { ...actual, getMisKpis: vi.fn(), getMiTendencia: vi.fn() }
})
vi.mock('../../api/empresas', async () => {
  const actual = await vi.importActual<typeof import('../../api/empresas')>('../../api/empresas')
  return { ...actual, getMyEmpresa: vi.fn(), getMisCompetenciasContratadas: vi.fn() }
})
vi.mock('../../api/coachees', async () => {
  const actual = await vi.importActual<typeof import('../../api/coachees')>('../../api/coachees')
  return { ...actual, listCoachees: vi.fn() }
})
vi.mock('../../api/planesDesarrollo', async () => {
  const actual = await vi.importActual<typeof import('../../api/planesDesarrollo')>('../../api/planesDesarrollo')
  return { ...actual, getPlanByCoachee: vi.fn() }
})
vi.mock('../../api/ciclos', async () => {
  const actual = await vi.importActual<typeof import('../../api/ciclos')>('../../api/ciclos')
  return { ...actual, getCiclosDeCoachee: vi.fn() }
})
vi.mock('../../api/seguimiento', async () => {
  const actual = await vi.importActual<typeof import('../../api/seguimiento')>('../../api/seguimiento')
  return { ...actual, getAvanceDeCoachee: vi.fn() }
})
vi.mock('../../api/sesiones', async () => {
  const actual = await vi.importActual<typeof import('../../api/sesiones')>('../../api/sesiones')
  return { ...actual, getProximaSesionDeCoachee: vi.fn() }
})
vi.mock('../../api/negocio', async () => {
  const actual = await vi.importActual<typeof import('../../api/negocio')>('../../api/negocio')
  return { ...actual, getMiResumenFinanciero: vi.fn(), getMiResumenAcumulado: vi.fn() }
})

import { getMisKpis, getMiTendencia } from '../../api/satisfaccion'
import type { PuntoTendencia } from '../../api/satisfaccion'
import { getMyEmpresa, getMisCompetenciasContratadas } from '../../api/empresas'
import { listCoachees } from '../../api/coachees'
import { getPlanByCoachee } from '../../api/planesDesarrollo'
import { getCiclosDeCoachee } from '../../api/ciclos'
import { getAvanceDeCoachee } from '../../api/seguimiento'
import { getProximaSesionDeCoachee } from '../../api/sesiones'
import { getMiResumenFinanciero, getMiResumenAcumulado } from '../../api/negocio'
import type { ResumenFinanzasEmpresa, ResumenAcumuladoEmpresa } from '../../api/negocio'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/empresa/dashboard', name: 'empresa-dashboard', component: { template: '<div />' } },
    { path: '/empresa/coachees', name: 'empresa-coachees', component: { template: '<div />' } },
    { path: '/empresa/finanzas', name: 'empresa-finanzas', component: { template: '<div />' } },
  ],
})

const kpis: KpisEmpresa = {
  procesosTerminados: 2,
  procesosEnCurso: 1,
  tasaAsistencia: 80,
  satisfaccionPromedio: 4.5,
}

const empresa: Empresa = {
  id: 'empresa-1',
  nombre: 'QA Empresa Verify',
  tarifaHora: 1000,
  tarifaHoraMoneda: 'clp',
  isActive: true,
  pagada: false,
  horasContratadas: 40, horasFijas: false,
  fechaInicio: null,
  fechaFin: null,
}

const coachee: CoacheeListItem = {
  id: 'coachee-1',
  nombre: 'QA Paleta Verify',
  empresaId: 'empresa-1',
  consentimientoInformado: true,
  consentimientoFecha: null,
}

const finanzasMes: ResumenFinanzasEmpresa = {
  pagada: false,
  horasContratadas: 40,
  horasConsumidas: 3,
  gastoDelPeriodo: 90000,
  gastoProyectado: 30000,
  gastoPendiente: 90000,
  porCoachee: [],
}

const finanzasAcumuladas: ResumenAcumuladoEmpresa = {
  anio: 2026,
  semestre: 2,
  gastoEjecutadoSemestre: 270000,
  gastoAgendadoSemestre: 60000,
  gastoEjecutadoAnio: 270000,
  gastoAgendadoAnio: 60000,
}

const tendencia: PuntoTendencia[] = [
  { mes: '2026-07', etiqueta: "Jul '26", satisfaccionPromedio: null, pctLogrado: null, tasaAsistencia: null },
  { mes: '2026-08', etiqueta: "Ago '26", satisfaccionPromedio: 4.5, pctLogrado: 100, tasaAsistencia: 80 },
]

const cicloPorVencer: Ciclo = {
  id: 'c1',
  coacheeId: 'coachee-1',
  totalSesiones: 10,
  fechaApertura: '2026-01-01T00:00:00.000Z',
  fechaCierre: null,
  resultado: null,
  resumenReunionInicial: null,
  informeFinal: null,
  impactoNegocio: null,
  informePdfNombre: null,
  informePdfPath: null,
  sesionesRealizadas: 9,
  sesionesRestantes: 1,
  alertaPorVencer: true,
}

const cicloConImpacto: Ciclo = {
  id: 'c2',
  coacheeId: 'coachee-1',
  totalSesiones: 8,
  fechaApertura: '2026-01-01T00:00:00.000Z',
  fechaCierre: '2026-07-15T00:00:00.000Z',
  resultado: 'logrado',
  resumenReunionInicial: null,
  informeFinal: null,
  impactoNegocio: 'Redujo el tiempo de entrega del área en 20%.',
  informePdfNombre: null,
  informePdfPath: null,
  sesionesRealizadas: 8,
  sesionesRestantes: 0,
  alertaPorVencer: false,
}

async function mountView() {
  const wrapper = mount(DashboardView, { global: { plugins: [router] } })
  await flushPromises()
  return wrapper
}

describe('DashboardView (empresa)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getMisKpis).mockResolvedValue(kpis)
    vi.mocked(getMyEmpresa).mockResolvedValue(empresa)
    vi.mocked(getPlanByCoachee).mockResolvedValue(null as never)
    vi.mocked(getAvanceDeCoachee).mockResolvedValue({ avance: null })
    vi.mocked(getProximaSesionDeCoachee).mockResolvedValue(null)
    vi.mocked(getMiResumenFinanciero).mockResolvedValue(finanzasMes)
    vi.mocked(getMiResumenAcumulado).mockResolvedValue(finanzasAcumuladas)
    vi.mocked(getMiTendencia).mockResolvedValue(tendencia)
    vi.mocked(getMisCompetenciasContratadas).mockResolvedValue([])
  })

  it('shows the KPI cards and the contract info', async () => {
    vi.mocked(listCoachees).mockResolvedValue([])

    const wrapper = await mountView()

    expect(wrapper.text()).toContain('80%')
    expect(wrapper.text()).toContain('4.5/5')
    expect(wrapper.text()).toContain('40')
    expect(wrapper.text()).toContain('Pendiente')
    expect(wrapper.text()).toContain('Sin fecha registrada')
  })

  it('shows the contract end date when it is registered', async () => {
    vi.mocked(listCoachees).mockResolvedValue([])
    vi.mocked(getMyEmpresa).mockResolvedValue({ ...empresa, fechaFin: '2026-12-31' })

    const wrapper = await mountView()

    expect(wrapper.text()).toContain('31 dic 2026')
  })

  it('shows an empty state when nothing needs attention', async () => {
    vi.mocked(listCoachees).mockResolvedValue([])

    const wrapper = await mountView()

    expect(wrapper.text()).toContain('Todo al día')
  })

  it('shows the mes/semestre/año finance summary with ejecutado vs agendado', async () => {
    vi.mocked(listCoachees).mockResolvedValue([])

    const wrapper = await mountView()

    expect(wrapper.text()).toContain('Finanzas')
    expect(wrapper.text()).toContain('2do semestre 2026')
    expect(wrapper.text()).toContain('Año 2026')
    // Este mes: 90.000 ejecutado + 30.000 agendado = 120.000 total
    expect(wrapper.text()).toContain('$120.000')
    // Semestre/año: 270.000 ejecutado + 60.000 agendado = 330.000 total
    expect(wrapper.text()).toContain('$330.000')
    expect(wrapper.text()).toContain('Ver detalle por coachee y proyección a 6 meses')
  })

  it('lists a coachee whose current cycle is about to expire', async () => {
    vi.mocked(listCoachees).mockResolvedValue([coachee])
    vi.mocked(getCiclosDeCoachee).mockResolvedValue([cicloPorVencer])

    const wrapper = await mountView()

    expect(wrapper.text()).toContain('QA Paleta Verify')
    expect(wrapper.text()).toContain('Ciclo por vencer')
  })

  it('lists a coachee whose open cycle has no próxima sesión agendada, even without alertaPorVencer', async () => {
    vi.mocked(listCoachees).mockResolvedValue([coachee])
    vi.mocked(getCiclosDeCoachee).mockResolvedValue([{ ...cicloPorVencer, alertaPorVencer: false, sesionesRestantes: 5 }])
    vi.mocked(getProximaSesionDeCoachee).mockResolvedValue(null)

    const wrapper = await mountView()

    expect(wrapper.text()).toContain('QA Paleta Verify')
    expect(wrapper.text()).toContain('Sin sesión agendada')
    expect(wrapper.text()).not.toContain('Ciclo por vencer')
  })

  it('does not flag sinProximaSesion once a próxima sesión is agendada', async () => {
    vi.mocked(listCoachees).mockResolvedValue([coachee])
    vi.mocked(getCiclosDeCoachee).mockResolvedValue([{ ...cicloPorVencer, alertaPorVencer: false, sesionesRestantes: 5 }])
    vi.mocked(getProximaSesionDeCoachee).mockResolvedValue({
      id: 's1',
      coacheeId: 'coachee-1',
      fechaHora: '2026-09-10T10:00:00.000Z',
      linkVideollamada: null,
      resumenCompartido: null,
      confirmada: false,
      postSesion: null,
    })

    const wrapper = await mountView()

    expect(wrapper.text()).toContain('Todo al día')
    expect(wrapper.text()).not.toContain('Sin sesión agendada')
  })

  it('shows the Tendencia section, compressed to the months that actually have data', async () => {
    vi.mocked(listCoachees).mockResolvedValue([])

    const wrapper = await mountView()

    expect(wrapper.text()).toContain('Tendencia')
    expect(wrapper.text()).toContain('4.5/5')
    expect(wrapper.text()).toContain('100%')
    // Jul '26 no tiene ningún dato en el fixture — no debe aparecer, solo Ago '26.
    expect(wrapper.text()).not.toContain("Jul '26")
    expect(wrapper.text()).toContain("Ago '26")
  })

  it('shows an empty state for impactos when none are registered yet', async () => {
    vi.mocked(listCoachees).mockResolvedValue([])

    const wrapper = await mountView()

    expect(wrapper.text()).toContain('Últimos impactos en el negocio')
    expect(wrapper.text()).toContain('Todavía no hay impactos registrados')
  })

  it('shows the most recent impacto en el negocio for a closed cycle', async () => {
    vi.mocked(listCoachees).mockResolvedValue([coachee])
    vi.mocked(getCiclosDeCoachee).mockResolvedValue([cicloConImpacto])

    const wrapper = await mountView()

    expect(wrapper.text()).toContain('QA Paleta Verify')
    expect(wrapper.text()).toContain('Redujo el tiempo de entrega del área en 20%.')
  })

  it('compares competencias contratadas against competencias trabajadas, flagging the ones not yet worked', async () => {
    vi.mocked(listCoachees).mockResolvedValue([coachee])
    vi.mocked(getPlanByCoachee).mockResolvedValue({
      competenciaId: 'comp-1',
      competencia: { id: 'comp-1', nombre: 'Liderazgo' },
    } as never)
    vi.mocked(getMisCompetenciasContratadas).mockResolvedValue([
      { id: 'ec1', empresaId: 'empresa-1', competenciaId: 'comp-1', competencia: { id: 'comp-1', nombre: 'Liderazgo' }, createdAt: '2026-01-01T00:00:00.000Z' },
      { id: 'ec2', empresaId: 'empresa-1', competenciaId: 'comp-2', competencia: { id: 'comp-2', nombre: 'Comunicación' }, createdAt: '2026-01-01T00:00:00.000Z' },
    ])

    const wrapper = await mountView()

    expect(wrapper.text()).toContain('Contratadas/prioritarias para tu equipo')
    expect(wrapper.text()).toContain('Liderazgo')
    expect(wrapper.text()).toContain('Comunicación')
    // "Liderazgo" está siendo trabajado (viene del plan real) -> chip verde; "Comunicación"
    // está contratada pero nadie la trabaja todavía -> chip bronce, para detectar la brecha.
    const chips = wrapper.findAll('span').filter((s) => s.text() === 'Liderazgo' || s.text() === 'Comunicación')
    const liderazgoChip = chips.find((c) => c.text() === 'Liderazgo')!
    const comunicacionChip = chips.find((c) => c.text() === 'Comunicación')!
    expect(liderazgoChip.classes().join(' ')).toContain('sage')
    expect(comunicacionChip.classes().join(' ')).toContain('bronze')
  })

  it('still renders the other coachees when one of them fails to load its ciclos/avance/próxima sesión', async () => {
    // Regresión: antes, un solo coachee cuya llamada de ciclos/avance/próxima sesión
    // rechazara (error transitorio del backend, condición de carrera, etc.) hacía
    // rechazar todo el Promise.all de onMounted y dejaba el Resumen pegado en el
    // skeleton para siempre — sin mostrar ni siquiera el conteo de los demás coachees.
    const coacheeRoto: CoacheeListItem = { ...coachee, id: 'coachee-roto', nombre: 'Coachee Roto' }
    vi.mocked(listCoachees).mockResolvedValue([coachee, coacheeRoto])
    vi.mocked(getCiclosDeCoachee).mockImplementation((coacheeId) =>
      coacheeId === 'coachee-roto'
        ? Promise.reject(new Error('falla transitoria'))
        : Promise.resolve([cicloConImpacto]),
    )

    const wrapper = await mountView()

    // Si el Promise.all hubiera rechazado, loading.value nunca vuelve a false y esto
    // seguiría mostrando el SkeletonBlock en vez del contenido real.
    expect(wrapper.text()).toContain('QA Paleta Verify')
    expect(wrapper.text()).toContain('Redujo el tiempo de entrega del área en 20%.')
  })

  it('avisa cuántas personas no se pudieron cargar y no afirma "Todo al día" ni "Sin sesión agendada" por ellas', async () => {
    const coacheeRoto: CoacheeListItem = { ...coachee, id: 'coachee-roto', nombre: 'Coachee Roto' }
    vi.mocked(listCoachees).mockResolvedValue([coacheeRoto])
    vi.mocked(getCiclosDeCoachee).mockResolvedValue([{ ...cicloPorVencer, alertaPorVencer: false, sesionesRestantes: 5 }])
    vi.mocked(getProximaSesionDeCoachee).mockRejectedValue(new Error('falla transitoria'))

    const wrapper = await mountView()

    expect(wrapper.text()).toContain('No pudimos cargar datos de 1 persona; los indicadores pueden estar incompletos')
    expect(wrapper.text()).not.toContain('Todo al día')
    expect(wrapper.text()).not.toContain('Sin sesión agendada')
    expect(wrapper.text()).toContain('Datos incompletos')
  })

  it('un 404 de "sin plan" no cuenta como fallo de carga', async () => {
    vi.mocked(listCoachees).mockResolvedValue([coachee])
    vi.mocked(getPlanByCoachee).mockRejectedValue(new ApiError(404, 'Plan de desarrollo no encontrado.'))
    vi.mocked(getCiclosDeCoachee).mockResolvedValue([])

    const wrapper = await mountView()

    expect(wrapper.text()).not.toContain('No pudimos cargar datos')
    expect(wrapper.text()).toContain('Todo al día')
  })

  it('muestra ErrorState con Reintentar si falla la carga principal y recarga al reintentar', async () => {
    vi.mocked(listCoachees).mockResolvedValue([])
    vi.mocked(getMisKpis).mockRejectedValueOnce(new Error('sin conexión'))

    const wrapper = await mountView()
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)

    await wrapper.find('[role="alert"] button').trigger('click')
    await flushPromises()

    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('80%')
  })

  it('la alerta es un enlace operable por teclado que dice a dónde lleva', async () => {
    vi.mocked(listCoachees).mockResolvedValue([coachee])
    vi.mocked(getCiclosDeCoachee).mockResolvedValue([cicloPorVencer])

    const wrapper = await mountView()

    const enlace = wrapper.findAll('a').find((a) => a.text().includes('QA Paleta Verify'))
    expect(enlace).toBeDefined()
    expect(enlace!.text()).toContain('Ver progreso')
    expect(enlace!.attributes('href')).toContain('coacheeId=coachee-1')
  })

  it('muestra la nota de confidencialidad y el glosario', async () => {
    vi.mocked(listCoachees).mockResolvedValue([])

    const wrapper = await mountView()

    expect(wrapper.text()).toContain('Qué ve tu empresa y qué no')
    expect(wrapper.text()).toContain('notas privadas de tu coach')
    expect(wrapper.text()).toContain('Glosario')
  })

  it('las barras de competencias son progressbar con valores y la fila se expande desde el botón', async () => {
    vi.mocked(listCoachees).mockResolvedValue([coachee])
    vi.mocked(getPlanByCoachee).mockResolvedValue({
      competenciaId: 'comp-1',
      competencia: { id: 'comp-1', nombre: 'Liderazgo' },
    } as never)

    const wrapper = await mountView()

    const barra = wrapper.find('[role="progressbar"]')
    expect(barra.attributes('aria-valuenow')).toBe('1')
    expect(barra.attributes('aria-valuemax')).toBe('1')
    expect(barra.attributes('aria-label')).toContain('Liderazgo')

    const boton = wrapper.findAll('button').find((b) => b.attributes('aria-expanded') !== undefined)!
    expect(boton.attributes('aria-expanded')).toBe('false')
    await boton.trigger('click')
    expect(boton.attributes('aria-expanded')).toBe('true')
    expect(wrapper.text()).toContain('QA Paleta Verify')
  })
})
