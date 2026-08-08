import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import BackLink from './BackLink.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div />' } },
    { path: '/coach/coachees', component: { template: '<div />' } },
  ],
})

describe('BackLink', () => {
  it('renders as a RouterLink when "to" is given', async () => {
    const wrapper = mount(BackLink, {
      props: { label: 'Volver a Coachees', to: '/coach/coachees' },
      global: { plugins: [router] },
    })

    expect(wrapper.text()).toContain('Volver a Coachees')
    expect(wrapper.find('a').attributes('href')).toBe('/coach/coachees')
  })

  it('renders as a button and emits click when no "to" is given', async () => {
    const wrapper = mount(BackLink, {
      props: { label: 'Volver' },
      global: { plugins: [router] },
    })

    expect(wrapper.find('a').exists()).toBe(false)
    const boton = wrapper.find('button')
    expect(boton.exists()).toBe(true)

    await boton.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })
})
