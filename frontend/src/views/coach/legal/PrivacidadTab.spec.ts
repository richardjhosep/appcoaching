import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import PrivacidadTab from './PrivacidadTab.vue'
import type { MedidaCumplimiento } from '../../../api/legal'

vi.mock('../../../api/legal', async () => {
  const actual = await vi.importActual<typeof import('../../../api/legal')>('../../../api/legal')
  return { ...actual, getCumplimiento: vi.fn() }
})

import { getCumplimiento } from '../../../api/legal'

const medidas: MedidaCumplimiento[] = [
  { id: 'notas_privadas', descripcion: 'Las notas privadas nunca son visibles.', activa: true },
  { id: 'contacto_autogestionado', descripcion: 'El contacto es autogestionado.', activa: true },
  { id: 'datos_agregados_empresa', descripcion: 'La empresa solo ve datos agregados.', activa: true },
  { id: 'consentimiento_informado', descripcion: '1 de 2 coachees.', activa: false },
]

describe('PrivacidadTab', () => {
  beforeEach(() => {
    vi.mocked(getCumplimiento).mockResolvedValue(medidas)
  })

  it('shows the fraction of active measures and every measure with its description', async () => {
    const wrapper = mount(PrivacidadTab)
    await flushPromises()

    expect(wrapper.text()).toContain('3 de 4')
    expect(wrapper.text()).toContain('Las notas privadas nunca son visibles.')
    expect(wrapper.text()).toContain('1 de 2 coachees.')
  })
})
