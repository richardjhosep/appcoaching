import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises, DOMWrapper, type VueWrapper } from '@vue/test-utils'
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
import { crearRecurso, listRecursos, getAsignacionesDeRecurso, asignarRecurso } from '../../api/recursos'
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
  let wrapper: VueWrapper

  afterEach(() => {
    // AppModal renders through a Teleport to <body>; without unmounting, a
    // modal left open by one test would still be in the DOM for the next.
    wrapper?.unmount()
  })

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
    wrapper = mount(RecursosView)
    await flushPromises()

    expect(wrapper.text()).toContain('Liderazgo')
    expect(wrapper.text()).toContain('Selecciona una carpeta')
    expect(listRecursos).not.toHaveBeenCalled()
  })

  it('lists the resources of the selected folder', async () => {
    wrapper = mount(RecursosView)
    await flushPromises()

    const nodo = wrapper.findAll('li').find((li) => li.text().includes('Liderazgo'))
    await nodo!.find('div').trigger('click')
    await flushPromises()

    expect(listRecursos).toHaveBeenCalledWith('cp1')
    expect(wrapper.text()).toContain('Manual de ejercicios')
  })

  it('opens the access modal for a resource and lists coachees to share with', async () => {
    wrapper = mount(RecursosView)
    await flushPromises()

    const nodo = wrapper.findAll('li').find((li) => li.text().includes('Liderazgo'))
    await nodo!.find('div').trigger('click')
    await flushPromises()

    const compartirBtn = wrapper.findAll('button').find((b) => b.text() === 'Compartir')
    await compartirBtn!.trigger('click')
    await flushPromises()

    expect(getAsignacionesDeRecurso).toHaveBeenCalledWith('r1')
    const modal = new DOMWrapper(document.body)
    expect(modal.text()).toContain('Todavía nadie tiene acceso otorgado')

    const abrirBuscadorBtn = modal
      .findAll('button')
      .find((b) => b.text() === '+ Otorgar acceso a alguien más')
    await abrirBuscadorBtn!.trigger('click')

    // The candidate list stays empty until the coach actually searches — with many
    // coachees, listing them all up front would force the modal to scroll.
    expect(modal.text()).not.toContain('Coachee Uno')

    await modal.find('input[placeholder*="Buscar coachee"]').setValue('Coachee')
    await flushPromises()

    expect(modal.text()).toContain('Coachee Uno')
    expect(modal.text()).toContain('Dar acceso')
  })

  it('lists people who already have access up front, with a way to revoke right there', async () => {
    vi.mocked(getAsignacionesDeRecurso).mockResolvedValue([
      { id: 'a1', recursoId: 'r1', coacheeId: 'c1', activa: true, expiraEn: null },
    ])

    wrapper = mount(RecursosView)
    await flushPromises()

    const nodo = wrapper.findAll('li').find((li) => li.text().includes('Liderazgo'))
    await nodo!.find('div').trigger('click')
    await flushPromises()

    const compartirBtn = wrapper.findAll('button').find((b) => b.text() === 'Compartir')
    await compartirBtn!.trigger('click')
    await flushPromises()

    const modal = new DOMWrapper(document.body)
    // Shown immediately, no need to open the "add someone" search panel first.
    expect(modal.text()).toContain('Coachee Uno')
    expect(modal.text()).toContain('Acceso permanente')
    expect(modal.text()).not.toContain('Todavía nadie tiene acceso otorgado')

    const quitarBtn = modal.findAll('button').find((b) => b.text() === 'Quitar')
    await quitarBtn!.trigger('click')
    await flushPromises()

    expect(asignarRecurso).toHaveBeenCalledWith('r1', 'c1', false)
  })

  it('uploads a resource through the "+ Archivo" modal', async () => {
    vi.mocked(crearRecurso).mockResolvedValue({ ...recurso, id: 'r2', titulo: 'Nuevo enlace' })

    wrapper = mount(RecursosView)
    await flushPromises()

    const nodo = wrapper.findAll('li').find((li) => li.text().includes('Liderazgo'))
    await nodo!.find('div').trigger('click')
    await flushPromises()

    // The form is not on the page until the modal is opened.
    expect(document.body.textContent).not.toContain('Elegir archivo')

    const archivoBtn = wrapper.findAll('button').find((b) => b.text() === '+ Archivo')
    await archivoBtn!.trigger('click')
    await flushPromises()

    const modalPanel = new DOMWrapper(
      document.querySelector('.fixed.inset-0.z-50') as Element,
    )
    expect(modalPanel.text()).toContain('Subir archivo a «Liderazgo»')

    const tituloLabel = modalPanel.findAll('label').find((l) => l.text().includes('Título'))
    await tituloLabel!.find('input').setValue('Nuevo enlace')
    const urlLabel = modalPanel.findAll('label').find((l) => l.text().includes('URL'))
    await urlLabel!.find('input').setValue('https://example.com/nuevo')
    const subirBtn = modalPanel.findAll('button').find((b) => b.text() === 'Subir')
    await subirBtn!.trigger('click')
    await flushPromises()

    expect(crearRecurso).toHaveBeenCalledWith(
      expect.objectContaining({ titulo: 'Nuevo enlace', carpetaId: 'cp1' }),
    )
    // The modal closes itself after a successful upload.
    expect(document.body.textContent).not.toContain('Subir archivo a «Liderazgo»')
  })
})
