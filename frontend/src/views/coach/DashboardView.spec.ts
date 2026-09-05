import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises, DOMWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from './DashboardView.vue'
import type {
  ResumenNegocio,
  Alertas,
  ResumenCartera,
  ResumenComercial,
  AtencionInmediata,
  ComparativoYCapacidad,
} from '../../api/negocio'
import type { ResumenLegal } from '../../api/legal'
import type { PlanDesarrollo } from '../../api/planesDesarrollo'
import type { GestionRenovacion } from '../../api/empresas'

vi.mock('../../api/negocio', async () => {
  const actual = await vi.importActual<typeof import('../../api/negocio')>('../../api/negocio')
  return {
    ...actual,
    getResumenNegocio: vi.fn(),
    getAlertas: vi.fn(),
    getCarteraEmpresas: vi.fn(),
    getResumenComercial: vi.fn(),
    getProyeccionMensual: vi.fn(),
    getAtencionInmediata: vi.fn(),
    getComparativo: vi.fn(),
    enviarRecordatorioSesion: vi.fn(),
    enviarRecordatorioLogro: vi.fn(),
  }
})
vi.mock('../../api/empresas', async () => {
  const actual = await vi.importActual<typeof import('../../api/empresas')>('../../api/empresas')
  return { ...actual, crearGestion: vi.fn(), getGestionDeEmpresa: vi.fn() }
})
vi.mock('../../api/sesiones', async () => {
  const actual = await vi.importActual<typeof import('../../api/sesiones')>('../../api/sesiones')
  return { ...actual, getSesionesSemana: vi.fn() }
})
vi.mock('../../api/planesDesarrollo', async () => {
  const actual = await vi.importActual<typeof import('../../api/planesDesarrollo')>('../../api/planesDesarrollo')
  return { ...actual, listPlanes: vi.fn(), enviarRecordatorio: vi.fn() }
})
vi.mock('../../api/satisfaccion', async () => {
  const actual = await vi.importActual<typeof import('../../api/satisfaccion')>('../../api/satisfaccion')
  return { ...actual, getSolicitudes: vi.fn() }
})
vi.mock('../../api/coachees', async () => {
  const actual = await vi.importActual<typeof import('../../api/coachees')>('../../api/coachees')
  return { ...actual, listCoachees: vi.fn() }
})
vi.mock('../../api/legal', async () => {
  const actual = await vi.importActual<typeof import('../../api/legal')>('../../api/legal')
  return { ...actual, getResumenLegal: vi.fn() }
})
vi.mock('../../lib/notify', () => ({
  notifySuccess: vi.fn(),
  notifyError: vi.fn(),
}))

import {
  getResumenNegocio,
  getAlertas,
  getCarteraEmpresas,
  getResumenComercial,
  getProyeccionMensual,
  getAtencionInmediata,
  getComparativo,
  enviarRecordatorioSesion,
  enviarRecordatorioLogro,
} from '../../api/negocio'
import { crearGestion, getGestionDeEmpresa } from '../../api/empresas'
import { listPlanes, enviarRecordatorio } from '../../api/planesDesarrollo'
import { getSolicitudes } from '../../api/satisfaccion'
import { listCoachees } from '../../api/coachees'
import { getResumenLegal } from '../../api/legal'
import { getSesionesSemana } from '../../api/sesiones'
import { notifySuccess, notifyError } from '../../lib/notify'

const resumen: ResumenNegocio = {
  porEmpresa: [],
  porCoachee: [],
  horasRealizadasTotal: 1,
  ingresoDelPeriodoTotal: 0,
  ingresoProyectadoTotal: 0,
  coacheesActivos: 5,
  satisfaccionPromedio: 4.5,
}

const alertasVacias: Alertas = {
  ciclosPorVencer: [],
  coacheesSinLogros: [],
  coacheesSinProximaSesion: [],
}

const resumenLegalVacio: ResumenLegal = { empresas: [], independientes: [] }

const carteraVacia: ResumenCartera = { empresas: [], independientesPorVencer: [] }

const atencionVacia: AtencionInmediata = {
  sesionesSinConfirmar: [],
  contratosUrgentes: [],
  pagosPendientes: [],
}

const comparativoBase: ComparativoYCapacidad = {
  ingresoMesActual: 0,
  ingresoMesAnterior: 0,
  variacionIngresoPct: null,
  coachingsIniciadosMesActual: 0,
  coachingsIniciadosMesAnterior: 0,
  horasComprometidasSemana: 0,
  horasDisponiblesSemana: 20,
}

const comercialVacio: ResumenComercial = {
  periodo: 'mes',
  ingresoDelPeriodo: 0,
  ingresoProyectado: 0,
  horasRealizadas: 0,
  solicitudesNuevas: 0,
  solicitudesAtendidas: 0,
  solicitudesPendientes: 0,
  procesosIniciados: 0,
  procesosCerrados: 0,
  procesosCerradosPorResultado: { logrado: 0, medianamente_logrado: 0, no_logrado: 0 },
  reagendamientosSolicitados: 0,
  porCoachee: [],
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/coach/legal', component: { template: '<div />' } },
    { path: '/coach/agenda', component: { template: '<div />' } },
    { path: '/coach/negocio', component: { template: '<div />' } },
    { path: '/coach/coachees/:coacheeId', name: 'coach-coachee-detail', component: { template: '<div />' } },
  ],
})

describe('DashboardView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getResumenNegocio).mockResolvedValue(resumen)
    vi.mocked(getAlertas).mockResolvedValue(alertasVacias)
    vi.mocked(listPlanes).mockResolvedValue([])
    vi.mocked(getSolicitudes).mockResolvedValue([])
    vi.mocked(listCoachees).mockResolvedValue([{ id: 'c1', nombre: 'Rodrigo Peña', empresaId: null, consentimientoInformado: true, consentimientoFecha: null }])
    vi.mocked(getResumenLegal).mockResolvedValue(resumenLegalVacio)
    vi.mocked(getCarteraEmpresas).mockResolvedValue(carteraVacia)
    vi.mocked(getResumenComercial).mockResolvedValue(comercialVacio)
    vi.mocked(getProyeccionMensual).mockResolvedValue([])
    vi.mocked(getSesionesSemana).mockResolvedValue([])
    vi.mocked(getAtencionInmediata).mockResolvedValue(atencionVacia)
    vi.mocked(getComparativo).mockResolvedValue(comparativoBase)
    vi.mocked(getGestionDeEmpresa).mockResolvedValue([])
    vi.mocked(enviarRecordatorio).mockResolvedValue(undefined)
    vi.mocked(enviarRecordatorioSesion).mockResolvedValue({ success: true })
    vi.mocked(enviarRecordatorioLogro).mockResolvedValue({ success: true })
  })

  it('shows "Todo al día" in the Coachees tab when nothing needs attention', async () => {
    const wrapper = mount(DashboardView, { global: { plugins: [router] } })
    await flushPromises()

    expect(wrapper.text()).toContain('Coachees (0)')
    expect(wrapper.text()).toContain('Todo al día')
  })

  it('merges a coachee needing multiple things into one row and lets you send both reminders', async () => {
    const planSinEnviar: PlanDesarrollo = {
      id: 'p1',
      coacheeId: 'c1',
      coachee: { id: 'c1', nombre: 'Rodrigo Peña', telefono: null, createdAt: '2026-01-01T00:00:00.000Z' },
      competenciaId: null,
      nivelActual: null,
      nivelObjetivo: null,
      plazo: null,
      descripcionEstadoActual: null,
      objetivoGeneral: null,
      estado: 'sin_enviar',
      enviadoEn: null,
      comentarioCoach: null,
      habitoCuando: null,
      habitoEnVezDe: null,
      updatedAt: '2026-01-01T00:00:00.000Z',
    } as PlanDesarrollo

    vi.mocked(listPlanes).mockImplementation((estado) =>
      Promise.resolve(estado === 'sin_enviar' ? [planSinEnviar] : []),
    )
    vi.mocked(getAlertas).mockResolvedValue({
      ciclosPorVencer: [],
      coacheesSinLogros: [],
      coacheesSinProximaSesion: [{ coacheeId: 'c1', nombre: 'Rodrigo Peña' }],
    })

    const wrapper = mount(DashboardView, { global: { plugins: [router] } })
    await flushPromises()

    expect(wrapper.text()).toContain('Coachees (1)')
    const rows = wrapper.findAll('li')
    const fila = rows.find((r) => r.text().includes('Rodrigo Peña'))!
    expect(fila.text()).toContain('Plan sin enviar')
    expect(fila.text()).toContain('Sin próxima sesión')

    // "Sin próxima sesión" es lo más urgente (danger) → queda como acción primaria con botón.
    const recordarSesionBtn = fila.findAll('button').find((b) => b.text().includes('Recordar sesión'))!
    await recordarSesionBtn.trigger('click')
    await flushPromises()
    expect(enviarRecordatorioSesion).toHaveBeenCalledWith('c1')

    // "Plan sin enviar" queda como recordatorio secundario compacto: el propio texto es el botón.
    const planSinEnviarBtn = fila.findAll('button').find((b) => b.text().trim() === 'Plan sin enviar')!
    await planSinEnviarBtn.trigger('click')
    await flushPromises()
    expect(enviarRecordatorio).toHaveBeenCalledWith('c1')

    expect(notifySuccess).toHaveBeenCalledTimes(2)
  })

  it('shows initials, empresa (or Independiente) and what the coachee owes/generated this period', async () => {
    vi.mocked(listCoachees).mockResolvedValue([
      { id: 'c1', nombre: 'Rodrigo Peña', empresaId: 'e1', empresa: { id: 'e1', nombre: 'Andes Minerals' }, consentimientoInformado: true, consentimientoFecha: null },
      { id: 'c2', nombre: 'Ana Reagenda', empresaId: null, consentimientoInformado: true, consentimientoFecha: null },
    ])
    vi.mocked(getAlertas).mockResolvedValue({
      ciclosPorVencer: [],
      coacheesSinLogros: [
        { coacheeId: 'c1', nombre: 'Rodrigo Peña' },
        { coacheeId: 'c2', nombre: 'Ana Reagenda' },
      ],
      coacheesSinProximaSesion: [],
    })
    vi.mocked(getResumenNegocio).mockResolvedValue({
      ...resumen,
      porEmpresa: [{ empresaId: 'e1', nombre: 'Andes Minerals', pagada: false, horasContratadas: null, horasConsumidas: 1, ingresoDelPeriodo: 50000, ingresoProyectado: 0 }],
      porCoachee: [
        { coacheeId: 'c1', nombre: 'Rodrigo Peña', empresaNombre: 'Andes Minerals', horasRealizadas: 1, ingresoDelPeriodo: 50000, ingresoProyectado: 0 },
        { coacheeId: 'c2', nombre: 'Ana Reagenda', empresaNombre: null, horasRealizadas: 1, ingresoDelPeriodo: 45000, ingresoProyectado: 0 },
      ],
    })

    const wrapper = mount(DashboardView, { global: { plugins: [router] } })
    await flushPromises()

    expect(wrapper.text()).toContain('RP') // iniciales de "Rodrigo Peña"

    const filaRodrigo = wrapper.findAll('li').find((r) => r.text().includes('Rodrigo Peña'))!
    expect(filaRodrigo.text()).toContain('Andes Minerals')
    expect(filaRodrigo.text()).toContain('$50.000 sin pagar') // empresa marcada como no pagada

    const filaAna = wrapper.findAll('li').find((r) => r.text().includes('Ana Reagenda'))!
    expect(filaAna.text()).toContain('Independiente')
    expect(filaAna.text()).toContain('$45.000 este mes') // independiente: ingreso confirmado, sin concepto de "deuda"
  })

  it('shows an error toast when a reminder fails to send', async () => {
    vi.mocked(getAlertas).mockResolvedValue({
      ciclosPorVencer: [],
      coacheesSinLogros: [{ coacheeId: 'c1', nombre: 'Rodrigo Peña' }],
      coacheesSinProximaSesion: [],
    })
    vi.mocked(enviarRecordatorioLogro).mockRejectedValue(new Error('boom'))

    const wrapper = mount(DashboardView, { global: { plugins: [router] } })
    await flushPromises()

    const recordarLogroBtn = wrapper.findAll('button').find((b) => b.text().includes('Recordar progreso'))!
    await recordarLogroBtn.trigger('click')
    await flushPromises()

    expect(notifyError).toHaveBeenCalled()
  })

  it('lists empresas with contrato/NDA pendiente in the Empresas tab', async () => {
    vi.mocked(getResumenLegal).mockResolvedValue({
      empresas: [
        {
          empresaId: 'e1',
          nombre: 'Andes Minerals',
          contrato: { estado: 'pendiente', fecha: null, vigencia: null, tieneArchivo: false },
          nda: { estado: 'firmado', fecha: '2026-01-01', vigencia: '2099-01-01', tieneArchivo: true },
          coacheesConConsentimiento: 1,
          coacheesTotal: 1,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      independientes: [],
    })

    const wrapper = mount(DashboardView, { global: { plugins: [router] } })
    await flushPromises()

    const empresasTabBtn = wrapper.findAll('button').find((b) => b.text().startsWith('Empresas ('))
    expect(empresasTabBtn!.text()).toContain('Empresas (1)')

    await empresasTabBtn!.trigger('click')
    await flushPromises()

    const text = wrapper.text()
    expect(text).toContain('Andes Minerals')
    expect(text).toContain('Contrato')
    expect(text).not.toContain('NDA pendiente')
  })

  it('shows solicitudes comerciales in their own tab', async () => {
    vi.mocked(getSolicitudes).mockResolvedValue([
      { id: 's1', empresaId: 'e1', nombreSugerido: 'Nuevo Coachee', mensaje: '', estado: 'pendiente', createdAt: '2026-01-01T00:00:00.000Z', empresa: { id: 'e1', nombre: 'Andes Minerals' } },
    ])

    const wrapper = mount(DashboardView, { global: { plugins: [router] } })
    await flushPromises()

    const solicitudesTabBtn = wrapper.findAll('button').find((b) => b.text().startsWith('Solicitudes comerciales ('))
    await solicitudesTabBtn!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Nuevo Coachee')
    expect(wrapper.text()).toContain('Andes Minerals')
  })

  describe('buscador de coachees', () => {
    beforeEach(() => {
      vi.mocked(listCoachees).mockResolvedValue([
        { id: 'c1', nombre: 'Rodrigo Peña', empresaId: null, consentimientoInformado: true, consentimientoFecha: null },
        { id: 'c2', nombre: 'Ana Reagenda', empresaId: 'e1', empresa: { id: 'e1', nombre: 'Andes Minerals' }, consentimientoInformado: true, consentimientoFecha: null },
      ])
    })

    it('finds a coachee by a partial, accent-insensitive match and lets you jump to their profile', async () => {
      const wrapper = mount(DashboardView, { global: { plugins: [router] } })
      await flushPromises()

      const buscador = wrapper.find('input[type="search"]')
      await buscador.setValue('reagenda')
      await buscador.trigger('focus')
      await flushPromises()

      expect(wrapper.text()).toContain('Ana Reagenda')
      expect(wrapper.text()).toContain('Andes Minerals')

      const resultado = wrapper.findAll('button').find((b) => b.text().includes('Ana Reagenda'))!
      await resultado.trigger('mousedown')
      await flushPromises()

      expect(router.currentRoute.value.name).toBe('coach-coachee-detail')
      expect(router.currentRoute.value.params.coacheeId).toBe('c2')
    })

    it('shows a muted "no matches" message instead of the whole list when nothing matches', async () => {
      const wrapper = mount(DashboardView, { global: { plugins: [router] } })
      await flushPromises()

      const buscador = wrapper.find('input[type="search"]')
      await buscador.setValue('zzzz')
      await buscador.trigger('focus')
      await flushPromises()

      expect(wrapper.text()).toContain('Sin coincidencias')
      expect(wrapper.text()).not.toContain('Andes Minerals')
    })

    it('does not show a dropdown while the search box is empty', async () => {
      const wrapper = mount(DashboardView, { global: { plugins: [router] } })
      await flushPromises()

      await wrapper.find('input[type="search"]').trigger('focus')
      await flushPromises()

      expect(wrapper.text()).not.toContain('Sin coincidencias')
    })
  })

  describe('Esta semana', () => {
    it('shows an empty state when there are no sessions this week', async () => {
      const wrapper = mount(DashboardView, { global: { plugins: [router] } })
      await flushPromises()

      expect(wrapper.text()).toContain('No tienes sesiones agendadas esta semana.')
    })

    it('lists sessions with the coachee and empresa name', async () => {
      vi.mocked(getSesionesSemana).mockResolvedValue([
        {
          id: 's1',
          coacheeId: 'c1',
          fechaHora: '2026-09-07T13:00:00.000Z',
          linkVideollamada: null,
          resumenCompartido: null,
          confirmada: true,
          postSesion: null,
          coachee: { id: 'c1', nombre: 'Rodrigo Peña', empresa: { id: 'e1', nombre: 'Andes Minerals' } },
        },
      ])

      const wrapper = mount(DashboardView, { global: { plugins: [router] } })
      await flushPromises()

      expect(wrapper.text()).toContain('Rodrigo Peña')
      expect(wrapper.text()).toContain('Andes Minerals')
    })

    it('shows a "Sin confirmar" badge on a session the coachee has not confirmed', async () => {
      vi.mocked(getSesionesSemana).mockResolvedValue([
        {
          id: 's1',
          coacheeId: 'c1',
          fechaHora: '2026-09-07T13:00:00.000Z',
          linkVideollamada: null,
          resumenCompartido: null,
          confirmada: false,
          postSesion: null,
          coachee: { id: 'c1', nombre: 'Rodrigo Peña', empresa: null },
        },
      ])

      const wrapper = mount(DashboardView, { global: { plugins: [router] } })
      await flushPromises()

      expect(wrapper.text()).toContain('Sin confirmar')
    })
  })

  describe('KPI de horas', () => {
    it('shows horas comprometidas/disponibles from el comparativo', async () => {
      vi.mocked(getComparativo).mockResolvedValue({ ...comparativoBase, horasComprometidasSemana: 6, horasDisponiblesSemana: 20 })

      const wrapper = mount(DashboardView, { global: { plugins: [router] } })
      await flushPromises()

      expect(wrapper.text()).toContain('Horas esta semana')
      expect(wrapper.text()).toMatch(/6\/20\s*hrs/)
    })
  })

  describe('Cartera de empresas', () => {
    it('shows each empresa with its estado, sorted by urgency (vencido/este mes first)', async () => {
      vi.mocked(getCarteraEmpresas).mockResolvedValue({
        empresas: [
          {
            empresaId: 'e-vigente',
            nombre: 'Vigente SA',
            fechaFin: '2027-01-01',
            pagada: true,
            horasContratadas: 10,
            horasConsumidasEsteMes: 2,
            estado: 'vigente',
            diasParaVencer: 300,
            ultimaGestion: null,
          },
          {
            empresaId: 'e-vencida',
            nombre: 'Vencida SA',
            fechaFin: '2026-01-01',
            pagada: true,
            horasContratadas: 10,
            horasConsumidasEsteMes: 2,
            estado: 'vencido',
            diasParaVencer: -30,
            ultimaGestion: null,
          },
        ],
        independientesPorVencer: [],
      })

      const wrapper = mount(DashboardView, { global: { plugins: [router] } })
      await flushPromises()

      const filas = wrapper.findAll('li').map((li) => li.text())
      const idxVencida = filas.findIndex((t) => t.includes('Vencida SA'))
      const idxVigente = filas.findIndex((t) => t.includes('Vigente SA'))
      expect(idxVencida).toBeGreaterThanOrEqual(0)
      expect(idxVigente).toBeGreaterThan(idxVencida)
      expect(wrapper.text()).toContain('Vencido')
      expect(wrapper.text()).toContain('Vigente')
    })

    it('flags an empresa without a fechaFin as needing the date completed', async () => {
      vi.mocked(getCarteraEmpresas).mockResolvedValue({
        empresas: [
          {
            empresaId: 'e-sin-fecha',
            nombre: 'Sin Fecha SA',
            fechaFin: null,
            pagada: true,
            horasContratadas: null,
            horasConsumidasEsteMes: 0,
            estado: 'sin_fecha',
            diasParaVencer: null,
            ultimaGestion: null,
          },
        ],
        independientesPorVencer: [],
      })

      const wrapper = mount(DashboardView, { global: { plugins: [router] } })
      await flushPromises()

      expect(wrapper.text()).toContain('Sin Fecha SA');
      expect(wrapper.text()).toContain('Sin fecha registrada');
      expect(wrapper.text()).toMatch(/Empresas sin fecha de contrato\s*1/);
    })

    it('lists independientes whose ciclo is about to expire', async () => {
      vi.mocked(getCarteraEmpresas).mockResolvedValue({
        empresas: [],
        independientesPorVencer: [{ coacheeId: 'c9', nombre: 'Coachee Suelto', sesionesRestantes: 1 }],
      })

      const wrapper = mount(DashboardView, { global: { plugins: [router] } })
      await flushPromises()

      expect(wrapper.text()).toContain('Coachee Suelto')
      expect(wrapper.text()).toContain('1 sesiones restantes')
    })

    it('opens the gestión modal, loads its historial, and submits a new entry', async () => {
      vi.mocked(getCarteraEmpresas).mockResolvedValue({
        empresas: [
          {
            empresaId: 'e1',
            nombre: 'Andes Minerals',
            fechaFin: '2026-01-01',
            pagada: true,
            horasContratadas: 10,
            horasConsumidasEsteMes: 2,
            estado: 'vencido',
            diasParaVencer: -5,
            ultimaGestion: null,
          },
        ],
        independientesPorVencer: [],
      })
      const gestionExistente: GestionRenovacion = {
        id: 'g1',
        empresaId: 'e1',
        nota: 'Se conversó por teléfono',
        proximoSeguimiento: null,
        createdAt: '2026-08-01T00:00:00.000Z',
      }
      vi.mocked(getGestionDeEmpresa).mockResolvedValue([gestionExistente])
      vi.mocked(crearGestion).mockResolvedValue({ ...gestionExistente, id: 'g2', nota: 'Nueva nota' })

      const wrapper = mount(DashboardView, { global: { plugins: [router] } })
      await flushPromises()

      const gestionarBtn = wrapper.findAll('button').find((b) => b.text() === 'Gestionar')!
      await gestionarBtn.trigger('click')
      await flushPromises()

      const modal = new DOMWrapper(document.body)
      expect(modal.text()).toContain('Se conversó por teléfono')

      await modal.find('textarea').setValue('Nueva nota')
      const guardarBtn = modal.findAll('button').find((b) => b.text().includes('Registrar gestión'))!
      await guardarBtn.trigger('click')
      await flushPromises()

      expect(crearGestion).toHaveBeenCalledWith('e1', 'Nueva nota', undefined)
      expect(notifySuccess).toHaveBeenCalledWith('Gestión registrada')
    })
  })

  describe('Atención inmediata', () => {
    it('shows a "nada urgente" message when the 3 lists are empty', async () => {
      const wrapper = mount(DashboardView, { global: { plugins: [router] } })
      await flushPromises()

      expect(wrapper.text()).toContain('Atención inmediata')
      expect(wrapper.text()).toContain('Nada urgente ahora mismo')
    })

    it('lists sesiones sin confirmar, contratos urgentes and pagos pendientes, each with its action', async () => {
      vi.mocked(getAtencionInmediata).mockResolvedValue({
        sesionesSinConfirmar: [{ sesionId: 's1', coacheeId: 'c1', nombre: 'Rodrigo Peña', fechaHora: '2026-09-07T13:00:00.000Z' }],
        contratosUrgentes: [{ empresaId: 'e1', nombre: 'Andes Minerals', diasParaVencer: 5, ultimaGestion: null }],
        pagosPendientes: [{ empresaId: 'e2', nombre: 'Empresa Impaga', gastoDelPeriodo: 30000 }],
      })

      const wrapper = mount(DashboardView, { global: { plugins: [router] } })
      await flushPromises()

      expect(wrapper.text()).toContain('Sesiones sin confirmar')
      expect(wrapper.text()).toContain('Rodrigo Peña')
      expect(wrapper.text()).toContain('Contratos por vencer sin gestión')
      expect(wrapper.text()).toContain('vence en 5 días')
      expect(wrapper.text()).toContain('Pagos pendientes')
      expect(wrapper.text()).toContain('$30.000')

      const verCoacheeBtn = wrapper.findAll('button').find((b) => b.text() === 'Ver coachee')!
      await verCoacheeBtn.trigger('click')
      await flushPromises()
      expect(router.currentRoute.value.name).toBe('coach-coachee-detail')
      expect(router.currentRoute.value.params.coacheeId).toBe('c1')
    })
  })

  describe('Proyección económica', () => {
    it('shows the variación vs. mes anterior next to Ingreso del mes', async () => {
      vi.mocked(getComparativo).mockResolvedValue({ ...comparativoBase, variacionIngresoPct: 12.5 })

      const wrapper = mount(DashboardView, { global: { plugins: [router] } })
      await flushPromises()

      expect(wrapper.text()).toContain('↑ 12.5% vs. mes anterior')
    })

    it('shows a down arrow when ingreso fell vs. mes anterior', async () => {
      vi.mocked(getComparativo).mockResolvedValue({ ...comparativoBase, variacionIngresoPct: -8 })

      const wrapper = mount(DashboardView, { global: { plugins: [router] } })
      await flushPromises()

      expect(wrapper.text()).toContain('↓ 8% vs. mes anterior')
    })
  })
})
