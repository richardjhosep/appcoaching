import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ExperienciaLogo from './ExperienciaLogo.vue'

vi.mock('../api/perfilCoach', () => ({
  obtenerUrlLogoExperiencia: vi.fn(),
}))

import { obtenerUrlLogoExperiencia } from '../api/perfilCoach'

describe('ExperienciaLogo', () => {
  beforeEach(() => {
    vi.mocked(obtenerUrlLogoExperiencia).mockReset()
  })

  it('shows the company initial when there is no logo', async () => {
    const wrapper = mount(ExperienciaLogo, {
      props: { experienciaId: 'e1', tieneLogo: false, empresa: 'Ferronor S.A.' },
    })
    await flushPromises()

    expect(obtenerUrlLogoExperiencia).not.toHaveBeenCalled()
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.text()).toContain('FS')
  })

  it('shows the logo image when one is available', async () => {
    vi.mocked(obtenerUrlLogoExperiencia).mockResolvedValue('blob:mock-url')
    const wrapper = mount(ExperienciaLogo, {
      props: { experienciaId: 'e1', tieneLogo: true, empresa: 'Ferronor S.A.' },
    })
    await flushPromises()

    expect(obtenerUrlLogoExperiencia).toHaveBeenCalledWith('e1')
    expect(wrapper.find('img').attributes('src')).toBe('blob:mock-url')
  })

  it('falls back to the initial when the logo fails to load', async () => {
    vi.mocked(obtenerUrlLogoExperiencia).mockResolvedValue(null)
    const wrapper = mount(ExperienciaLogo, {
      props: { experienciaId: 'e1', tieneLogo: true, empresa: 'Ferronor S.A.' },
    })
    await flushPromises()

    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.text()).toContain('FS')
  })
})
