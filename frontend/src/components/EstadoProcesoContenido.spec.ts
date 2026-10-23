import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EstadoProcesoContenido from './EstadoProcesoContenido.vue'

const base = {
  nombreCoachee: 'Ana',
  objetivo: 'Liderar mejor',
  competencia: null,
  fechaInicio: '2026-08-01T00:00:00.000Z',
  proximaSesion: null,
  actividadesPendientes: 1,
  actividadesCompletadas: 2,
  logrosRecientes: [],
}

describe('EstadoProcesoContenido — avance general', () => {
  it('muestra el avance como aro 0-10 con su frase cuando hay autoevaluación', () => {
    const w = mount(EstadoProcesoContenido, { props: { ...base, avance: 70 } })

    expect(w.find('svg[aria-label="Cercanía al objetivo: 7 de 10"]').exists()).toBe(true)
    expect(w.text()).toContain('Avanzando hacia tu objetivo')
  })

  it('dice "Sin autoevaluar aún" cuando no hay avance', () => {
    const w = mount(EstadoProcesoContenido, { props: { ...base, avance: null } })

    expect(w.find('svg').exists()).toBe(false)
    expect(w.text()).toContain('Sin autoevaluar aún')
  })
})
