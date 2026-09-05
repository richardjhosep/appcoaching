import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import WeekCalendar from './WeekCalendar.vue'
import type { Sesion } from '../api/sesiones'

vi.mock('../lib/notify', () => ({
  notifyError: vi.fn(),
}))

import { notifyError } from '../lib/notify'

// Miércoles 10:00 — un día intermedio de la semana, así "una hora antes/después" cae siempre
// el mismo día calendario y dentro de la semana que WeekCalendar muestra por defecto.
const AHORA = new Date(2026, 8, 2, 10, 0, 0)

function sesion(id: string, opts: { pasada?: boolean; linkVideollamada?: string | null } = {}): Sesion {
  const fechaHora = new Date(AHORA)
  fechaHora.setHours(fechaHora.getHours() + (opts.pasada ? -2 : 2))
  return {
    id,
    coacheeId: 'coachee-1',
    fechaHora: fechaHora.toISOString(),
    linkVideollamada: opts.linkVideollamada ?? null,
    resumenCompartido: null,
    confirmada: true,
    postSesion: null,
  }
}

describe('WeekCalendar', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(AHORA)
    vi.mocked(notifyError).mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('opens the videollamada link when clicking a future session that has one', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    const wrapper = mount(WeekCalendar, {
      props: { sesiones: [sesion('s1', { linkVideollamada: 'https://meet.example.com/x' })] },
    })

    await wrapper.find('button[title="Abrir enlace de la videollamada"]').trigger('click')

    expect(openSpy).toHaveBeenCalledWith('https://meet.example.com/x', '_blank', 'noopener')
    expect(notifyError).not.toHaveBeenCalled()
    openSpy.mockRestore()
  })

  it('shows a notification instead of doing nothing when a future session has no link', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    const wrapper = mount(WeekCalendar, { props: { sesiones: [sesion('s1', { linkVideollamada: null })] } })

    const boton = wrapper.find('button[title="Sin enlace de videollamada registrado"]')
    expect(boton.exists()).toBe(true)
    await boton.trigger('click')

    expect(openSpy).not.toHaveBeenCalled()
    expect(notifyError).toHaveBeenCalledWith(
      'Sin enlace de videollamada',
      'Esta sesión todavía no tiene un enlace de videollamada registrado.',
    )
    openSpy.mockRestore()
  })

  it('does not emit select for a future session without a link (nothing to scroll to)', async () => {
    const wrapper = mount(WeekCalendar, { props: { sesiones: [sesion('s1', { linkVideollamada: null })] } })

    await wrapper.find('button[title="Sin enlace de videollamada registrado"]').trigger('click')

    expect(wrapper.emitted('select')).toBeUndefined()
  })

  it('emits select (not a link open) for a past session', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    const wrapper = mount(WeekCalendar, {
      props: { sesiones: [sesion('s1', { pasada: true, linkVideollamada: 'https://meet.example.com/x' })] },
    })

    // Una sesión pasada no lleva `title` (solo las futuras lo tienen) — se identifica por su
    // hora renderizada en vez de por el atributo.
    const boton = wrapper.findAll('button').find((b) => b.text().includes('08:00'))!
    await boton.trigger('click')

    expect(openSpy).not.toHaveBeenCalled()
    expect(wrapper.emitted('select')).toEqual([['s1']])
    openSpy.mockRestore()
  })
})
