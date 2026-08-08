import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import LegalView from './LegalView.vue'
import ContratosTab from './legal/ContratosTab.vue'
import PrivacidadTab from './legal/PrivacidadTab.vue'
import AuditoriaTab from './legal/AuditoriaTab.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/coach/legal', component: LegalView }],
})

const stubs = { ContratosTab: true, PrivacidadTab: true, AuditoriaTab: true }

describe('LegalView', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    await router.push('/coach/legal')
    await router.isReady()
  })

  it('defaults to the "Contratos" tab', async () => {
    const wrapper = mount(LegalView, { global: { plugins: [router], stubs } })
    await flushPromises()

    expect(wrapper.findComponent(ContratosTab).exists()).toBe(true)
    expect(wrapper.findComponent(PrivacidadTab).exists()).toBe(false)
    expect(wrapper.findComponent(AuditoriaTab).exists()).toBe(false)
  })

  it('switches to "Privacidad" on click, without a full reload', async () => {
    const wrapper = mount(LegalView, { global: { plugins: [router], stubs } })
    await flushPromises()

    const privacidadBtn = wrapper.findAll('button').find((b) => b.text() === 'Privacidad')
    await privacidadBtn!.trigger('click')
    await flushPromises()

    expect(wrapper.findComponent(PrivacidadTab).exists()).toBe(true)
    expect(wrapper.findComponent(ContratosTab).exists()).toBe(false)
    expect(router.currentRoute.value.query.tab).toBe('privacidad')
  })

  it('switches to "Auditoría" on click', async () => {
    const wrapper = mount(LegalView, { global: { plugins: [router], stubs } })
    await flushPromises()

    const auditoriaBtn = wrapper.findAll('button').find((b) => b.text() === 'Auditoría')
    await auditoriaBtn!.trigger('click')
    await flushPromises()

    expect(wrapper.findComponent(AuditoriaTab).exists()).toBe(true)
    expect(router.currentRoute.value.query.tab).toBe('auditoria')
  })
})
