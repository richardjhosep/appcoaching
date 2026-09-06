import { describe, it, expect } from 'vitest'
import { etapaEsCerrada, etapaColor, etapaLabel, ETAPAS_ABIERTAS } from './etapaProspecto'

describe('etapaProspecto', () => {
  it('define una etiqueta y un color para cada etapa', () => {
    for (const etapa of Object.keys(etapaLabel) as (keyof typeof etapaLabel)[]) {
      expect(etapaLabel[etapa]).toBeTruthy()
      expect(etapaColor[etapa]).toBeTruthy()
    }
  })

  it('considera ganado y perdido como etapas cerradas', () => {
    expect(etapaEsCerrada('ganado')).toBe(true)
    expect(etapaEsCerrada('perdido')).toBe(true)
  })

  it('considera contactado, propuesta enviada y negociación como abiertas', () => {
    expect(etapaEsCerrada('contactado')).toBe(false)
    expect(etapaEsCerrada('propuesta_enviada')).toBe(false)
    expect(etapaEsCerrada('negociacion')).toBe(false)
  })

  it('ETAPAS_ABIERTAS no incluye ganado ni perdido', () => {
    expect(ETAPAS_ABIERTAS).not.toContain('ganado')
    expect(ETAPAS_ABIERTAS).not.toContain('perdido')
    expect(ETAPAS_ABIERTAS).toHaveLength(3)
  })
})
