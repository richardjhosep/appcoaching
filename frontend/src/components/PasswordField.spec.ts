import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PasswordField from './PasswordField.vue'

describe('PasswordField', () => {
  it('starts masked and toggles to visible text when the eye button is clicked', async () => {
    const wrapper = mount(PasswordField, { props: { modelValue: 'secreta', label: 'Contraseña' } })

    const input = wrapper.find('input')
    expect(input.attributes('type')).toBe('password')

    await wrapper.find('button').trigger('click')
    expect(input.attributes('type')).toBe('text')

    await wrapper.find('button').trigger('click')
    expect(input.attributes('type')).toBe('password')
  })

  it('emits update:modelValue as the user types', async () => {
    const wrapper = mount(PasswordField, { props: { modelValue: '', label: 'Contraseña' } })

    await wrapper.find('input').setValue('nueva123')

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['nueva123'])
  })

  it('uses the default styling when no inputClass is given, and the caller\'s class when it is', () => {
    const sinOverride = mount(PasswordField, { props: { modelValue: '', label: 'Contraseña' } })
    expect(sinOverride.find('input').classes()).toContain('border-[var(--color-line)]')

    const conOverride = mount(PasswordField, {
      props: { modelValue: '', label: 'Contraseña', inputClass: 'mi-clase-propia pr-10' },
    })
    expect(conOverride.find('input').classes()).toEqual(['mi-clase-propia', 'pr-10'])
  })

  it('applies the invalid border color when invalid is true (default styling only)', () => {
    const wrapper = mount(PasswordField, { props: { modelValue: '', label: 'Contraseña', invalid: true } })

    expect(wrapper.find('input').classes()).toContain('border-[var(--color-danger)]')
  })
})
