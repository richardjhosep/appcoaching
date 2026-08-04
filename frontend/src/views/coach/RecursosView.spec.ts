import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises, DOMWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import RecursosView from './RecursosView.vue'
import type { Carpeta } from '../../api/carpetas'
import type { Recurso } from '../../api/recursos'

vi.mock('../../api/carpetas', async () => {
  const actual = await vi.importActual<typeof import('../../api/carpetas')>('../../api/carpetas')
  return {
    ...actual,
    listCarpetas: vi.fn(),
    crearCarpeta: vi.fn(),
    renombrarCarpeta: vi.fn(),
    setCarpetaPublica: vi.fn(),
    removeCarpeta: vi.fn(),
    asignarCarpeta: vi.fn(),
    getAsignacionesDeCarpeta: vi.fn(),
    revocarCarpeta: vi.fn(),
  }
})

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

vi.mock('../../lib/notify', () => ({
  notifySuccess: vi.fn(),
  notifyError: vi.fn(),
  confirmDialog: vi.fn().mockResolvedValue(true),
  promptDialog: vi.fn(),
}))

import { listCarpetas, getAsignacionesDeCarpeta } from '../../api/carpetas'
import { listRecursos, getAsignacionesDeRecurso } from '../../api/recursos'
import { listCoachees } from '../../api/coachees'

const carpetaRaiz: Carpeta = {
  id: 'cp1',
  nombre: 'Liderazgo',
  parentId: null,
  publica: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const recurso: Recurso = {
  id: 'r1',
  titulo: 'Manual de ejercicios',
  descripcion: null,
  carpetaId: 'cp1',
  tipo: 'link',
  url: 'https://example.com',
  archivoNombre: null,
  archivoPath: null,
  createdAt: '2026-01-01T00:00:00.000Z',
}

describe('RecursosView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(listCarpetas).mockResolvedValue([carpetaRaiz])
    vi.mocked(listRecursos).mockResolvedValue([recurso])
    vi.mocked(listCoachees).mockResolvedValue([
      {
        id: 'c1',
        nombre: 'Coachee Uno',
        empresaId: null,
        consentimientoInformado: false,
        consentimientoFecha: null,
        user: { id: 'u1', email: 'coachee@example.com' },
      },
    ])
    vi.mocked(getAsignacionesDeCarpeta).mockResolvedValue([])
    vi.mocked(getAsignacionesDeRecurso).mockResolvedValue([])
  })

  it('shows the folder tree and an empty state until a folder is selected', async () => {
    const wrapper = mount(RecursosView)
    await flushPromises()

    expect(wrapper.text()).toContain('Liderazgo')
    expect(wrapper.text()).toContain('Selecciona una carpeta')
    expect(listRecursos).not.toHaveBeenCalled()
  })

  it('lists the resources of the selected folder', async () => {
    const wrapper = mount(RecursosView)
    await flushPromises()

    const nodo = wrapper.findAll('li').find((li) => li.text().includes('Liderazgo'))
    await nodo!.find('div').trigger('click')
    await flushPromises()

    expect(listRecursos).toHaveBeenCalledWith('cp1')
    expect(wrapper.text()).toContain('Manual de ejercicios')
  })

  it('opens the access modal for a resource and lists coachees to share with', async () => {
    const wrapper = mount(RecursosView)
    await flushPromises()

    const nodo = wrapper.findAll('li').find((li) => li.text().includes('Liderazgo'))
    await nodo!.find('div').trigger('click')
    await flushPromises()

    const compartirBtn = wrapper.findAll('button').find((b) => b.text() === 'Compartir')
    await compartirBtn!.trigger('click')
    await flushPromises()

    expect(getAsignacionesDeRecurso).toHaveBeenCalledWith('r1')
    const modal = new DOMWrapper(document.body)
    expect(modal.text()).toContain('Coachee Uno')
    expect(modal.text()).toContain('Dar acceso')
  })
})
