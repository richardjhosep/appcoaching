import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises, DOMWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ConfiguracionView from './ConfiguracionView.vue'
import type { ParametroConfiguracion } from '../../api/configuracion'

vi.mock('../../api/configuracion', async () => {
  const actual = await vi.importActual<typeof import('../../api/configuracion')>('../../api/configuracion')
  return {
    ...actual,
    listarParametros: vi.fn(),
    crearParametro: vi.fn(),
    actualizarParametro: vi.fn(),
    eliminarParametro: vi.fn(),
  }
})
vi.mock('../../lib/notify', () => ({
  notifySuccess: vi.fn(),
  notifyError: vi.fn(),
  confirmDialog: vi.fn().mockResolvedValue(true),
}))

import {
  listarParametros,
  crearParametro,
  actualizarParametro,
  eliminarParametro,
} from '../../api/configuracion'
import { confirmDialog, notifySuccess } from '../../lib/notify'

const hoyIso = new Date().toISOString()

const parametros: ParametroConfiguracion[] = [
  {
    id: 'p1',
    grupo: 'RETROALIMENTACION_BLOQUES',
    clave: '1',
    valor: 'Evaluación del Proceso',
    estado: true,
    createdAt: hoyIso,
    updatedAt: hoyIso,
  },
  {
    id: 'p2',
    grupo: 'Evaluación del Proceso',
    clave: '1',
    valor: 'El objetivo fue definido con claridad.',
    estado: true,
    createdAt: hoyIso,
    updatedAt: hoyIso,
  },
]

describe('ConfiguracionView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(listarParametros).mockResolvedValue(parametros)
  })

  it('groups parámetros by grupo and shows their valor', async () => {
    const wrapper = mount(ConfiguracionView)
    await flushPromises()

    expect(wrapper.text()).toContain('RETROALIMENTACION_BLOQUES')
    expect(wrapper.text()).toContain('Evaluación del Proceso')
    expect(wrapper.text()).toContain('El objetivo fue definido con claridad.')
    expect(wrapper.text()).toContain('2 parámetro(s)')
  })

  it('filters by grupo', async () => {
    const wrapper = mount(ConfiguracionView)
    await flushPromises()

    await wrapper.find('select').setValue('RETROALIMENTACION_BLOQUES')
    await flushPromises()

    expect(wrapper.text()).toContain('1 parámetro(s)')
    expect(wrapper.text()).not.toContain('El objetivo fue definido con claridad.')
  })

  it('creates a new parámetro when the form is valid', async () => {
    vi.mocked(crearParametro).mockResolvedValue({
      id: 'p3',
      grupo: 'Nuevo Grupo',
      clave: '1',
      valor: 'Nuevo valor',
      estado: true,
      createdAt: hoyIso,
      updatedAt: hoyIso,
    })
    const wrapper = mount(ConfiguracionView)
    await flushPromises()

    const nuevoBtn = wrapper.findAll('button').find((b) => b.text() === '+ Nuevo parámetro')
    await nuevoBtn!.trigger('click')
    await flushPromises()
    const modal = new DOMWrapper(document.body)
    await modal.find('input[type="text"]').setValue('Nuevo Grupo')
    await modal.findAll('input[type="text"]')[1].setValue('1')
    await modal.find('textarea').setValue('Nuevo valor')
    await modal.find('form').trigger('submit')
    await flushPromises()

    expect(crearParametro).toHaveBeenCalledWith({
      grupo: 'Nuevo Grupo',
      clave: '1',
      valor: 'Nuevo valor',
      estado: true,
    })
    expect(notifySuccess).toHaveBeenCalledWith('Parámetro creado')
  })

  it('toggles estado', async () => {
    vi.mocked(actualizarParametro).mockResolvedValue({ ...parametros[0], estado: false })
    const wrapper = mount(ConfiguracionView)
    await flushPromises()

    await wrapper.find('button[type="button"]').trigger('click')
    await flushPromises()

    expect(actualizarParametro).toHaveBeenCalledWith('p1', { estado: false })
  })

  it('deletes a parámetro after confirmation', async () => {
    const wrapper = mount(ConfiguracionView)
    await flushPromises()

    const eliminarBtn = wrapper.findAll('button[title="Eliminar"]')[0]
    await eliminarBtn.trigger('click')
    await flushPromises()

    expect(confirmDialog).toHaveBeenCalled()
    expect(eliminarParametro).toHaveBeenCalledWith('p1')
  })
})
