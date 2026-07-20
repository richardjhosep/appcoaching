import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises, DOMWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import UsuariosView from './UsuariosView.vue'
import type { UserAccount } from '../../api/users'
import type { Empresa } from '../../api/empresas'

vi.mock('../../api/users', async () => {
  const actual = await vi.importActual<typeof import('../../api/users')>('../../api/users')
  return { ...actual, listUsers: vi.fn(), createEmpresaUser: vi.fn(), setUserActivo: vi.fn(), resetPassword: vi.fn() }
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

import { listUsers, createEmpresaUser, setUserActivo } from '../../api/users'
import { listEmpresas } from '../../api/empresas'
import { confirmDialog, showCredential } from '../../lib/notify'

const hoyIso = new Date().toISOString()

const empresas: Empresa[] = [
  { id: 'e1', nombre: 'Orbiflex', tarifaHora: 25000, isActive: true, pagada: true, horasContratadas: 10, createdAt: hoyIso },
]

const usuarios: UserAccount[] = [
  { id: 'u1', email: 'coach@example.com', role: 'coach', empresaId: null, mustChangePassword: false, isActive: true, createdAt: hoyIso },
  { id: 'u2', email: 'empresa@example.com', role: 'empresa', empresaId: 'e1', empresa: { id: 'e1', nombre: 'Orbiflex' }, mustChangePassword: true, isActive: false, createdAt: hoyIso },
]

describe('UsuariosView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(listUsers).mockResolvedValue(usuarios)
    vi.mocked(listEmpresas).mockResolvedValue(empresas)
  })

  it('shows the list of usuarios with role and estado', async () => {
    const wrapper = mount(UsuariosView)
    await flushPromises()

    expect(wrapper.text()).toContain('coach@example.com')
    expect(wrapper.text()).toContain('empresa@example.com')
    expect(wrapper.text()).toContain('2 registro(s)')
  })

  it('filters by search text', async () => {
    const wrapper = mount(UsuariosView)
    await flushPromises()

    await wrapper.find('input[type="search"]').setValue('empresa@')
    await flushPromises()

    expect(wrapper.text()).toContain('empresa@example.com')
    expect(wrapper.text()).not.toContain('coach@example.com')
  })

  it('creates an empresa account when the form is valid', async () => {
    vi.mocked(createEmpresaUser).mockResolvedValue({ id: 'u3', email: 'nueva@example.com', role: 'empresa', temporaryPassword: 'temp-pass' })
    const wrapper = mount(UsuariosView)
    await flushPromises()

    const nuevoBtn = wrapper.findAll('button').find((b) => b.text() === '+ Nuevo Usuario')
    await nuevoBtn!.trigger('click')
    await flushPromises()
    const modal = new DOMWrapper(document.body)
    await modal.find('input[type="email"]').setValue('nueva@example.com')
    await modal.find('select').setValue('e1')
    await modal.find('form').trigger('submit')
    await flushPromises()

    expect(createEmpresaUser).toHaveBeenCalledWith('nueva@example.com', 'e1')
    expect(showCredential).toHaveBeenCalledWith('nueva@example.com', 'temp-pass')
  })

  it('toggles estado after confirmation', async () => {
    vi.mocked(setUserActivo).mockResolvedValue({ ...usuarios[0], isActive: false })
    const wrapper = mount(UsuariosView)
    await flushPromises()

    await wrapper.find('button[type="button"]').trigger('click')
    await flushPromises()

    expect(confirmDialog).toHaveBeenCalled()
    expect(setUserActivo).toHaveBeenCalledWith('u1', false)
  })
})
