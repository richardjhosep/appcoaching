import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import AutoconocimientoPanel from './AutoconocimientoPanel.vue'

vi.mock('../api/autoconocimiento', () => ({
  getMiAutoconocimiento: vi.fn(),
  guardarSeccionAutoconocimiento: vi.fn(),
}))
vi.mock('../lib/notify', () => ({ notifySuccess: vi.fn(), notifyError: vi.fn() }))

import { getMiAutoconocimiento, guardarSeccionAutoconocimiento } from '../api/autoconocimiento'
import { notifyError } from '../lib/notify'

async function montar() {
  const wrapper = mount(AutoconocimientoPanel)
  await flushPromises()
  return wrapper
}

describe('AutoconocimientoPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
    vi.mocked(getMiAutoconocimiento).mockResolvedValue([
      { seccion: 'valores', contenido: 'Honestidad', complemento: '', compartida: true },
    ])
    vi.mocked(guardarSeccionAutoconocimiento).mockImplementation(async (seccion, input) => ({
      seccion,
      contenido: '',
      complemento: '',
      compartida: false,
      ...input,
    }))
  })

  it('muestra las 9 secciones y de un vistazo cuáles ve el coach', async () => {
    const wrapper = await montar()

    const secciones = wrapper.findAll('[data-seccion]')
    expect(secciones).toHaveLength(9)
    expect(secciones.filter((s) => s.text().includes('La ve mi coach')).map((s) => s.attributes('data-seccion'))).toEqual([
      'valores',
    ])
    expect(secciones.filter((s) => s.text().includes('Solo yo'))).toHaveLength(8)
  })

  it('guarda solo el texto de la sección, sin tocar la privacidad', async () => {
    const wrapper = await montar()
    const seccion = wrapper.find('[data-seccion="proposito"]')

    await seccion.find('textarea').setValue('Formar equipos')
    expect(seccion.text()).toContain('Sin guardar')
    await seccion.find('form').trigger('submit')
    await flushPromises()

    expect(guardarSeccionAutoconocimiento).toHaveBeenCalledWith('proposito', { contenido: 'Formar equipos' })
    expect(seccion.text()).not.toContain('Sin guardar')
    expect(seccion.text()).toContain('Solo yo')
  })

  it('energía guarda sus dos columnas', async () => {
    const wrapper = await montar()
    const seccion = wrapper.find('[data-seccion="energia"]')
    const [da, quita] = seccion.findAll('textarea')

    await da.setValue('Enseñar')
    await quita.setValue('Reuniones largas')
    await seccion.find('form').trigger('submit')
    await flushPromises()

    expect(guardarSeccionAutoconocimiento).toHaveBeenCalledWith('energia', {
      contenido: 'Enseñar',
      complemento: 'Reuniones largas',
    })
  })

  it('el interruptor cambia solo la privacidad y no descarta el borrador', async () => {
    const wrapper = await montar()
    const seccion = wrapper.find('[data-seccion="proposito"]')
    await seccion.find('textarea').setValue('borrador')

    await seccion.find('[role="switch"]').trigger('click')
    await flushPromises()

    expect(guardarSeccionAutoconocimiento).toHaveBeenCalledWith('proposito', { compartida: true })
    expect(seccion.find('[role="switch"]').attributes('aria-checked')).toBe('true')
    expect((seccion.find('textarea').element as HTMLTextAreaElement).value).toBe('borrador')
    expect(seccion.text()).toContain('Sin guardar')
  })

  it('si falla el cambio, el indicador no miente', async () => {
    vi.mocked(guardarSeccionAutoconocimiento).mockRejectedValue(new Error('x'))
    const wrapper = await montar()
    const seccion = wrapper.find('[data-seccion="valores"]')

    await seccion.find('[role="switch"]').trigger('click')
    await flushPromises()

    expect(notifyError).toHaveBeenCalled()
    expect(seccion.text()).toContain('La ve mi coach')
  })
})
