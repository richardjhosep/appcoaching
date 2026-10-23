import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises, DOMWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import CompetenciasView from './CompetenciasView.vue'
import type { Competencia } from '../../api/competencias'

vi.mock('../../api/competencias', async () => {
  const actual = await vi.importActual<typeof import('../../api/competencias')>('../../api/competencias')
  return {
    ...actual,
    listMisCompetenciasEmpresa: vi.fn(),
    createCompetenciaEmpresa: vi.fn(),
    updateCompetenciaEmpresa: vi.fn(),
    deleteCompetenciaEmpresa: vi.fn(),
  }
})
vi.mock('../../lib/notify', () => ({
  notifySuccess: vi.fn(),
  notifyError: vi.fn(),
  confirmDialog: vi.fn().mockResolvedValue(true),
}))

import {
  listMisCompetenciasEmpresa,
  createCompetenciaEmpresa,
  updateCompetenciaEmpresa,
  deleteCompetenciaEmpresa,
} from '../../api/competencias'
import { confirmDialog } from '../../lib/notify'

const seguridadIntegral: Competencia = {
  id: 'comp-1',
  nombre: 'Seguridad Integral',
  definicion: 'Capacidad de visualizar la seguridad como un valor fundamental.',
  empresaId: 'empresa-1',
  niveles: [
    { nivel: 1, descripcion: 'Reactivo ante incidentes.' },
    { nivel: 2, descripcion: 'Cumple normas por exigencia.' },
  ],
}

describe('CompetenciasView (empresa)', () => {
  let wrapper: ReturnType<typeof mount>

  beforeEach(() => {
    vi.clearAllMocks() // el historial de llamadas no se limpia solo entre tests
    setActivePinia(createPinia())
    vi.mocked(listMisCompetenciasEmpresa).mockResolvedValue([seguridadIntegral])
    vi.mocked(createCompetenciaEmpresa).mockResolvedValue({
      ...seguridadIntegral,
      id: 'comp-2',
      nombre: 'Liderazgo',
    })
    vi.mocked(updateCompetenciaEmpresa).mockResolvedValue({
      ...seguridadIntegral,
      nombre: 'Seguridad Integral (actualizada)',
    })
    vi.mocked(deleteCompetenciaEmpresa).mockResolvedValue({ success: true })
    vi.mocked(confirmDialog).mockResolvedValue(true)
  })

  afterEach(() => {
    wrapper.unmount()
  })

  it('lists the competencias the empresa already created, with their niveles', async () => {
    wrapper = mount(CompetenciasView)
    await flushPromises()

    const text = wrapper.text()
    expect(text).toContain('Seguridad Integral')
    expect(text).toContain('Nivel 1')
    expect(text).toContain('Reactivo ante incidentes.')
  })

  it('shows an empty state when there are none yet', async () => {
    vi.mocked(listMisCompetenciasEmpresa).mockResolvedValue([])

    wrapper = mount(CompetenciasView)
    await flushPromises()

    expect(wrapper.text()).toContain('Todavía no has cargado ninguna competencia')
  })

  it('opens the modal pre-filled with 4 empty niveles when creating', async () => {
    wrapper = mount(CompetenciasView)
    await flushPromises()

    const nuevaBtn = wrapper.findAll('button').find((b) => b.text().includes('Nueva competencia'))
    await nuevaBtn!.trigger('click')
    await flushPromises()

    // AppModal usa <Teleport to="body"> — no queda dentro del wrapper montado.
    const modal = new DOMWrapper(document.body)
    const niveles = modal.findAll('input[type="number"]')
    expect(niveles).toHaveLength(4)
    expect((niveles[0].element as HTMLInputElement).value).toBe('1')
    expect((niveles[3].element as HTMLInputElement).value).toBe('4')
  })

  it('creates a competencia with its niveles', async () => {
    wrapper = mount(CompetenciasView)
    await flushPromises()

    const nuevaBtn = wrapper.findAll('button').find((b) => b.text().includes('Nueva competencia'))
    await nuevaBtn!.trigger('click')
    await flushPromises()

    const modal = new DOMWrapper(document.body)
    await modal.find('input[type="text"]').setValue('Liderazgo')
    await modal.find('textarea').setValue('Definición de liderazgo')
    const niveles = modal.findAll('textarea')
    for (const textarea of niveles.slice(1)) {
      await textarea.setValue('Descripción del nivel')
    }
    await modal.find('form').trigger('submit')
    await flushPromises()

    expect(createCompetenciaEmpresa).toHaveBeenCalledWith(
      expect.objectContaining({ nombre: 'Liderazgo', definicion: 'Definición de liderazgo' }),
    )
    expect(wrapper.text()).toContain('Liderazgo')
  })

  it('rejects saving when a nivel is left without descripción', async () => {
    wrapper = mount(CompetenciasView)
    await flushPromises()

    const nuevaBtn = wrapper.findAll('button').find((b) => b.text().includes('Nueva competencia'))
    await nuevaBtn!.trigger('click')
    await flushPromises()
    const modal = new DOMWrapper(document.body)
    await modal.find('input[type="text"]').setValue('Liderazgo')
    await modal.find('textarea').setValue('Definición')
    // Los niveles quedan vacíos a propósito.
    await modal.find('form').trigger('submit')
    await flushPromises()

    expect(createCompetenciaEmpresa).not.toHaveBeenCalled()
    expect(modal.text()).toContain('Cada nivel necesita su descripción')
  })

  it('edits an existing competencia, pre-filling the form with its data', async () => {
    wrapper = mount(CompetenciasView)
    await flushPromises()

    const editarBtn = wrapper.findAll('button').find((b) => b.text() === 'Editar')
    await editarBtn!.trigger('click')
    await flushPromises()

    const modal = new DOMWrapper(document.body)
    const nombreInput = modal.find('input[type="text"]').element as HTMLInputElement
    expect(nombreInput.value).toBe('Seguridad Integral')

    await modal.find('form').trigger('submit')
    await flushPromises()

    expect(updateCompetenciaEmpresa).toHaveBeenCalledWith(
      'comp-1',
      expect.objectContaining({ nombre: 'Seguridad Integral' }),
    )
    expect(wrapper.text()).toContain('Seguridad Integral (actualizada)')
  })

  it('deletes a competencia after confirming', async () => {
    wrapper = mount(CompetenciasView)
    await flushPromises()

    const eliminarBtn = wrapper.findAll('button').find((b) => b.text() === 'Eliminar')
    await eliminarBtn!.trigger('click')
    await flushPromises()

    expect(confirmDialog).toHaveBeenCalled()
    expect(deleteCompetenciaEmpresa).toHaveBeenCalledWith('comp-1')
    expect(wrapper.text()).toContain('Todavía no has cargado ninguna competencia')
  })

  it('does not delete when the confirmation is cancelled', async () => {
    vi.mocked(confirmDialog).mockResolvedValue(false)
    wrapper = mount(CompetenciasView)
    await flushPromises()

    const eliminarBtn = wrapper.findAll('button').find((b) => b.text() === 'Eliminar')
    await eliminarBtn!.trigger('click')
    await flushPromises()

    expect(deleteCompetenciaEmpresa).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Seguridad Integral')
  })

  it('muestra ErrorState con Reintentar si falla la carga y se recupera al reintentar', async () => {
    vi.mocked(listMisCompetenciasEmpresa).mockRejectedValueOnce(new Error('sin conexión'))
    wrapper = mount(CompetenciasView)
    await flushPromises()

    expect(wrapper.find('[role="alert"]').exists()).toBe(true)

    await wrapper.find('[role="alert"] button').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Seguridad Integral')
  })
})
