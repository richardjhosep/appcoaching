import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises, DOMWrapper, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import CoacheesView from './CoacheesView.vue'
import type { CoacheeListItem } from '../../api/coachees'
import type { Empresa } from '../../api/empresas'

vi.mock('../../api/coachees', async () => {
  const actual = await vi.importActual<typeof import('../../api/coachees')>('../../api/coachees')
  return { ...actual, listCoachees: vi.fn(), createCoachee: vi.fn(), updateCoachee: vi.fn(), setCoacheeActivo: vi.fn() }
})
vi.mock('../../api/empresas', async () => {
  const actual = await vi.importActual<typeof import('../../api/empresas')>('../../api/empresas')
  return { ...actual, listEmpresas: vi.fn() }
})
vi.mock('../../api/ciclos', () => ({
  abrirCiclo: vi.fn(),
  actualizarTotalSesiones: vi.fn(),
  getCicloActualDeCoachee: vi.fn().mockResolvedValue(null),
}))
vi.mock('../../lib/notify', () => ({
  notifySuccess: vi.fn(),
  notifyError: vi.fn(),
  confirmDialog: vi.fn().mockResolvedValue(true),
}))
vi.mock('../../api/indicadores', () => ({
  getUfHoy: vi.fn().mockResolvedValue({ valorUf: 39000, fecha: '2026-09-12', fuente: 'cmf', desactualizado: false }),
}))

import { listCoachees, createCoachee, updateCoachee, setCoacheeActivo } from '../../api/coachees'
import { listEmpresas } from '../../api/empresas'
import { abrirCiclo, actualizarTotalSesiones, getCicloActualDeCoachee } from '../../api/ciclos'
import { confirmDialog, notifySuccess } from '../../lib/notify'

const hoyIso = new Date().toISOString()

const empresas: Empresa[] = [
  { id: 'e1', nombre: 'Orbiflex', tarifaHora: 25000, tarifaHoraMoneda: 'clp', isActive: true, pagada: true, horasContratadas: 10, horasFijas: false, fechaInicio: null, fechaFin: null, createdAt: hoyIso },
]

const coachees: CoacheeListItem[] = [
  { id: 'c1', nombre: 'Ana Soto', empresaId: 'e1', empresa: { id: 'e1', nombre: 'Orbiflex' }, user: { id: 'u1', email: 'ana@example.com' }, activo: true, consentimientoInformado: true, consentimientoFecha: null, createdAt: hoyIso },
  { id: 'c2', nombre: 'Beto Ruiz', empresaId: null, user: { id: 'u2', email: 'beto@example.com' }, activo: false, consentimientoInformado: false, consentimientoFecha: null, createdAt: hoyIso },
]

const router = createRouter({ history: createWebHistory(), routes: [{ path: '/coach/coachees/:id', component: { template: '<div />' } }] })

describe('CoacheesView', () => {
  let wrapper: VueWrapper

  afterEach(() => {
    // AppModal renders through a Teleport a <body>; sin desmontar, un modal dejado
    // abierto por un test (ej. el de validación fallida, que nunca cierra el modal)
    // queda en el DOM para el siguiente y contamina sus `.find()`.
    wrapper?.unmount()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
    vi.mocked(listCoachees).mockResolvedValue(coachees)
    vi.mocked(listEmpresas).mockResolvedValue(empresas)
  })

  it('shows the list of coachees with estado', async () => {
    wrapper = mount(CoacheesView, { global: { plugins: [router] } })
    await flushPromises()

    expect(wrapper.text()).toContain('Ana Soto')
    expect(wrapper.text()).toContain('Beto Ruiz')
    expect(wrapper.text()).toContain('2 registro(s)')
  })

  it('shows coachees created before the current month by default — regresión del filtro de fecha que los ocultaba', async () => {
    vi.mocked(listCoachees).mockResolvedValue([
      { id: 'c3', nombre: 'Coachee Antiguo', empresaId: null, activo: true, consentimientoInformado: false, consentimientoFecha: null, createdAt: '2020-01-01T00:00:00.000Z' },
    ])

    wrapper = mount(CoacheesView, { global: { plugins: [router] } })
    await flushPromises()

    expect(wrapper.text()).toContain('Coachee Antiguo')
    expect(wrapper.text()).toContain('1 registro(s)')
  })

  it('filters by search text', async () => {
    wrapper = mount(CoacheesView, { global: { plugins: [router] } })
    await flushPromises()

    await wrapper.find('input[type="search"]').setValue('Beto')
    await flushPromises()

    expect(wrapper.text()).toContain('Beto Ruiz')
    expect(wrapper.text()).not.toContain('Ana Soto')
  })

  it('shows validation errors instead of submitting an invalid coachee', async () => {
    wrapper = mount(CoacheesView, { global: { plugins: [router] } })
    await flushPromises()

    const nuevoBtn = wrapper.findAll('button').find((b) => b.text() === '+ Nuevo Coachee')
    await nuevoBtn!.trigger('click')
    await flushPromises()
    const modal = new DOMWrapper(document.body)
    await modal.find('form').trigger('submit')
    await flushPromises()

    expect(createCoachee).not.toHaveBeenCalled()
    expect(modal.text()).toContain('El nombre debe tener al menos 2 caracteres.')
  })

  it('creates a coachee when the form is valid', async () => {
    vi.mocked(createCoachee).mockResolvedValue({ coachee: coachees[0], temporaryPassword: null })
    wrapper = mount(CoacheesView, { global: { plugins: [router] } })
    await flushPromises()

    const nuevoBtn = wrapper.findAll('button').find((b) => b.text() === '+ Nuevo Coachee')
    await nuevoBtn!.trigger('click')
    await flushPromises()
    const modal = new DOMWrapper(document.body)
    await modal.find('input[type="text"]').setValue('Carla Nueva')
    await modal.find('input[type="email"]').setValue('carla@example.com')
    await modal.find('form').trigger('submit')
    await flushPromises()

    expect(createCoachee).toHaveBeenCalledWith(expect.objectContaining({ nombre: 'Carla Nueva', email: 'carla@example.com' }))
  })

  it('creates a coachee with cargo and opens its ciclo with the número de sesiones', async () => {
    vi.mocked(createCoachee).mockResolvedValue({ coachee: { ...coachees[0], id: 'nuevo' }, temporaryPassword: null })
    wrapper = mount(CoacheesView, { global: { plugins: [router] } })
    await flushPromises()

    const nuevoBtn = wrapper.findAll('button').find((b) => b.text() === '+ Nuevo Coachee')
    await nuevoBtn!.trigger('click')
    await flushPromises()
    const modal = new DOMWrapper(document.body)
    await modal.find('input[type="text"]').setValue('Carla Nueva')
    await modal.find('input[type="email"]').setValue('carla@example.com')
    await modal.find('input[placeholder="Ej. Jefe de Mantención"]').setValue('Jefa de Planta')
    await modal.find('input[placeholder="Ej. 8"]').setValue(6)
    await modal.find('form').trigger('submit')
    await flushPromises()

    expect(createCoachee).toHaveBeenCalledWith(expect.objectContaining({ cargo: 'Jefa de Planta' }))
    expect(abrirCiclo).toHaveBeenCalledWith('nuevo', 6)
  })

  it('edits the total of the open ciclo instead of opening a new one', async () => {
    vi.mocked(getCicloActualDeCoachee).mockResolvedValueOnce({ id: 'ciclo-1', totalSesiones: 8 } as never)
    vi.mocked(updateCoachee).mockResolvedValue(coachees[0] as never)
    wrapper = mount(CoacheesView, { global: { plugins: [router] } })
    await flushPromises()

    await wrapper.find('button[title="Editar"]').trigger('click')
    await flushPromises()
    const modal = new DOMWrapper(document.body)
    const sesiones = modal.find('input[placeholder="Ej. 8"]')
    expect((sesiones.element as HTMLInputElement).value).toBe('8')
    await sesiones.setValue(10)
    await modal.find('form').trigger('submit')
    await flushPromises()

    expect(abrirCiclo).not.toHaveBeenCalled()
    expect(actualizarTotalSesiones).toHaveBeenCalledWith('ciclo-1', 10)
  })

  it('creates a coachee with a tarifa propia in UF', async () => {
    vi.mocked(createCoachee).mockResolvedValue({ coachee: coachees[0], temporaryPassword: null })
    wrapper = mount(CoacheesView, { global: { plugins: [router] } })
    await flushPromises()

    const nuevoBtn = wrapper.findAll('button').find((b) => b.text() === '+ Nuevo Coachee')
    await nuevoBtn!.trigger('click')
    await flushPromises()
    const modal = new DOMWrapper(document.body)
    await modal.find('input[type="text"]').setValue('Carla Nueva')
    await modal.find('input[type="email"]').setValue('carla@example.com')
    await modal.find('input[type="number"]').setValue(3.5)
    // El último <select> del documento es el de moneda de TarifaInput — los anteriores
    // son los filtros de la página y el de Empresa del propio formulario.
    const selects = modal.findAll('select')
    await selects[selects.length - 1].setValue('uf')
    await modal.find('form').trigger('submit')
    await flushPromises()

    expect(createCoachee).toHaveBeenCalledWith(
      expect.objectContaining({ tarifaPropia: 3.5, tarifaPropiaMoneda: 'uf' }),
    )
  })

  it('confirms by email instead of showing the password on screen when one was generated', async () => {
    vi.mocked(createCoachee).mockResolvedValue({ coachee: coachees[0], temporaryPassword: 'temp-pass' })
    wrapper = mount(CoacheesView, { global: { plugins: [router] } })
    await flushPromises()

    const nuevoBtn = wrapper.findAll('button').find((b) => b.text() === '+ Nuevo Coachee')
    await nuevoBtn!.trigger('click')
    await flushPromises()
    const modal = new DOMWrapper(document.body)
    await modal.find('input[type="text"]').setValue('Carla Nueva')
    await modal.find('input[type="email"]').setValue('carla@example.com')
    await modal.find('form').trigger('submit')
    await flushPromises()

    expect(notifySuccess).toHaveBeenCalledWith(
      'Coachee creado',
      expect.stringContaining('carla@example.com') as string,
    )
    expect(wrapper.text()).not.toContain('temp-pass')
  })

  it('toggles estado after confirmation', async () => {
    vi.mocked(setCoacheeActivo).mockResolvedValue({ ...coachees[0], activo: false })
    wrapper = mount(CoacheesView, { global: { plugins: [router] } })
    await flushPromises()

    await wrapper.find('button[type="button"]').trigger('click')
    await flushPromises()

    expect(confirmDialog).toHaveBeenCalled()
    expect(setCoacheeActivo).toHaveBeenCalledWith('c1', false)
  })
})
