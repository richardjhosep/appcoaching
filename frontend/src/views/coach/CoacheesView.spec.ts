import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises, DOMWrapper } from '@vue/test-utils'
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
vi.mock('../../lib/notify', () => ({
  notifySuccess: vi.fn(),
  notifyError: vi.fn(),
  confirmDialog: vi.fn().mockResolvedValue(true),
  showCredential: vi.fn(),
}))

import { listCoachees, createCoachee, setCoacheeActivo } from '../../api/coachees'
import { listEmpresas } from '../../api/empresas'
import { confirmDialog } from '../../lib/notify'

const hoyIso = new Date().toISOString()

const empresas: Empresa[] = [
  { id: 'e1', nombre: 'Orbiflex', tarifaHora: 25000, isActive: true, pagada: true, horasContratadas: 10, createdAt: hoyIso },
]

const coachees: CoacheeListItem[] = [
  { id: 'c1', nombre: 'Ana Soto', empresaId: 'e1', empresa: { id: 'e1', nombre: 'Orbiflex' }, user: { id: 'u1', email: 'ana@example.com' }, activo: true, consentimientoInformado: true, consentimientoFecha: null, createdAt: hoyIso },
  { id: 'c2', nombre: 'Beto Ruiz', empresaId: null, user: { id: 'u2', email: 'beto@example.com' }, activo: false, consentimientoInformado: false, consentimientoFecha: null, createdAt: hoyIso },
]

const router = createRouter({ history: createWebHistory(), routes: [{ path: '/coach/coachees/:id/seguimiento', component: { template: '<div />' } }] })

describe('CoacheesView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(listCoachees).mockResolvedValue(coachees)
    vi.mocked(listEmpresas).mockResolvedValue(empresas)
  })

  it('shows the list of coachees with estado', async () => {
    const wrapper = mount(CoacheesView, { global: { plugins: [router] } })
    await flushPromises()

    expect(wrapper.text()).toContain('Ana Soto')
    expect(wrapper.text()).toContain('Beto Ruiz')
    expect(wrapper.text()).toContain('2 registro(s)')
  })

  it('filters by search text', async () => {
    const wrapper = mount(CoacheesView, { global: { plugins: [router] } })
    await flushPromises()

    await wrapper.find('input[type="search"]').setValue('Beto')
    await flushPromises()

    expect(wrapper.text()).toContain('Beto Ruiz')
    expect(wrapper.text()).not.toContain('Ana Soto')
  })

  it('shows validation errors instead of submitting an invalid coachee', async () => {
    const wrapper = mount(CoacheesView, { global: { plugins: [router] } })
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
    const wrapper = mount(CoacheesView, { global: { plugins: [router] } })
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

  it('toggles estado after confirmation', async () => {
    vi.mocked(setCoacheeActivo).mockResolvedValue({ ...coachees[0], activo: false })
    const wrapper = mount(CoacheesView, { global: { plugins: [router] } })
    await flushPromises()

    await wrapper.find('button[type="button"]').trigger('click')
    await flushPromises()

    expect(confirmDialog).toHaveBeenCalled()
    expect(setCoacheeActivo).toHaveBeenCalledWith('c1', false)
  })
})
