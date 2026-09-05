import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ImpactoNegocioCallout from './ImpactoNegocioCallout.vue'

describe('ImpactoNegocioCallout', () => {
  it('shows the impacto text when set', () => {
    const wrapper = mount(ImpactoNegocioCallout, { props: { impacto: 'Redujo el tiempo de entrega en 20%.' } })

    expect(wrapper.text()).toContain('Impacto en el negocio')
    expect(wrapper.text()).toContain('Redujo el tiempo de entrega en 20%.')
  })

  it('shows a placeholder when there is no impacto registered yet', () => {
    const wrapper = mount(ImpactoNegocioCallout, { props: { impacto: null } })

    expect(wrapper.text()).toContain('Sin registrar todavía')
  })
})
