import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount, flushPromises, DOMWrapper } from '@vue/test-utils'
import ReagendarSesionModal from './ReagendarSesionModal.vue'
import { ApiError } from '../api/client'
import type { Sesion } from '../api/sesiones'

vi.mock('../api/sesiones', async () => {
  const actual = await vi.importActual<typeof import('../api/sesiones')>('../api/sesiones')
  return { ...actual, reagendarSesion: vi.fn() }
})

import { reagendarSesion } from '../api/sesiones'

const sesion: Sesion = {
  id: 's1',
  coacheeId: 'c1',
  fechaHora: '2026-09-15T15:00:00.000Z',
  linkVideollamada: 'https://meet.example.com/x',
  resumenCompartido: null,
  confirmada: true,
  postSesion: null,
  coachee: { id: 'c1', nombre: 'Ana Pérez' },
}

describe('ReagendarSesionModal', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('pre-fills the current date/time and link, and shows who the session belongs to', () => {
    mount(ReagendarSesionModal, { props: { sesion } })

    const modal = new DOMWrapper(document.body)
    expect(modal.text()).toContain('Ana Pérez')
    expect((modal.find('input[type="datetime-local"]').element as HTMLInputElement).value).toBeTruthy()
    expect((modal.find('input[type="url"]').element as HTMLInputElement).value).toBe(
      'https://meet.example.com/x',
    )
  })

  it('reagenda la sesión y emite "reagendada" con el resultado', async () => {
    const actualizada = { ...sesion, fechaHora: '2026-09-16T15:00:00.000Z' }
    vi.mocked(reagendarSesion).mockResolvedValue(actualizada)

    const wrapper = mount(ReagendarSesionModal, { props: { sesion } })
    const modal = new DOMWrapper(document.body)

    await modal.find('input[type="datetime-local"]').setValue('2026-09-16T12:00')
    await modal.find('form').trigger('submit')
    await flushPromises()

    expect(reagendarSesion).toHaveBeenCalledWith(
      's1',
      new Date('2026-09-16T12:00').toISOString(),
      'https://meet.example.com/x',
      undefined,
    )
    expect(wrapper.emitted('reagendada')).toEqual([[actualizada]])
  })

  it('no muestra la opción "esta y las futuras" para una sesión suelta', () => {
    mount(ReagendarSesionModal, { props: { sesion } })

    const modal = new DOMWrapper(document.body)
    expect(modal.text()).not.toContain('esta y las futuras sesiones de la serie')
  })

  it('muestra la opción "esta y las futuras" para una sesión de una serie, y la aplica al guardar', async () => {
    const sesionDeSerie: Sesion = { ...sesion, recurrenciaId: 'rec-1' }
    const actualizada = { ...sesionDeSerie, fechaHora: '2026-09-16T15:00:00.000Z' }
    vi.mocked(reagendarSesion).mockResolvedValue(actualizada)

    const wrapper = mount(ReagendarSesionModal, { props: { sesion: sesionDeSerie } })
    const modal = new DOMWrapper(document.body)

    expect(modal.text()).toContain('esta y las futuras sesiones de la serie')

    await modal.find('input[type="datetime-local"]').setValue('2026-09-16T12:00')
    await modal.find('input[type="checkbox"]').setValue(true)
    await modal.find('form').trigger('submit')
    await flushPromises()

    expect(reagendarSesion).toHaveBeenCalledWith(
      's1',
      new Date('2026-09-16T12:00').toISOString(),
      'https://meet.example.com/x',
      true,
    )
    expect(wrapper.emitted('reagendada')).toEqual([[actualizada]])
  })

  it('shows the API error message instead of emitting on failure', async () => {
    vi.mocked(reagendarSesion).mockRejectedValue(new ApiError(409, 'Ya existe una sesión agendada que se superpone.'))

    const wrapper = mount(ReagendarSesionModal, { props: { sesion } })
    const modal = new DOMWrapper(document.body)

    await modal.find('form').trigger('submit')
    await flushPromises()

    expect(modal.text()).toContain('Ya existe una sesión agendada que se superpone.')
    expect(wrapper.emitted('reagendada')).toBeUndefined()
  })

  it('emits "close" when cancelled', async () => {
    const wrapper = mount(ReagendarSesionModal, { props: { sesion } })
    const modal = new DOMWrapper(document.body)

    const cancelarBtn = modal.findAll('button').find((b) => b.text() === 'Cancelar')
    await cancelarBtn!.trigger('click')

    expect(wrapper.emitted('close')).toHaveLength(1)
  })
})
