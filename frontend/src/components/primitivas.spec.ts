import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppButton from './AppButton.vue'
import ErrorState from './ErrorState.vue'
import FormField from './FormField.vue'
import KpiCard from './KpiCard.vue'
import StatusBadge from './StatusBadge.vue'

describe('AppButton', () => {
  it('se deshabilita y marca aria-busy mientras carga', () => {
    const w = mount(AppButton, { props: { loading: true }, slots: { default: 'Guardar' } })

    expect(w.attributes('disabled')).toBeDefined()
    expect(w.attributes('aria-busy')).toBe('true')
  })

  it('es type=button por defecto para no enviar formularios sin querer', () => {
    expect(mount(AppButton).attributes('type')).toBe('button')
  })
})

describe('ErrorState', () => {
  it('emite retry al presionar Reintentar', async () => {
    const w = mount(ErrorState)
    await w.find('button').trigger('click')

    expect(w.emitted('retry')).toHaveLength(1)
    expect(w.attributes('role')).toBe('alert')
  })
})

describe('FormField', () => {
  it('cablea label, aria-describedby y aria-invalid cuando hay error', () => {
    const w = mount(FormField, {
      props: { label: 'Email', error: 'Obligatorio' },
      slots: {
        default: `<template #default="{ id, describedby, invalid }">
          <input :id="id" :aria-describedby="describedby" :aria-invalid="invalid" />
        </template>`,
      },
    })
    const input = w.find('input')

    expect(w.find('label').attributes('for')).toBe(input.attributes('id'))
    expect(input.attributes('aria-invalid')).toBe('true')
    expect(w.find('[role="alert"]').attributes('id')).toBe(input.attributes('aria-describedby'))
  })

  it('no marca invalid cuando no hay error', () => {
    const w = mount(FormField, {
      props: { label: 'Nombre' },
      slots: { default: `<template #default="{ invalid }"><input :aria-invalid="invalid" /></template>` },
    })

    expect(w.find('input').attributes('aria-invalid')).toBeUndefined()
  })
})

describe('KpiCard / StatusBadge', () => {
  it('KpiCard muestra etiqueta, valor y ayuda', () => {
    const w = mount(KpiCard, { props: { label: 'Asistencia', value: '92%', hint: 'últimos 30 días', tone: 'sage' } })

    expect(w.text()).toContain('Asistencia')
    expect(w.text()).toContain('92%')
    expect(w.text()).toContain('últimos 30 días')
    expect(w.html()).toContain('text-[var(--color-sage)]')
  })

  it('StatusBadge aplica el tono pedido', () => {
    const w = mount(StatusBadge, { props: { tone: 'danger' }, slots: { default: 'Vencido' } })

    expect(w.text()).toBe('Vencido')
    expect(w.classes().join(' ')).toContain('--color-danger')
  })
})

describe('AppButton — color de acción', () => {
  it('el botón principal usa el color primario (no negro) con texto blanco', () => {
    const clases = mount(AppButton, { slots: { default: 'Guardar' } }).classes().join(' ')

    expect(clases).toContain('bg-[var(--color-primary)]')
    expect(clases).toContain('text-[var(--color-on-primary)]')
    expect(clases).not.toContain('bg-[var(--color-ink)]')
  })
})
