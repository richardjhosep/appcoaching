import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from './DashboardView.vue'
import type { ResumenNegocio, Alertas } from '../../api/negocio'
import type { ResumenLegal } from '../../api/legal'
import type { PlanDesarrollo } from '../../api/planesDesarrollo'

vi.mock('../../api/negocio', async () => {
  const actual = await vi.importActual<typeof import('../../api/negocio')>('../../api/negocio')
  return {
    ...actual,
    getResumenNegocio: vi.fn(),
    getAlertas: vi.fn(),
    enviarRecordatorioSesion: vi.fn(),
    enviarRecordatorioLogro: vi.fn(),
  }
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

import { getResumenNegocio, getAlertas, enviarRecordatorioSesion, enviarRecordatorioLogro } from '../../api/negocio'
import { listPlanes, enviarRecordatorio } from '../../api/planesDesarrollo'
import { getSolicitudes } from '../../api/satisfaccion'
import { listCoachees } from '../../api/coachees'
import { getResumenLegal } from '../../api/legal'
import { notifySuccess, notifyError } from '../../lib/notify'

const resumen: ResumenNegocio = {
  porEmpresa: [],
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

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/coach/legal', component: { template: '<div />' } },
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

    const recordarPlanBtn = fila.findAll('button').find((b) => b.text().includes('Recordar plan'))!
    await recordarPlanBtn.trigger('click')
    await flushPromises()
    expect(enviarRecordatorio).toHaveBeenCalledWith('c1')

    const recordarSesionBtn = fila.findAll('button').find((b) => b.text().includes('Recordar sesión'))!
    await recordarSesionBtn.trigger('click')
    await flushPromises()
    expect(enviarRecordatorioSesion).toHaveBeenCalledWith('c1')

    expect(notifySuccess).toHaveBeenCalledTimes(2)
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
})
