import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import BusquedaGlobal from './BusquedaGlobal.vue'

vi.mock('../api/busqueda', () => ({ buscarGlobal: vi.fn() }))
import { buscarGlobal } from '../api/busqueda'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div />' } },
    { path: '/coach/coachees/:coacheeId', name: 'coach-coachee-detail', component: { template: '<div />' } },
    { path: '/coach/empresas', name: 'coach-empresas', component: { template: '<div />' } },
    { path: '/coach/recursos', name: 'coach-recursos', component: { template: '<div />' } },
  ],
})

const respuesta = {
  coachees: [{ id: 'c1', nombre: 'Ana Soto' }],
  empresas: [{ id: 'e1', nombre: 'Orbiflex' }],
  competencias: [],
  recursos: [],
}

describe('BusquedaGlobal', () => {
  let wrapper: VueWrapper

  beforeEach(() => {
    vi.useFakeTimers()
    vi.mocked(buscarGlobal).mockReset()
    vi.mocked(buscarGlobal).mockResolvedValue(respuesta)
    wrapper = mount(BusquedaGlobal, { global: { plugins: [router] }, attachTo: document.body })
  })
  afterEach(() => {
    wrapper.unmount()
    vi.useRealTimers()
  })

  async function escribir(texto: string) {
    const input = wrapper.find('input')
    await input.setValue(texto)
    await vi.advanceTimersByTimeAsync(300)
    await flushPromises()
    return input
  }

  it('expone el patrón combobox y se mueve con flechas', async () => {
    const input = await escribir('a')
    expect(input.attributes('role')).toBe('combobox')
    expect(input.attributes('aria-expanded')).toBe('true')
    const opciones = wrapper.findAll('[role="option"]')
    expect(opciones).toHaveLength(2)

    await input.trigger('keydown', { key: 'ArrowDown' })
    expect(input.attributes('aria-activedescendant')).toBe(opciones[0].attributes('id'))
    await input.trigger('keydown', { key: 'ArrowDown' })
    expect(input.attributes('aria-activedescendant')).toBe(opciones[1].attributes('id'))
  })

  it('Enter sobre un coachee navega a su ficha; sobre una empresa, a ese registro por ?id=', async () => {
    const input = await escribir('a')
    await input.trigger('keydown', { key: 'ArrowDown' })
    await input.trigger('keydown', { key: 'Enter' })
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/coach/coachees/c1')

    const input2 = await escribir('o')
    await input2.trigger('keydown', { key: 'ArrowUp' })
    await input2.trigger('keydown', { key: 'Enter' })
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/coach/empresas')
    expect(router.currentRoute.value.query.id).toBe('e1')
  })

  it('Escape cierra la lista', async () => {
    const input = await escribir('a')
    await input.trigger('keydown', { key: 'Escape' })
    expect(input.attributes('aria-expanded')).toBe('false')
  })

  it('Ctrl+K enfoca el buscador', async () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))
    expect(document.activeElement).toBe(wrapper.find('input').element)
  })

  it('avisa si la búsqueda falla en vez de quedar en silencio', async () => {
    vi.mocked(buscarGlobal).mockRejectedValue(new Error('boom'))
    await escribir('a')
    expect(wrapper.text()).toContain('No pudimos buscar')
  })
})
