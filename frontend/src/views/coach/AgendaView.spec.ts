import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises, DOMWrapper, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import AgendaView from './AgendaView.vue'
import type { Sesion } from '../../api/sesiones'
import type { CoacheeListItem } from '../../api/coachees'

vi.mock('../../api/sesiones', async () => {
  const actual = await vi.importActual<typeof import('../../api/sesiones')>('../../api/sesiones')
  return {
    ...actual,
    getTodasLasSesiones: vi.fn(),
    reagendarSesion: vi.fn(),
    agendarSesion: vi.fn(),
    agendarSerieSesiones: vi.fn(),
  }
})
vi.mock('../../api/disponibilidad', async () => {
  const actual = await vi.importActual<typeof import('../../api/disponibilidad')>('../../api/disponibilidad')
  return { ...actual, listBloquesDisponibilidad: vi.fn(), eliminarBloqueDisponibilidad: vi.fn() }
})
vi.mock('../../api/solicitudes-sesion', async () => {
  const actual = await vi.importActual<typeof import('../../api/solicitudes-sesion')>('../../api/solicitudes-sesion')
  return { ...actual, getSolicitudesSesionPendientes: vi.fn() }
})
vi.mock('../../api/coachees', async () => {
  const actual = await vi.importActual<typeof import('../../api/coachees')>('../../api/coachees')
  return { ...actual, listCoachees: vi.fn() }
})

import { getTodasLasSesiones, reagendarSesion, agendarSesion, agendarSerieSesiones } from '../../api/sesiones'
import { listBloquesDisponibilidad, eliminarBloqueDisponibilidad, type BloqueDisponibilidad } from '../../api/disponibilidad'
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
  let wrapper: VueWrapper

  afterEach(() => {
    // AppModal renderiza vía Teleport a <body> — sin desmontar, un modal dejado abierto
    // por un test (ej. el que abre "Nueva sesión" y nunca lo envía) queda en el DOM y
    // contamina los `.find()` del siguiente test.
    wrapper?.unmount()
  })

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

    wrapper = mount(AgendaView)
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

    expect(reagendarSesion).toHaveBeenCalledWith('sesion-1', expect.any(String), undefined, undefined)
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

    wrapper = mount(AgendaView)
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
    wrapper = mount(AgendaView)
    await flushPromises()

    // Clic simple (mousedown+mouseup en el mismo punto) sobre la grilla, sin sesión debajo.
    const grilla = wrapper.find('.cursor-grab')
    expect(grilla.exists()).toBe(true)
    await grilla.trigger('mousedown', { clientY: 120 }) // 07:00 + 2h = 09:00
    window.dispatchEvent(new MouseEvent('mouseup'))
    await flushPromises()

    const modal = new DOMWrapper(document.body)
    expect(modal.text()).toContain('Agendar sesión')
    const input = modal.find('input[type="datetime-local"]').element as HTMLInputElement
    expect(input.value).not.toBe('')
    expect(input.value.endsWith('T09:00')).toBe(true)
  })

  it('agenda una serie semanal cuando se marca "Repetir semanalmente"', async () => {
    const serie: Sesion[] = [1, 2, 3].map((n) => ({
      id: `sesion-${n}`,
      coacheeId: 'coachee-1',
      fechaHora: `2026-09-${20 + (n - 1) * 7}T15:00:00.000Z`,
      linkVideollamada: null,
      recurrenciaId: 'rec-1',
      resumenCompartido: null,
      confirmada: false,
      postSesion: null,
      coachee: { id: 'coachee-1', nombre: 'Tomás Reyes' },
    }))
    vi.mocked(agendarSerieSesiones).mockResolvedValue(serie)

    wrapper = mount(AgendaView)
    await flushPromises()

    const nuevaBtn = wrapper.findAll('button').find((b) => b.text() === '+ Nueva sesión')
    await nuevaBtn!.trigger('click')
    await flushPromises()

    const modal = new DOMWrapper(document.body)
    await modal.find('select').setValue('coachee-1')
    await modal.find('input[type="datetime-local"]').setValue('2026-09-20T12:00')
    await modal.find('input[type="checkbox"]').setValue(true)
    await modal.find('input[type="number"]').setValue(3)
    await modal.find('form').trigger('submit')
    await flushPromises()

    // (Este spec no usa `clearMocks`, así que no se afirma "agendarSesion NO se llamó" —
    // otro test del archivo sí lo llama y ese historial persiste entre tests.)
    expect(agendarSerieSesiones).toHaveBeenCalledWith(
      'coachee-1',
      new Date('2026-09-20T12:00').toISOString(),
      3,
      undefined,
    )
    expect(document.body.textContent).not.toContain('Agendar sesión')
  })

  describe('KPIs de la cabecera', () => {
    it('cuenta sesiones agendadas (futuras), las de esta semana y los clientes únicos', async () => {
      // Relativo a "ahora" real (Date.now()), no a una hora fija del día — a diferencia de
      // otros tests de este archivo, este no puede usar un mediodía fijo porque el
      // componente compara contra Date.now() real, no contra un reloj mockeado: fijar
      // "hoy" a las 11:00 rompía el test cada vez que corría después de esa hora (una
      // sesión "en una hora" quedaba en el pasado respecto al reloj real).
      const hoy = new Date()
      const enUnaHora = new Date(hoy.getTime() + 3_600_000)
      const enDosMeses = new Date(hoy.getTime() + 60 * 24 * 3_600_000)
      const ayer = new Date(hoy.getTime() - 24 * 3_600_000)
      const sesionesMock: Sesion[] = [
        // Futura, esta semana, coachee-1.
        { id: 's1', coacheeId: 'coachee-1', fechaHora: enUnaHora.toISOString(), linkVideollamada: null, resumenCompartido: null, confirmada: true, postSesion: null },
        // Futura, esta semana, coachee-2 (cliente distinto).
        { id: 's2', coacheeId: 'coachee-2', fechaHora: enUnaHora.toISOString(), linkVideollamada: null, resumenCompartido: null, confirmada: true, postSesion: null },
        // Futura pero fuera de esta semana calendario.
        { id: 's3', coacheeId: 'coachee-1', fechaHora: enDosMeses.toISOString(), linkVideollamada: null, resumenCompartido: null, confirmada: true, postSesion: null },
        // Pasada — no debe contar en ningún KPI.
        { id: 's4', coacheeId: 'coachee-3', fechaHora: ayer.toISOString(), linkVideollamada: null, resumenCompartido: null, confirmada: true, postSesion: null },
      ]
      vi.mocked(getTodasLasSesiones).mockResolvedValue(sesionesMock)

      wrapper = mount(AgendaView)
      await flushPromises()

      expect(wrapper.text()).toContain('Sesiones agendadas')
      // 3 futuras (s1, s2, s3) — s4 es pasada.
      const sesionesAgendadas = wrapper.findAll('p.font-\\[family-name\\:var\\(--font-mono\\)\\]')[0]!
      expect(sesionesAgendadas.text()).toBe('3')
      // Esta semana: s1 y s2 (s3 cae dos meses después).
      const estaSemana = wrapper.findAll('p.font-\\[family-name\\:var\\(--font-mono\\)\\]')[1]!
      expect(estaSemana.text()).toBe('2')
      // Clientes únicos entre las 3 futuras: coachee-1 y coachee-2 (coachee-3 solo tiene la pasada).
      const clientes = wrapper.findAll('p.font-\\[family-name\\:var\\(--font-mono\\)\\]')[2]!
      expect(clientes.text()).toBe('2')
    })
  })

  describe('Disponibilidad semanal como tarjetas por día', () => {
    function bloque(id: string, diaSemana: number, horaInicio: string, horaFin: string): BloqueDisponibilidad {
      return { id, diaSemana, horaInicio, horaFin, createdAt: '2026-01-01T00:00:00.000Z' }
    }

    it('muestra las 7 tarjetas de día empezando en lunes, con "Sin disponibilidad" donde no hay bloques', async () => {
      // diaSemana=1 → martes (0=domingo..6=sábado, misma codificación que el backend).
      vi.mocked(listBloquesDisponibilidad).mockResolvedValue([bloque('b1', 2, '18:00', '20:00')])

      wrapper = mount(AgendaView)
      await flushPromises()

      const titulos = wrapper.findAll('h4').map((h) => h.text())
      expect(titulos).toEqual(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'])
      expect(wrapper.text()).toContain('18:00–20:00')
      // 6 de los 7 días no tienen bloques.
      expect(wrapper.findAll('*').filter((w) => w.text() === 'Sin disponibilidad')).toHaveLength(6)
    })

    it('elimina un bloque al hacer clic en "Quitar" dentro de su tarjeta de día', async () => {
      vi.mocked(listBloquesDisponibilidad).mockResolvedValue([bloque('b1', 2, '18:00', '20:00')])
      vi.mocked(eliminarBloqueDisponibilidad).mockResolvedValue(undefined)

      wrapper = mount(AgendaView)
      await flushPromises()

      expect(wrapper.text()).toContain('18:00–20:00')
      const quitar = wrapper.findAll('button').find((b) => b.text() === 'Quitar')!
      await quitar.trigger('click')
      await flushPromises()

      expect(eliminarBloqueDisponibilidad).toHaveBeenCalledWith('b1')
      expect(wrapper.text()).not.toContain('18:00–20:00')
    })
  })
})
