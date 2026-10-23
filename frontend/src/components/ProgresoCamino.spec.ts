import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ProgresoCamino from './ProgresoCamino.vue'
import { VChart } from '../lib/echartsCore'
import type { PuntoProgreso } from '../api/seguimiento'

// Igual que TendenciaChart.spec: happy-dom no da layout real a ECharts, así que se verifica el
// `option` que el componente le pasa a <VChart>.
const p = (sesionId: string, fecha: string, cercaniaObjetivo: number, aprendizaje: string | null = null): PuntoProgreso => ({
  sesionId,
  fecha,
  cercaniaObjetivo,
  aprendizaje,
})

describe('ProgresoCamino', () => {
  it('sin sesiones muestra solo el mensaje de inicio', () => {
    const w = mount(ProgresoCamino, { props: { puntos: [] } })

    expect(w.text()).toContain('Tu progreso empieza en tu próxima sesión')
    expect(w.findComponent(VChart).exists()).toBe(false)
  })

  it('con una sola sesión NO dibuja un gráfico: muestra el punto de partida sobre la escala', () => {
    const w = mount(ProgresoCamino, { props: { puntos: [p('a', '2026-09-11T12:00:00.000Z', 5, 'Aprendí a priorizar')] } })

    expect(w.findComponent(VChart).exists()).toBe(false)
    expect(w.text()).toContain('Este es tu punto de partida')
    expect(w.text()).toContain('Con tu próxima sesión empezaremos a dibujar tu evolución')
    expect(w.text()).toContain('Aprendí a priorizar')
    // La frase habla del nivel, no solo del color.
    expect(w.text()).toContain('Avanzando hacia tu objetivo')
    expect(w.text()).not.toContain('respecto a tu sesión anterior')
  })

  it('con dos o más sesiones arma el gráfico 0-10 con la línea de Objetivo y fechas en orden', () => {
    const w = mount(ProgresoCamino, {
      props: { puntos: [p('b', '2026-02-10T12:00:00.000Z', 7), p('a', '2026-01-10T12:00:00.000Z', 3)] },
    })
    const option = w.findComponent(VChart).props('option') as {
      yAxis: { min: number; max: number }
      series: Array<{ name: string; data: number[] }>
    }

    expect(option.yAxis).toMatchObject({ min: 0, max: 10 })
    expect(option.series[0]).toMatchObject({ name: 'Cercanía', data: [3, 7] })
    expect(option.series[1]).toMatchObject({ name: 'Objetivo', data: [10, 10] })
    expect(w.find('[role="img"][aria-label^="Evolución"]').exists()).toBe(true)
  })

  it('muestra el cambio respecto a la sesión anterior con flecha y palabras (no solo color)', () => {
    const subio = mount(ProgresoCamino, {
      props: { puntos: [p('a', '2026-01-10T12:00:00.000Z', 3), p('b', '2026-02-10T12:00:00.000Z', 7)] },
    })
    expect(subio.text()).toContain('▲')
    expect(subio.text()).toContain('+4 respecto a tu sesión anterior')

    const bajo = mount(ProgresoCamino, {
      props: { puntos: [p('a', '2026-01-10T12:00:00.000Z', 7), p('b', '2026-02-10T12:00:00.000Z', 6)] },
    })
    expect(bajo.text()).toContain('▼')
    expect(bajo.text()).toContain('−1 respecto a tu sesión anterior')

    const igual = mount(ProgresoCamino, {
      props: { puntos: [p('a', '2026-01-10T12:00:00.000Z', 6), p('b', '2026-02-10T12:00:00.000Z', 6)] },
    })
    expect(igual.text()).toContain('Igual que en tu sesión anterior')
  })

  it('el historial muestra 3 sesiones, la más reciente primero, y "Ver todas" despliega el resto', async () => {
    const puntos = [1, 2, 3, 4, 5].map((n) => p(`s${n}`, `2026-0${n}-10T12:00:00.000Z`, n, `aprendizaje ${n}`))
    const w = mount(ProgresoCamino, { props: { puntos } })

    const items = () => w.findAll('li')
    expect(items()).toHaveLength(3)
    expect(items()[0]!.text()).toContain('aprendizaje 5')

    await w.findAll('button').find((b) => b.text().startsWith('Ver todas'))!.trigger('click')
    expect(items()).toHaveLength(5)
    expect(w.text()).toContain('Ver menos')
  })

  it('"Desde tu primera sesión" solo aparece con 3 o más sesiones', () => {
    const dos = mount(ProgresoCamino, {
      props: { puntos: [p('a', '2026-01-10T12:00:00.000Z', 3), p('b', '2026-02-10T12:00:00.000Z', 5)] },
    })
    expect(dos.text()).not.toContain('Desde tu primera sesión')

    const tres = mount(ProgresoCamino, {
      props: {
        puntos: [
          p('a', '2026-01-10T12:00:00.000Z', 3),
          p('b', '2026-02-10T12:00:00.000Z', 5),
          p('c', '2026-03-10T12:00:00.000Z', 8),
        ],
      },
    })
    expect(tres.text()).toContain('Desde tu primera sesión')
    expect(tres.text()).toContain('+5')
  })

  it('para el coach/empresa (audiencia coachee) habla en tercera persona', () => {
    const w = mount(ProgresoCamino, {
      props: {
        audiencia: 'coachee',
        puntos: [p('a', '2026-01-10T12:00:00.000Z', 3), p('b', '2026-02-10T12:00:00.000Z', 6), p('c', '2026-03-10T12:00:00.000Z', 8)],
      },
    })

    expect(w.text()).toContain('Muy cerca de su objetivo')
    expect(w.text()).toContain('Autoevaluación del coachee al cerrar la sesión del')
    expect(w.text()).toContain('+2 respecto a la sesión anterior')
    expect(w.text()).toContain('Desde la primera sesión:')
    expect(w.text()).not.toMatch(/\btu\b|\btus\b/i)
  })

  it('audiencia coachee sin sesiones explica cuándo se completa la autoevaluación', () => {
    const w = mount(ProgresoCamino, { props: { audiencia: 'coachee', puntos: [] } })

    expect(w.text()).toContain('se completan cuando el coachee publica un post-sesión')
  })

  it('modo compacto: sin historial ni título de evolución, y con una sola sesión no dibuja escala ni gráfico', () => {
    const una = mount(ProgresoCamino, { props: { compacto: true, puntos: [p('a', '2026-01-10T12:00:00.000Z', 4, 'x')] } })
    expect(una.text()).not.toContain('Sesión a sesión')
    expect(una.text()).not.toContain('Tu evolución')
    expect(una.findComponent(VChart).exists()).toBe(false)
    expect(una.text()).toContain('Con tu próxima sesión empezaremos a dibujar tu evolución')

    const varias = mount(ProgresoCamino, {
      props: { compacto: true, puntos: [p('a', '2026-01-10T12:00:00.000Z', 4), p('b', '2026-02-10T12:00:00.000Z', 6)] },
    })
    expect(varias.findComponent(VChart).exists()).toBe(true)
    expect(varias.findAll('li')).toHaveLength(0)
  })
})
