import { describe, it, expect } from 'vitest'
import { estadoVisual, alertasLegales, totalAlertasLegales } from './legalFormat'
import type { DocumentoLegal, ResumenLegal } from '../api/legal'

const HOY = new Date('2026-08-05T12:00:00')

function doc(overrides: Partial<DocumentoLegal>): DocumentoLegal {
  return {
    estado: 'pendiente',
    fecha: null,
    vigencia: null,
    tieneArchivo: false,
    ...overrides,
  }
}

describe('estadoVisual', () => {
  it('is "pendiente" when estado is pendiente, regardless of dates', () => {
    expect(estadoVisual(doc({ estado: 'pendiente' }), HOY)).toBe('pendiente')
  })

  it('is "firmado" when estado is firmado and there is no vigencia (never contradicts the pill)', () => {
    expect(estadoVisual(doc({ estado: 'firmado', fecha: null, vigencia: null }), HOY)).toBe('firmado')
  })

  it('is "firmado" when estado is firmado and vigencia has not passed yet', () => {
    expect(estadoVisual(doc({ estado: 'firmado', vigencia: '2027-01-01' }), HOY)).toBe('firmado')
  })

  it('is "vencido" when estado is firmado but vigencia already passed', () => {
    expect(estadoVisual(doc({ estado: 'firmado', vigencia: '2026-01-01' }), HOY)).toBe('vencido')
  })
})

const firmado = (): DocumentoLegal => doc({ estado: 'firmado', vigencia: '2099-01-01' })
const pendiente = (): DocumentoLegal => doc({ estado: 'pendiente' })

describe('alertasLegales', () => {
  it('counts pendientes/vencidos across empresas and independientes, and coachees sin consentimiento', () => {
    const resumen: ResumenLegal = {
      empresas: [
        {
          empresaId: 'e1',
          nombre: 'Empresa Uno',
          contrato: firmado(),
          nda: pendiente(),
          coacheesConConsentimiento: 1,
          coacheesTotal: 3,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      independientes: [
        {
          coacheeId: 'c1',
          nombre: 'Independiente Uno',
          contrato: pendiente(),
          nda: doc({ estado: 'firmado', vigencia: '2020-01-01' }),
          consentimientoInformado: false,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    }

    const alertas = alertasLegales(resumen)

    expect(alertas.contratosPendientes).toBe(1)
    expect(alertas.ndaPendientes).toBe(1)
    expect(alertas.vencidos).toBe(1)
    expect(alertas.sinConsentimiento).toBe(3) // 2 coachees de empresa + 1 independiente
    expect(totalAlertasLegales(alertas)).toBe(6)
  })

  it('returns all zeros when there is nothing pending', () => {
    const resumen: ResumenLegal = {
      empresas: [
        {
          empresaId: 'e1',
          nombre: 'Empresa Uno',
          contrato: firmado(),
          nda: firmado(),
          coacheesConConsentimiento: 2,
          coacheesTotal: 2,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      independientes: [],
    }

    const alertas = alertasLegales(resumen)

    expect(totalAlertasLegales(alertas)).toBe(0)
  })
})
