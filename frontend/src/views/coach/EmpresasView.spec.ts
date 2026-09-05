import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises, DOMWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import EmpresasView from './EmpresasView.vue'
import type { Empresa } from '../../api/empresas'

vi.mock('../../api/empresas', async () => {
  const actual = await vi.importActual<typeof import('../../api/empresas')>('../../api/empresas')
  return { ...actual, listEmpresas: vi.fn(), createEmpresa: vi.fn(), updateEmpresa: vi.fn() }
})
vi.mock('../../lib/notify', () => ({
  notifySuccess: vi.fn(),
  notifyError: vi.fn(),
  confirmDialog: vi.fn().mockResolvedValue(true),
}))
vi.mock('../../api/satisfaccion', async () => {
  const actual = await vi.importActual<typeof import('../../api/satisfaccion')>('../../api/satisfaccion')
  return { ...actual, getKpisDeEmpresa: vi.fn(), getEncuestasDeEmpresa: vi.fn() }
})

import { listEmpresas, createEmpresa, updateEmpresa } from '../../api/empresas'
import { notifySuccess, confirmDialog } from '../../lib/notify'
import { getKpisDeEmpresa, getEncuestasDeEmpresa } from '../../api/satisfaccion'
import type { KpisEmpresa, Encuesta } from '../../api/satisfaccion'

const hoyIso = new Date().toISOString()

const empresas: Empresa[] = [
  { id: 'e1', nombre: 'Empresa Activa', tarifaHora: 25000, isActive: true, pagada: true, horasContratadas: 10, fechaInicio: null, fechaFin: null, createdAt: hoyIso },
  { id: 'e2', nombre: 'Empresa Inactiva', tarifaHora: 20000, isActive: false, pagada: false, horasContratadas: null, fechaInicio: null, fechaFin: null, createdAt: hoyIso },
]

describe('EmpresasView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(listEmpresas).mockResolvedValue(empresas)
  })

  it('shows the list of empresas with their estado', async () => {
    const wrapper = mount(EmpresasView)
    await flushPromises()

    expect(wrapper.text()).toContain('Empresa Activa')
    expect(wrapper.text()).toContain('Empresa Inactiva')
    expect(wrapper.text()).toContain('2 registro(s)')
  })

  it('shows the contract end date, or a dash when it is not registered', async () => {
    vi.mocked(listEmpresas).mockResolvedValue([
      { id: 'e1', nombre: 'Con Fecha', tarifaHora: 10000, isActive: true, pagada: true, horasContratadas: null, fechaInicio: null, fechaFin: '2026-12-31', createdAt: hoyIso },
      { id: 'e2', nombre: 'Sin Fecha', tarifaHora: 10000, isActive: true, pagada: true, horasContratadas: null, fechaInicio: null, fechaFin: null, createdAt: hoyIso },
    ])

    const wrapper = mount(EmpresasView)
    await flushPromises()

    const filaConFecha = wrapper.findAll('tr').find((tr) => tr.text().includes('Con Fecha'))!
    expect(filaConFecha.text()).toContain('31-12-2026')

    const filaSinFecha = wrapper.findAll('tr').find((tr) => tr.text().includes('Sin Fecha'))!
    expect(filaSinFecha.text()).toContain('—')
  })

  it('shows empresas created before the current month by default — regresión del filtro de fecha que las ocultaba', async () => {
    vi.mocked(listEmpresas).mockResolvedValue([
      { id: 'e3', nombre: 'Empresa Antigua', tarifaHora: 15000, isActive: true, pagada: true, horasContratadas: null, fechaInicio: null, fechaFin: null, createdAt: '2020-01-01T00:00:00.000Z' },
    ])

    const wrapper = mount(EmpresasView)
    await flushPromises()

    expect(wrapper.text()).toContain('Empresa Antigua')
    expect(wrapper.text()).toContain('1 registro(s)')
  })

  it('filters by search text', async () => {
    const wrapper = mount(EmpresasView)
    await flushPromises()

    await wrapper.find('input[type="search"]').setValue('Inactiva')
    await flushPromises()

    expect(wrapper.text()).toContain('Empresa Inactiva')
    expect(wrapper.text()).not.toContain('Empresa Activa')
  })

  it('shows validation errors instead of submitting an invalid empresa', async () => {
    const wrapper = mount(EmpresasView)
    await flushPromises()

    const nuevaBtn = wrapper.findAll('button').find((b) => b.text() === '+ Nueva Empresa')
    await nuevaBtn!.trigger('click')
    await flushPromises()
    const modal = new DOMWrapper(document.body)
    await modal.find('form').trigger('submit')
    await flushPromises()

    expect(createEmpresa).not.toHaveBeenCalled()
    expect(modal.text()).toContain('El nombre debe tener al menos 2 caracteres.')
  })

  it('creates an empresa when the form is valid', async () => {
    vi.mocked(createEmpresa).mockResolvedValue(empresas[0])
    const wrapper = mount(EmpresasView)
    await flushPromises()

    const nuevaBtn = wrapper.findAll('button').find((b) => b.text() === '+ Nueva Empresa')
    await nuevaBtn!.trigger('click')
    await flushPromises()
    const modal = new DOMWrapper(document.body)
    await modal.find('input[type="text"]').setValue('Empresa Nueva')
    await modal.find('input[type="number"]').setValue(30000)
    await modal.find('form').trigger('submit')
    await flushPromises()

    expect(createEmpresa).toHaveBeenCalledWith('Empresa Nueva', 30000, undefined, undefined)
    expect(notifySuccess).toHaveBeenCalled()
  })

  it('toggles estado after confirmation', async () => {
    vi.mocked(updateEmpresa).mockResolvedValue({ ...empresas[0], isActive: false })
    const wrapper = mount(EmpresasView)
    await flushPromises()

    await wrapper.find('button[type="button"]').trigger('click')
    await flushPromises()

    expect(confirmDialog).toHaveBeenCalled()
    expect(updateEmpresa).toHaveBeenCalledWith('e1', { isActive: false })
  })

  it('opens the satisfacción modal with the kpis and encuestas de esa empresa', async () => {
    const kpis: KpisEmpresa = {
      procesosTerminados: 3,
      procesosEnCurso: 1,
      tasaAsistencia: 90,
      satisfaccionPromedio: 4.5,
    }
    const encuestas: Encuesta[] = [
      {
        id: 'enc-1',
        empresaId: 'e1',
        cicloId: 'ciclo-1',
        respuestas: [{ categoria: 'Comunicación', valor: 5 }],
        calificacion: 5,
        comentario: 'Excelente acompañamiento.',
        createdAt: hoyIso,
        ciclo: { id: 'ciclo-1', fechaCierre: hoyIso, coachee: { id: 'c1', nombre: 'Felipe Cortes' } },
      },
    ]
    vi.mocked(getKpisDeEmpresa).mockResolvedValue(kpis)
    vi.mocked(getEncuestasDeEmpresa).mockResolvedValue(encuestas)

    const wrapper = mount(EmpresasView)
    await flushPromises()

    const verBtn = wrapper.find('button[title="Ver satisfacción"]')
    await verBtn.trigger('click')
    await flushPromises()

    expect(getKpisDeEmpresa).toHaveBeenCalledWith('e1')
    expect(getEncuestasDeEmpresa).toHaveBeenCalledWith('e1')

    const modal = new DOMWrapper(document.body)
    expect(modal.text()).toContain('4.5 ★')
    expect(modal.text()).toContain('90%')
    expect(modal.text()).toContain('Felipe Cortes')
    expect(modal.text()).toContain('Comunicación: 5/5')
    expect(modal.text()).toContain('Excelente acompañamiento.')
  })
})
