import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DonutChart, { type DonutSegment } from './DonutChart.vue'
import { VChart } from '../lib/echartsCore'
import { colorCategoria } from '../lib/echartsTheme'

const segments: DonutSegment[] = [
  { label: 'Ventas', count: 3, pct: 60, color: 'var(--color-sage)' },
  { label: 'Operaciones', count: 2, pct: 40, color: 'var(--color-bronze)' },
]

function montar(segs = segments) {
  return mount(DonutChart, { props: { segments: segs, centerValue: 5, centerLabel: 'coachees' } })
}

describe('DonutChart', () => {
  it('expone el gráfico como imagen con un aria-label que resume los datos', () => {
    const grafico = montar().find('[role="img"]')

    expect(grafico.exists()).toBe(true)
    const etiqueta = grafico.attributes('aria-label')!
    expect(etiqueta).toContain('5 coachees')
    expect(etiqueta).toContain('Ventas 3 (60%)')
    expect(etiqueta).toContain('Operaciones 2 (40%)')
  })

  it('la leyenda siempre muestra etiqueta, conteo y porcentaje', () => {
    const texto = montar().find('ul').text()

    expect(texto).toContain('Ventas')
    expect(texto).toContain('3 · 60%')
    expect(texto).toContain('2 · 40%')
  })

  it('pasa a VChart un segmento por categoría con borde para separar tonos parecidos', () => {
    const option = montar().findComponent(VChart).props('option') as {
      series: [{ data: Array<{ name: string; value: number; itemStyle: { borderWidth: number } }> }]
    }

    expect(option.series[0].data.map((d) => d.name)).toEqual(['Ventas', 'Operaciones'])
    expect(option.series[0].data[0].itemStyle.borderWidth).toBeGreaterThan(0)
  })
})

describe('colorCategoria', () => {
  it('no repite color en las primeras 12 categorías', () => {
    const colores = Array.from({ length: 12 }, (_, i) => colorCategoria(i))

    expect(new Set(colores).size).toBe(12)
  })
})
