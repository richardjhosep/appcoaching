import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import WeekCalendar from './WeekCalendar.vue'
import type { Sesion } from '../api/sesiones'

vi.mock('../lib/notify', () => ({
  notifyError: vi.fn(),
  notifySuccess: vi.fn(),
  confirmDialog: vi.fn(),
  confirmSerieDialog: vi.fn(),
}))

vi.mock('../api/sesiones', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../api/sesiones')>()),
  reagendarSesion: vi.fn(),
  cancelarSesion: vi.fn(),
}))

import { confirmDialog, confirmSerieDialog, notifyError, notifySuccess } from '../lib/notify'
import { cancelarSesion, reagendarSesion } from '../api/sesiones'

// Miércoles 10:00 — un día intermedio de la semana, así "una hora antes/después" cae siempre
// el mismo día calendario y dentro de la semana que WeekCalendar muestra por defecto.
const AHORA = new Date(2026, 8, 2, 10, 0, 0)

function sesion(
  id: string,
  opts: { pasada?: boolean; linkVideollamada?: string | null; recurrenciaId?: string | null } = {},
): Sesion {
  const fechaHora = new Date(AHORA)
  fechaHora.setHours(fechaHora.getHours() + (opts.pasada ? -2 : 2))
  return {
    id,
    coacheeId: 'coachee-1',
    fechaHora: fechaHora.toISOString(),
    linkVideollamada: opts.linkVideollamada ?? null,
    recurrenciaId: opts.recurrenciaId ?? null,
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
    vi.mocked(notifySuccess).mockClear()
    vi.mocked(confirmDialog).mockReset()
    vi.mocked(confirmSerieDialog).mockReset()
    vi.mocked(reagendarSesion).mockReset()
    vi.mocked(cancelarSesion).mockReset()
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

  describe('rango de horas dinámico (regresión: sesión antes de las 07:00)', () => {
    it('expande la grilla hacia arriba en vez de renderizar el bloque con top negativo', () => {
      const fecha = new Date(AHORA)
      fecha.setHours(6, 0, 0, 0)
      const s: Sesion = { ...sesion('s1'), fechaHora: fecha.toISOString() }
      const wrapper = mount(WeekCalendar, { props: { sesiones: [s] } })

      // La grilla ahora arranca a las 06:00 (no a las 07:00 por defecto) para que la
      // sesión entre completa, en vez de quedar con un top negativo que se sale por
      // encima de la cabecera de días.
      expect(wrapper.text()).toContain('06:00')
      const boton = wrapper.findAll('button').find((b) => b.text().includes('06:00'))!
      const contenedor = boton.element.parentElement as HTMLElement
      expect(contenedor.style.top).toBe('0px')
    })

    it('mantiene el rango por defecto (07:00 en adelante) cuando todas las sesiones caen dentro de él', () => {
      const wrapper = mount(WeekCalendar, { props: { sesiones: [sesion('s1')] } })

      expect(wrapper.text()).toContain('07:00')
      expect(wrapper.text()).not.toContain('06:00')
    })

    it('expande la grilla hacia abajo cuando hay una sesión a las 21:00 o después (por defecto la grilla termina en 20:00)', () => {
      const fecha = new Date(AHORA)
      fecha.setHours(21, 30, 0, 0)
      const s: Sesion = { ...sesion('s1'), fechaHora: fecha.toISOString() }
      const wrapper = mount(WeekCalendar, { props: { sesiones: [s] } })

      expect(wrapper.text()).toContain('21:00')
    })
  })

  describe('línea de "ahora"', () => {
    it('shows it only on today\'s column, at the right vertical offset', () => {
      const wrapper = mount(WeekCalendar, { props: { sesiones: [] } })

      // AHORA = miércoles 10:00 → columna índice 2 (LUN, MAR, MIÉ…), (10-7)*60 = 180px.
      const lineas = wrapper.findAll('[data-testid="linea-ahora"]')
      expect(lineas).toHaveLength(1)
      expect(lineas[0]!.element.closest('[data-testid="columna-dia-2"]')).toBeTruthy()
      expect((lineas[0]!.element as HTMLElement).style.top).toBe('180px')
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

      // 125px ≈ 2h05min desde las 07:00 → redondeado a los 15 min más cercanos: 09:00.
      await wrapper.find('[data-testid="columna-dia-0"]').trigger('mousedown', { clientY: 125 })
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

      // 120px = 2h00min exactos desde las 07:00 → 09:00, sin necesidad de redondeo.
      await wrapper.find('[data-testid="columna-dia-1"]').trigger('mousedown', { clientY: 120 })
      window.dispatchEvent(new MouseEvent('mousemove', { clientY: 240 }))
      await wrapper.vm.$nextTick()

      expect(wrapper.text()).toContain('09:00')

      window.dispatchEvent(new MouseEvent('mouseup'))
      await wrapper.vm.$nextTick()

      // La vista previa desaparece al soltar, y la hora usada es la de inicio del arrastre.
      const emitido = wrapper.emitted('crear-en')!
      expect(new Date(emitido[0]![0] as string).getHours()).toBe(9)
    })
  })

  describe('avatar del coachee en la agenda general', () => {
    it('muestra un avatar con las iniciales cuando mostrarCoachee está activo', () => {
      const s: Sesion = { ...sesion('s1'), coachee: { id: 'coachee-1', nombre: 'Tomás Reyes' } }
      const wrapper = mount(WeekCalendar, { props: { sesiones: [s], mostrarCoachee: true } })

      const boton = wrapper.findAll('button').find((b) => b.text().includes('Tomás Reyes'))!
      expect(boton.find('[aria-hidden="true"]').text()).toBe('TR')
    })

    it('no muestra avatar cuando mostrarCoachee no está activo (nombreCoachee queda null)', () => {
      const s: Sesion = { ...sesion('s1'), coachee: { id: 'coachee-1', nombre: 'Tomás Reyes' } }
      const wrapper = mount(WeekCalendar, { props: { sesiones: [s] } })

      expect(wrapper.find('[aria-hidden="true"]').exists()).toBe(false)
    })
  })

  describe('mover una sesión arrastrando su bloque', () => {
    it('a plain click (no real movement) still opens the link even with puedeEditar set', async () => {
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
      const wrapper = mount(WeekCalendar, {
        props: {
          sesiones: [sesion('s1', { linkVideollamada: 'https://meet.example.com/x' })],
          puedeEditar: true,
        },
      })

      const boton = wrapper.find('button[title="Abrir enlace de la videollamada"]')
      await boton.trigger('mousedown')
      await boton.trigger('click')

      expect(openSpy).toHaveBeenCalledWith('https://meet.example.com/x', '_blank', 'noopener')
      expect(reagendarSesion).not.toHaveBeenCalled()
      openSpy.mockRestore()
    })

    it('does nothing when mousedown/mouseup happen without crossing the drag threshold', async () => {
      const wrapper = mount(WeekCalendar, {
        props: { sesiones: [sesion('s1')], puedeEditar: true },
      })

      // s1 está a AHORA+2h = 12:00, bloque.top = (12-7)*48 = 240.
      await wrapper.find('button').trigger('mousedown', { clientX: 0, clientY: 0 })
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 2, clientY: 2 })) // < UMBRAL_ARRASTRE_PX
      window.dispatchEvent(new MouseEvent('mouseup'))
      await flushPromises()

      expect(reagendarSesion).not.toHaveBeenCalled()
    })

    it('saves immediately with the new time when a non-recurring session is dragged past the threshold', async () => {
      vi.mocked(reagendarSesion).mockResolvedValue(sesion('s1'))
      const wrapper = mount(WeekCalendar, {
        props: { sesiones: [sesion('s1')], puedeEditar: true },
      })

      const boton = wrapper.findAll('button').find((b) => b.text().includes('12:00'))!
      await boton.trigger('mousedown', { clientX: 0, clientY: 0 })
      // deltaY = 60px = +1h (ALTO_HORA) respecto a los 12:00 originales → 13:00.
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 0, clientY: 60 }))
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[data-testid="ghost-arrastre-sesion"]').exists()).toBe(true)

      window.dispatchEvent(new MouseEvent('mouseup', { clientX: 0, clientY: 60 }))
      await flushPromises()

      expect(reagendarSesion).toHaveBeenCalledTimes(1)
      const [id, nuevaFecha, link, aplicarASerie] = vi.mocked(reagendarSesion).mock.calls[0]!
      expect(id).toBe('s1')
      expect(new Date(nuevaFecha).getHours()).toBe(13)
      expect(link).toBeUndefined()
      expect(aplicarASerie).toBeUndefined()
      expect(wrapper.emitted('reagendada')).toHaveLength(1)
      expect(wrapper.find('[data-testid="ghost-arrastre-sesion"]').exists()).toBe(false)
    })

    it('asks solo-esta/toda-la-serie before saving when the dragged session belongs to a recurring series', async () => {
      vi.mocked(confirmSerieDialog).mockResolvedValue('toda-serie')
      vi.mocked(reagendarSesion).mockResolvedValue(sesion('s1', { recurrenciaId: 'serie-1' }))
      const wrapper = mount(WeekCalendar, {
        props: { sesiones: [sesion('s1', { recurrenciaId: 'serie-1' })], puedeEditar: true },
      })

      const boton = wrapper.findAll('button').find((b) => b.text().includes('12:00'))!
      await boton.trigger('mousedown', { clientX: 0, clientY: 0 })
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 0, clientY: 48 }))
      window.dispatchEvent(new MouseEvent('mouseup', { clientX: 0, clientY: 48 }))
      await flushPromises()

      expect(confirmSerieDialog).toHaveBeenCalledTimes(1)
      expect(reagendarSesion).toHaveBeenCalledTimes(1)
      const [, , , aplicarASerie] = vi.mocked(reagendarSesion).mock.calls[0]!
      expect(aplicarASerie).toBe(true)
    })

    it('does nothing when the solo-esta/toda-la-serie prompt is dismissed', async () => {
      vi.mocked(confirmSerieDialog).mockResolvedValue(null)
      const wrapper = mount(WeekCalendar, {
        props: { sesiones: [sesion('s1', { recurrenciaId: 'serie-1' })], puedeEditar: true },
      })

      const boton = wrapper.findAll('button').find((b) => b.text().includes('12:00'))!
      await boton.trigger('mousedown', { clientX: 0, clientY: 0 })
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 0, clientY: 48 }))
      window.dispatchEvent(new MouseEvent('mouseup', { clientX: 0, clientY: 48 }))
      await flushPromises()

      expect(reagendarSesion).not.toHaveBeenCalled()
      expect(wrapper.emitted('reagendada')).toBeUndefined()
    })

    it('shows an error notification and does not emit reagendada when the API call fails', async () => {
      vi.mocked(reagendarSesion).mockRejectedValue(new Error('boom'))
      const wrapper = mount(WeekCalendar, {
        props: { sesiones: [sesion('s1')], puedeEditar: true },
      })

      const boton = wrapper.findAll('button').find((b) => b.text().includes('12:00'))!
      await boton.trigger('mousedown', { clientX: 0, clientY: 0 })
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 0, clientY: 48 }))
      window.dispatchEvent(new MouseEvent('mouseup', { clientX: 0, clientY: 48 }))
      await flushPromises()

      expect(notifyError).toHaveBeenCalledWith('No se pudo mover la sesión', 'Intenta de nuevo.')
      expect(wrapper.emitted('reagendada')).toBeUndefined()
    })
  })

  describe('eliminar una sesión desde el calendario', () => {
    it('does not show the trash icon unless puedeEditar is set', () => {
      const wrapper = mount(WeekCalendar, { props: { sesiones: [sesion('s1')] } })

      expect(wrapper.find('button[title="Eliminar esta sesión"]').exists()).toBe(false)
    })

    it('asks a plain yes/no and deletes a non-recurring session on confirm', async () => {
      vi.mocked(confirmDialog).mockResolvedValue(true)
      vi.mocked(cancelarSesion).mockResolvedValue({ eliminadas: 1 })
      const wrapper = mount(WeekCalendar, {
        props: { sesiones: [sesion('s1')], puedeEditar: true },
      })

      await wrapper.find('button[title="Eliminar esta sesión"]').trigger('click')
      await flushPromises()

      expect(confirmDialog).toHaveBeenCalledWith(
        expect.objectContaining({ title: '¿Eliminar esta sesión?', danger: true }),
      )
      expect(confirmSerieDialog).not.toHaveBeenCalled()
      expect(cancelarSesion).toHaveBeenCalledWith('s1', false)
      expect(notifySuccess).toHaveBeenCalledWith('Sesión eliminada')
      expect(wrapper.emitted('eliminada')).toEqual([['s1']])
    })

    it('does not delete when the plain confirm is dismissed', async () => {
      vi.mocked(confirmDialog).mockResolvedValue(false)
      const wrapper = mount(WeekCalendar, {
        props: { sesiones: [sesion('s1')], puedeEditar: true },
      })

      await wrapper.find('button[title="Eliminar esta sesión"]').trigger('click')
      await flushPromises()

      expect(cancelarSesion).not.toHaveBeenCalled()
      expect(wrapper.emitted('eliminada')).toBeUndefined()
    })

    it('asks solo-esta/toda-la-serie (not the plain confirm) for a recurring session', async () => {
      vi.mocked(confirmSerieDialog).mockResolvedValue('toda-serie')
      vi.mocked(cancelarSesion).mockResolvedValue({ eliminadas: 3 })
      const wrapper = mount(WeekCalendar, {
        props: { sesiones: [sesion('s1', { recurrenciaId: 'serie-1' })], puedeEditar: true },
      })

      await wrapper.find('button[title="Eliminar esta sesión"]').trigger('click')
      await flushPromises()

      expect(confirmDialog).not.toHaveBeenCalled()
      expect(cancelarSesion).toHaveBeenCalledWith('s1', true)
      expect(notifySuccess).toHaveBeenCalledWith('Sesiones eliminadas')
      expect(wrapper.emitted('eliminada')).toEqual([['s1']])
    })

    it('does not delete when the solo-esta/toda-la-serie prompt is dismissed', async () => {
      vi.mocked(confirmSerieDialog).mockResolvedValue(null)
      const wrapper = mount(WeekCalendar, {
        props: { sesiones: [sesion('s1', { recurrenciaId: 'serie-1' })], puedeEditar: true },
      })

      await wrapper.find('button[title="Eliminar esta sesión"]').trigger('click')
      await flushPromises()

      expect(cancelarSesion).not.toHaveBeenCalled()
      expect(wrapper.emitted('eliminada')).toBeUndefined()
    })

    it('shows an error notification and does not emit eliminada when the API call fails', async () => {
      vi.mocked(confirmDialog).mockResolvedValue(true)
      vi.mocked(cancelarSesion).mockRejectedValue(new Error('boom'))
      const wrapper = mount(WeekCalendar, {
        props: { sesiones: [sesion('s1')], puedeEditar: true },
      })

      await wrapper.find('button[title="Eliminar esta sesión"]').trigger('click')
      await flushPromises()

      expect(notifyError).toHaveBeenCalledWith('No se pudo eliminar la sesión', 'Intenta de nuevo.')
      expect(wrapper.emitted('eliminada')).toBeUndefined()
    })
  })
})
