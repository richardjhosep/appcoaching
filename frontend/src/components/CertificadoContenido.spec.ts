import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CertificadoContenido from './CertificadoContenido.vue'

describe('CertificadoContenido', () => {
  it('renders the certificate data from props', () => {
    const wrapper = mount(CertificadoContenido, {
      props: {
        nombreCoachee: 'Felipe Cortes',
        objetivo: 'Impacto e Influencia',
        resultado: 'logrado',
        fechaApertura: '2026-01-01T00:00:00.000Z',
        fechaCierre: '2026-03-01T00:00:00.000Z',
      },
    })

    expect(wrapper.text()).toContain('Felipe Cortes')
    expect(wrapper.text()).toContain('Impacto e Influencia')
    expect(wrapper.text()).toContain('Logrado')
  })

  it('maps each resultado to its label', () => {
    const wrapper = mount(CertificadoContenido, {
      props: {
        nombreCoachee: 'Alguien',
        objetivo: 'Algo',
        resultado: 'medianamente_logrado',
        fechaApertura: '2026-01-01T00:00:00.000Z',
        fechaCierre: '2026-03-01T00:00:00.000Z',
      },
    })

    expect(wrapper.text()).toContain('Medianamente logrado')
  })
})
