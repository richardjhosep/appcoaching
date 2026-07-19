import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import RecursosView from './RecursosView.vue'
import type { Recurso } from '../../api/recursos'

vi.mock('../../api/recursos', async () => {
  const actual = await vi.importActual<typeof import('../../api/recursos')>('../../api/recursos')
  return {
    ...actual,
    crearRecurso: vi.fn(),
    listRecursos: vi.fn(),
    removeRecurso: vi.fn(),
    asignarRecurso: vi.fn(),
    getAsignacionesDeRecurso: vi.fn(),
  }
})

vi.mock('../../api/coachees', () => ({
  listCoachees: vi.fn(),
}))

import { listRecursos, getAsignacionesDeRecurso } from '../../api/recursos'
import { listCoachees } from '../../api/coachees'

const recurso: Recurso = {
  id: 'r1',
  titulo: 'Manual de ejercicios',
  descripcion: null,
  etiquetas: ['ejercicios'],
  tipo: 'link',
  url: 'https://example.com',
  archivoNombre: null,
  archivoPath: null,
  createdAt: '2026-01-01T00:00:00.000Z',
}

describe('RecursosView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(listRecursos).mockResolvedValue([recurso])
    vi.mocked(listCoachees).mockResolvedValue([
      {
        id: 'c1',
        nombre: 'Coachee Uno',
        empresaId: null,
        consentimientoInformado: false,
        consentimientoFecha: null,
      },
    ])
    vi.mocked(getAsignacionesDeRecurso).mockResolvedValue([])
  })

  it('lists resources and shows the url-only form when tipo is link', async () => {
    const wrapper = mount(RecursosView)
    await flushPromises()

    expect(wrapper.text()).toContain('Manual de ejercicios')
    expect(wrapper.find('input[type="url"]').exists()).toBe(true)
    expect(wrapper.find('input[type="file"]').exists()).toBe(false)
  })

  it('expands the assignment checklist for a resource on demand', async () => {
    const wrapper = mount(RecursosView)
    await flushPromises()

    const asignarBtn = wrapper
      .findAll('button')
      .find((b) => b.text() === 'Asignar a coachees')
    await asignarBtn!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Coachee Uno')
    expect(getAsignacionesDeRecurso).toHaveBeenCalledWith('r1')
  })
})
