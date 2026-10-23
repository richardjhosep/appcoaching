import { describe, it, expect } from 'vitest'
import { useCarga } from './useCarga'

describe('useCarga', () => {
  it('termina la carga y deja error en null cuando todo sale bien', async () => {
    const { loading, error, recargar } = useCarga(async () => {})
    await recargar()

    expect(loading.value).toBe(false)
    expect(error.value).toBeNull()
  })

  it('no deja loading colgado cuando la carga falla, y expone el mensaje', async () => {
    const { loading, error, recargar } = useCarga(async () => {
      throw new Error('boom')
    })
    await recargar()

    expect(loading.value).toBe(false)
    expect(error.value).toBe('boom')
  })

  it('reintenta: un recargar exitoso tras un fallo limpia el error', async () => {
    let falla = true
    const { error, recargar } = useCarga(async () => {
      if (falla) throw new Error('x')
    })
    await recargar()
    expect(error.value).toBe('x')

    falla = false
    await recargar()
    expect(error.value).toBeNull()
  })

  it('tolerar devuelve undefined y cuenta el fallo sin tumbar la carga', async () => {
    const { error, fallos, recargar, tolerar } = useCarga(async () => {
      const r = await tolerar(Promise.reject(new Error('parcial')))
      expect(r).toBeUndefined()
    })
    await recargar()

    expect(error.value).toBeNull()
    expect(fallos.value).toBe(1)
  })
})
