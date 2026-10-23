import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ProgresoActual from './ProgresoActual.vue'

describe('ProgresoActual', () => {
  it('muestra la nota, la frase del nivel y el origen del número', () => {
    const w = mount(ProgresoActual, { props: { valor: 5, fecha: '2026-09-11T12:00:00.000Z' } })

    expect(w.find('svg').attributes('aria-label')).toBe('Cercanía al objetivo: 5 de 10')
    expect(w.text()).toContain('Avanzando hacia tu objetivo')
    expect(w.text()).toContain('Tu autoevaluación al cerrar la sesión del')
  })

  it('usa un texto genérico cuando no se conoce la fecha', () => {
    const w = mount(ProgresoActual, { props: { valor: 9, audiencia: 'coachee' } })

    expect(w.text()).toContain('Muy cerca de su objetivo')
    expect(w.text()).toContain('Última autoevaluación del coachee.')
  })

  it.each([
    [2, 'Recién comenzando el camino'],
    [4, 'Avanzando hacia tu objetivo'],
    [8, 'Muy cerca de tu objetivo'],
  ])('la nota %i se describe como "%s" (mismos umbrales que nivelProgreso)', (valor, frase) => {
    expect(mount(ProgresoActual, { props: { valor } }).text()).toContain(frase)
  })

  it('el cambio lleva flecha y palabras, no solo color', () => {
    const w = mount(ProgresoActual, { props: { valor: 6, cambio: { respectoAnterior: -2, desdeInicio: null } } })

    expect(w.text()).toContain('▼')
    expect(w.text()).toContain('−2 respecto a tu sesión anterior')
  })

  it('acota el arco al rango 0-10', () => {
    const w = mount(ProgresoActual, { props: { valor: 14 } })
    const arco = w.findAll('circle')[1]!.attributes('stroke-dasharray')!.split(' ')

    expect(Number(arco[0])).toBeCloseTo(Number(arco[1]), 5)
  })
})
