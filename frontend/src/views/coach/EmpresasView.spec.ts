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

import { listEmpresas, createEmpresa, updateEmpresa } from '../../api/empresas'
import { notifySuccess, confirmDialog } from '../../lib/notify'

const empresas: Empresa[] = [
  { id: 'e1', nombre: 'Empresa Activa', tarifaHora: 25000, isActive: true, pagada: true, horasContratadas: 10, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'e2', nombre: 'Empresa Inactiva', tarifaHora: 20000, isActive: false, pagada: false, horasContratadas: null, createdAt: '2026-01-02T00:00:00.000Z' },
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

    expect(createEmpresa).toHaveBeenCalledWith('Empresa Nueva', 30000)
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
})
