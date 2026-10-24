import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TabBar from './TabBar.vue'

type Key = 'a' | 'b' | 'c'
const tabs: Array<{ key: Key; label: string; icon?: string; badge?: number | null }> = [
  { key: 'a', label: 'Uno', icon: 'sesiones' },
  { key: 'b', label: 'Dos' },
  { key: 'c', label: 'Tres', badge: 3 },
]

describe('TabBar', () => {
  it('renders every tab label', () => {
    const wrapper = mount(TabBar, { props: { tabs, modelValue: 'a' as Key } })

    expect(wrapper.text()).toContain('Uno')
    expect(wrapper.text()).toContain('Dos')
    expect(wrapper.text()).toContain('Tres')
  })

  it('renders an icon only for tabs that declare one', () => {
    const wrapper = mount(TabBar, { props: { tabs, modelValue: 'a' as Key } })
    const buttons = wrapper.findAll('button')

    expect(buttons[0].find('svg').exists()).toBe(true)
    expect(buttons[1].find('svg').exists()).toBe(false)
  })

  it('renders a badge only for tabs that declare one', () => {
    const wrapper = mount(TabBar, { props: { tabs, modelValue: 'a' as Key } })
    const buttons = wrapper.findAll('button')

    expect(buttons[2].text()).toContain('3')
    expect(buttons[0].text()).not.toMatch(/\d/)
  })

  it('emits update:modelValue with the clicked tab key', async () => {
    const wrapper = mount(TabBar, { props: { tabs, modelValue: 'a' as Key } })

    await wrapper.findAll('button')[1].trigger('click')

    expect(wrapper.emitted('update:modelValue')).toEqual([['b']])
  })

  it('marks the active tab with the solid style', () => {
    const wrapper = mount(TabBar, { props: { tabs, modelValue: 'b' as Key } })
    const buttons = wrapper.findAll('button')

    expect(buttons[1].classes()).toContain('bg-[var(--color-primary)]')
    expect(buttons[0].classes()).not.toContain('bg-[var(--color-primary)]')
  })

  it('keeps a single scrollable row when `scroll` is set', () => {
    const wrapper = mount(TabBar, { props: { tabs, modelValue: 'a' as Key, scroll: true } })
    const lista = wrapper.find('[role="tablist"]')

    expect(lista.classes()).toContain('overflow-x-auto')
    expect(lista.classes()).toContain('flex-nowrap')
    expect(lista.classes()).not.toContain('flex-wrap')
  })

  it('wraps by default (backwards compatible)', () => {
    const wrapper = mount(TabBar, { props: { tabs, modelValue: 'a' as Key } })
    expect(wrapper.find('[role="tablist"]').classes()).toContain('flex-wrap')
  })
})
