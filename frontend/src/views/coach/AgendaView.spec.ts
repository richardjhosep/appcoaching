import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises, DOMWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import AgendaView from './AgendaView.vue'
import type { Sesion } from '../../api/sesiones'
import type { CoacheeListItem } from '../../api/coachees'

vi.mock('../../api/sesiones', async () => {
  const actual = await vi.importActual<typeof import('../../api/sesiones')>('../../api/sesiones')
  return { ...actual, getTodasLasSesiones: vi.fn(), reagendarSesion: vi.fn(), agendarSesion: vi.fn() }
})
vi.mock('../../api/disponibilidad', async () => {
  const actual = await vi.importActual<typeof import('../../api/disponibilidad')>('../../api/disponibilidad')
  return { ...actual, listBloquesDisponibilidad: vi.fn() }
})
vi.mock('../../api/solicitudes-sesion', async () => {
  const actual = await vi.importActual<typeof import('../../api/solicitudes-sesion')>('../../api/solicitudes-sesion')
  return { ...actual, getSolicitudesSesionPendientes: vi.fn() }
})
vi.mock('../../api/coachees', async () => {
  const actual = await vi.importActual<typeof import('../../api/coachees')>('../../api/coachees')
  return { ...actual, listCoachees: vi.fn() }
})

import { getTodasLasSesiones, reagendarSesion, agendarSesion } from '../../api/sesiones'
import { listBloquesDisponibilidad } from '../../api/disponibilidad'
import { getSolicitudesSesionPendientes } from '../../api/solicitudes-sesion'
import { listCoachees } from '../../api/coachees'

const coacheeActivo: CoacheeListItem = {
  id: 'coachee-1',
  nombre: 'Tomás Reyes',
  empresaId: null,
  consentimientoInformado: false,
  consentimientoFecha: null,
  activo: true,
}

describe('AgendaView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(listBloquesDisponibilidad).mockResolvedValue([])
    vi.mocked(getSolicitudesSesionPendientes).mockResolvedValue([])
    vi.mocked(listCoachees).mockResolvedValue([coacheeActivo])
    vi.mocked(getTodasLasSesiones).mockResolvedValue([])
  })

  it('reagenda una sesión desde el calendario general del coach y refresca la vista', async () => {
    // Hoy a una hora fija — garantiza que caiga en la semana que muestra el calendario
    // sin importar qué día de la semana real se ejecute el test.
    const hoy = new Date()
    hoy.setHours(11, 0, 0, 0)
    const sesionHoy: Sesion = {
      id: 'sesion-1',
      coacheeId: 'coachee-1',
      fechaHora: hoy.toISOString(),
      linkVideollamada: null,
      resumenCompartido: null,
      confirmada: true,
      postSesion: null,
      coachee: { id: 'coachee-1', nombre: 'Tomás Reyes' },
    }
    vi.mocked(getTodasLasSesiones).mockResolvedValue([sesionHoy])
    const actualizada = { ...sesionHoy, fechaHora: new Date(hoy.getTime() + 3_600_000).toISOString() }
    vi.mocked(reagendarSesion).mockResolvedValue(actualizada)

    const wrapper = mount(AgendaView)
    await flushPromises()

    // Antes de esta funcionalidad, hacer clic en una sesión de la agenda general no hacía
    // nada — este lápiz es lo nuevo que la habilita.
    const lapiz = wrapper.find('button[title="Reagendar esta sesión"]')
    expect(lapiz.exists()).toBe(true)
    await lapiz.trigger('click')
    await flushPromises()

    const modal = new DOMWrapper(document.body)
    expect(modal.text()).toContain('Reagendar sesión')
    expect(modal.text()).toContain('Tomás Reyes')

    await modal.find('form').trigger('submit')
    await flushPromises()

    expect(reagendarSesion).toHaveBeenCalledWith('sesion-1', expect.any(String), undefined)
    expect(document.body.textContent).not.toContain('Reagendar sesión')
  })

  it('muestra "+ Nueva sesión" y agenda eligiendo un coachee desde un modal vacío', async () => {
    const nueva: Sesion = {
      id: 'sesion-nueva',
      coacheeId: 'coachee-1',
      fechaHora: '2026-09-20T15:00:00.000Z',
      linkVideollamada: null,
      resumenCompartido: null,
      confirmada: false,
      postSesion: null,
      coachee: { id: 'coachee-1', nombre: 'Tomás Reyes' },
    }
    vi.mocked(agendarSesion).mockResolvedValue(nueva)

    const wrapper = mount(AgendaView)
    await flushPromises()

    const nuevaBtn = wrapper.findAll('button').find((b) => b.text() === '+ Nueva sesión')
    expect(nuevaBtn).toBeTruthy()
    await nuevaBtn!.trigger('click')
    await flushPromises()

    const modal = new DOMWrapper(document.body)
    expect(modal.text()).toContain('Agendar sesión')
    // El input de fecha empieza vacío — no viene de ningún slot pre-elegido.
    expect((modal.find('input[type="datetime-local"]').element as HTMLInputElement).value).toBe('')

    await modal.find('select').setValue('coachee-1')
    await modal.find('input[type="datetime-local"]').setValue('2026-09-20T12:00')
    await modal.find('form').trigger('submit')
    await flushPromises()

    expect(agendarSesion).toHaveBeenCalledWith(
      'coachee-1',
      new Date('2026-09-20T12:00').toISOString(),
      undefined,
    )
    expect(document.body.textContent).not.toContain('Agendar sesión')
  })

  it('abre el modal de nueva sesión pre-llenado al hacer clic sobre un slot vacío del calendario', async () => {
    const wrapper = mount(AgendaView)
    await flushPromises()

    // Clic simple (mousedown+mouseup en el mismo punto) sobre la grilla, sin sesión debajo.
    const grilla = wrapper.find('.cursor-crosshair')
    expect(grilla.exists()).toBe(true)
    await grilla.trigger('mousedown', { clientY: 96 }) // 07:00 + 2h = 09:00
    window.dispatchEvent(new MouseEvent('mouseup'))
    await flushPromises()

    const modal = new DOMWrapper(document.body)
    expect(modal.text()).toContain('Agendar sesión')
    const input = modal.find('input[type="datetime-local"]').element as HTMLInputElement
    expect(input.value).not.toBe('')
    expect(input.value.endsWith('T09:00')).toBe(true)
  })
})
