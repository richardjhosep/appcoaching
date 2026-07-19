import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import AdministracionView from './AdministracionView.vue'
import type { Empresa } from '../../api/empresas'
import type { CoacheeListItem } from '../../api/coachees'
import type { UserAccount } from '../../api/users'

vi.mock('../../api/empresas', async () => {
  const actual = await vi.importActual<typeof import('../../api/empresas')>('../../api/empresas')
  return { ...actual, listEmpresas: vi.fn(), createEmpresa: vi.fn() }
})
vi.mock('../../api/coachees', async () => {
  const actual = await vi.importActual<typeof import('../../api/coachees')>('../../api/coachees')
  return { ...actual, listCoachees: vi.fn(), createCoachee: vi.fn() }
})
vi.mock('../../api/users', async () => {
  const actual = await vi.importActual<typeof import('../../api/users')>('../../api/users')
  return { ...actual, listUsers: vi.fn(), createEmpresaUser: vi.fn(), resetPassword: vi.fn() }
})

import { listEmpresas, createEmpresa } from '../../api/empresas'
import { listCoachees, createCoachee } from '../../api/coachees'
import { listUsers, createEmpresaUser } from '../../api/users'

const empresas: Empresa[] = [
  { id: 'e1', nombre: 'Empresa Uno', tarifaHora: 25000, isActive: true, pagada: true, horasContratadas: 10 },
]

const coachees: CoacheeListItem[] = [
  { id: 'c1', nombre: 'Coachee Uno', empresaId: 'e1', empresa: { id: 'e1', nombre: 'Empresa Uno' }, consentimientoInformado: false, consentimientoFecha: null },
]

const usuarios: UserAccount[] = [
  { id: 'u1', email: 'empresa@example.com', role: 'empresa', empresaId: 'e1', mustChangePassword: true, isActive: true },
]

describe('AdministracionView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(listEmpresas).mockResolvedValue(empresas)
    vi.mocked(listCoachees).mockResolvedValue(coachees)
    vi.mocked(listUsers).mockResolvedValue(usuarios)
  })

  it('shows empresas, coachees and usuarios lists', async () => {
    const wrapper = mount(AdministracionView)
    await flushPromises()

    expect(wrapper.text()).toContain('Empresa Uno')
    expect(wrapper.text()).toContain('Coachee Uno')
    expect(wrapper.text()).toContain('empresa@example.com')
  })

  it('creates an empresa and shows it in the list afterwards', async () => {
    vi.mocked(createEmpresa).mockResolvedValue({ id: 'e2', nombre: 'Empresa Dos', tarifaHora: 30000, isActive: true, pagada: false, horasContratadas: null })
    vi.mocked(listEmpresas).mockResolvedValueOnce(empresas).mockResolvedValueOnce([...empresas, { id: 'e2', nombre: 'Empresa Dos', tarifaHora: 30000, isActive: true, pagada: false, horasContratadas: null }])

    const wrapper = mount(AdministracionView)
    await flushPromises()

    await wrapper.find('input[type="text"]').setValue('Empresa Dos')
    await wrapper.find('input[type="number"]').setValue(30000)
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(createEmpresa).toHaveBeenCalledWith('Empresa Dos', 30000)
    expect(wrapper.text()).toContain('Empresa Dos')
  })

  it('shows the temporary credential banner after creating a coachee', async () => {
    vi.mocked(createCoachee).mockResolvedValue({
      coachee: { id: 'c2', nombre: 'Nuevo Coachee', empresaId: null, consentimientoInformado: false, consentimientoFecha: null },
      temporaryPassword: 'abc123XYZ',
    })

    const wrapper = mount(AdministracionView)
    await flushPromises()

    const inputs = wrapper.findAll('input[type="text"]')
    await inputs[1].setValue('Nuevo Coachee')
    await wrapper.find('input[type="email"]').setValue('nuevo@example.com')
    await wrapper.findAll('form')[1].trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('abc123XYZ')
  })

  it('shows the temporary credential banner after creating an empresa user', async () => {
    vi.mocked(createEmpresaUser).mockResolvedValue({
      id: 'u2',
      email: 'nueva-empresa@example.com',
      role: 'empresa',
      temporaryPassword: 'zyx987ABC',
    })

    const wrapper = mount(AdministracionView)
    await flushPromises()

    await wrapper.findAll('input[type="email"]')[1].setValue('nueva-empresa@example.com')
    await wrapper.findAll('select')[1].setValue('e1')
    await wrapper.findAll('form')[2].trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('zyx987ABC')
  })
})
