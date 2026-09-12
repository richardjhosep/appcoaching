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

  it('does not show the reagendar pencil unless puedeEditar is set', () => {
    const wrapper = mount(WeekCalendar, { props: { sesiones: [sesion('s1')] } })

    expect(wrapper.find('button[title="Reagendar esta sesión"]').exists()).toBe(false)
  })

  it('emits reagendar (not select nor a link open) when the pencil is clicked on a future session', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    const wrapper = mount(WeekCalendar, {
      props: {
        sesiones: [sesion('s1', { linkVideollamada: 'https://meet.example.com/x' })],
        puedeEditar: true,
      },
    })

    await wrapper.find('button[title="Reagendar esta sesión"]').trigger('click')

    expect(wrapper.emitted('reagendar')).toEqual([['s1']])
    expect(openSpy).not.toHaveBeenCalled()
    expect(wrapper.emitted('select')).toBeUndefined()
    openSpy.mockRestore()
  })

  it('emits reagendar for a past session too, alongside select', async () => {
    const wrapper = mount(WeekCalendar, {
      props: { sesiones: [sesion('s1', { pasada: true })], puedeEditar: true },
    })

    await wrapper.find('button[title="Reagendar esta sesión"]').trigger('click')

    expect(wrapper.emitted('reagendar')).toEqual([['s1']])
    expect(wrapper.emitted('select')).toBeUndefined()
  })

  describe('línea de "ahora"', () => {
    it('shows it only on today\'s column, at the right vertical offset', () => {
      const wrapper = mount(WeekCalendar, { props: { sesiones: [] } })

      // AHORA = miércoles 10:00 → columna índice 2 (LUN, MAR, MIÉ…), (10-7)*48 = 144px.
      const lineas = wrapper.findAll('[data-testid="linea-ahora"]')
      expect(lineas).toHaveLength(1)
      expect(lineas[0]!.element.closest('[data-testid="columna-dia-2"]')).toBeTruthy()
      expect((lineas[0]!.element as HTMLElement).style.top).toBe('144px')
    })

    it('hides it when the current time falls outside the visible hour range', () => {
      vi.setSystemTime(new Date(2026, 8, 2, 22, 0, 0)) // 22:00, después de HORA_FIN=21
      const wrapper = mount(WeekCalendar, { props: { sesiones: [] } })

      expect(wrapper.find('[data-testid="linea-ahora"]').exists()).toBe(false)
    })
  })

  describe('crear sesión con clic/arrastre sobre un slot vacío', () => {
    it('does not react to a click on an empty slot unless puedeAgendar is set', async () => {
      const wrapper = mount(WeekCalendar, { props: { sesiones: [] } })

      await wrapper.find('[data-testid="columna-dia-0"]').trigger('mousedown', { clientY: 96 })
      window.dispatchEvent(new MouseEvent('mouseup'))

      expect(wrapper.emitted('crear-en')).toBeUndefined()
    })

    it('emits crear-en with the time snapped to the nearest 15 minutes on a plain click', async () => {
      const wrapper = mount(WeekCalendar, { props: { sesiones: [], puedeAgendar: true } })

      // 100px ≈ 2h05min desde las 07:00 → redondeado a los 15 min más cercanos: 09:00.
      await wrapper.find('[data-testid="columna-dia-0"]').trigger('mousedown', { clientY: 100 })
      window.dispatchEvent(new MouseEvent('mouseup'))

      const emitido = wrapper.emitted('crear-en')
      expect(emitido).toHaveLength(1)
      const fecha = new Date(emitido![0]![0] as string)
      expect(fecha.getHours()).toBe(9)
      expect(fecha.getMinutes()).toBe(0)
    })

    it('does not start a drag when mousedown lands on an existing session block', async () => {
      const wrapper = mount(WeekCalendar, {
        props: { sesiones: [sesion('s1', { linkVideollamada: 'https://meet.example.com/x' })], puedeAgendar: true },
      })

      await wrapper.find('button[title="Abrir enlace de la videollamada"]').trigger('mousedown')
      window.dispatchEvent(new MouseEvent('mouseup'))

      expect(wrapper.emitted('crear-en')).toBeUndefined()
    })

    it('shows a dashed preview block that follows the drag and clears it on release', async () => {
      const wrapper = mount(WeekCalendar, { props: { sesiones: [], puedeAgendar: true } })

      await wrapper.find('[data-testid="columna-dia-1"]').trigger('mousedown', { clientY: 96 })
      window.dispatchEvent(new MouseEvent('mousemove', { clientY: 192 }))
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('09:00')

      window.dispatchEvent(new MouseEvent('mouseup'))
      await wrapper.vm.$nextTick()

      // La vista previa desaparece al soltar, y la hora usada es la de inicio del arrastre.
      const emitido = wrapper.emitted('crear-en')!
      expect(new Date(emitido[0]![0] as string).getHours()).toBe(9)
    })
  })
})
