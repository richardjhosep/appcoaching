import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import NegocioView from './NegocioView.vue'
import ResumenTab from './negocio/ResumenTab.vue'
import ComercialTab from './negocio/ComercialTab.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/coach/negocio', component: NegocioView }],
})

describe('NegocioView', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    await router.push('/coach/negocio')
    await router.isReady()
  })

  it('defaults to the "Resumen" tab', async () => {
    const wrapper = mount(NegocioView, {
      global: { plugins: [router], stubs: { ResumenTab: true, ComercialTab: true } },
    })
    await flushPromises()

    expect(wrapper.findComponent(ResumenTab).exists()).toBe(true)
    expect(wrapper.findComponent(ComercialTab).exists()).toBe(false)
  })

  it('switches to "Comercial" on click, without a full reload', async () => {
    const wrapper = mount(NegocioView, {
      global: { plugins: [router], stubs: { ResumenTab: true, ComercialTab: true } },
    })
    await flushPromises()

    const comercialBtn = wrapper.findAll('button').find((b) => b.text() === 'Comercial')
    await comercialBtn!.trigger('click')
    await flushPromises()

    expect(wrapper.findComponent(ComercialTab).exists()).toBe(true)
    expect(wrapper.findComponent(ResumenTab).exists()).toBe(false)
    expect(router.currentRoute.value.query.tab).toBe('comercial')
  })
})
