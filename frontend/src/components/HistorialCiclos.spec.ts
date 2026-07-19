import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import HistorialCiclos from './HistorialCiclos.vue'
import type { Ciclo } from '../api/ciclos'

vi.mock('../api/ciclos', async () => {
  const actual = await vi.importActual<typeof import('../api/ciclos')>('../api/ciclos')
  return { ...actual, descargarInformePdf: vi.fn() }
})

const cicloCerrado: Ciclo = {
  id: 'c1',
  coacheeId: 'coachee-1',
  totalSesiones: 10,
  fechaApertura: '2026-01-01T00:00:00.000Z',
  fechaCierre: '2026-03-01T00:00:00.000Z',
  resultado: 'logrado',
  resumenReunionInicial: 'Reunión con RRHH.',
  informeFinal: 'Informe final completo.',
  informePdfNombre: 'informe.pdf',
  informePdfPath: 'uuid.pdf',
  sesionesRealizadas: 10,
  sesionesRestantes: 0,
  alertaPorVencer: false,
}

describe('HistorialCiclos', () => {
  it('shows an empty-state message when there are no cycles', () => {
    const wrapper = mount(HistorialCiclos, { props: { ciclos: [] } })

    expect(wrapper.text()).toContain('Sin ciclos anteriores')
  })

  it('shows the resultado badge and expands to reveal the informe final', async () => {
    const wrapper = mount(HistorialCiclos, { props: { ciclos: [cicloCerrado] } })

    expect(wrapper.text()).toContain('Logrado')
    expect(wrapper.text()).not.toContain('Informe final completo')

    await wrapper.find('button').trigger('click')

    expect(wrapper.text()).toContain('Informe final completo')
    expect(wrapper.text()).toContain('Descargar informe en PDF')
  })
})
