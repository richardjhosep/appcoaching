import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises, DOMWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SesionesView from './SesionesView.vue'
import type { Sesion } from '../../api/sesiones'
import { inicioDeSemana } from '../../lib/dateRange'

vi.mock('../../api/sesiones', async () => {
  const actual = await vi.importActual<typeof import('../../api/sesiones')>('../../api/sesiones')
  return {
    ...actual,
    getMisSesiones: vi.fn(),
    guardarPostSesion: vi.fn(),
    publicarPostSesion: vi.fn(),
    solicitarReagendamiento: vi.fn(),
    confirmarSesion: vi.fn(),
  }
})

import { getMisSesiones, solicitarReagendamiento, confirmarSesion } from '../../api/sesiones'

vi.mock('../../api/disponibilidad', () => ({
  getSlotsLibres: vi.fn(),
}))
vi.mock('../../api/solicitudes-sesion', () => ({
  crearSolicitudSesion: vi.fn(),
}))

import { getSlotsLibres } from '../../api/disponibilidad'
import { crearSolicitudSesion } from '../../api/solicitudes-sesion'

vi.mock('../../lib/notify', () => ({
  notifySuccess: vi.fn(),
  notifyError: vi.fn(),
}))

const sesionPasadaSinPublicar: Sesion = {
  id: 's1',
  coacheeId: 'coachee-1',
  fechaHora: '2020-01-01T00:00:00.000Z',
  linkVideollamada: null,
  resumenCompartido: 'Buena sesión',
  confirmada: true,
  postSesion: null,
}

const sesionPasadaPublicada: Sesion = {
  id: 's2',
  coacheeId: 'coachee-1',
  fechaHora: '2020-02-01T00:00:00.000Z',
  linkVideollamada: null,
  resumenCompartido: null,
  confirmada: true,
  postSesion: {
    id: 'p2',
    sesionId: 's2',
    aprendizaje: 'Aprendí mucho',
    utilidad: 5,
    cercaniaObjetivo: 8,
    recomendacion: null,
    temasProximaSesion: null,
    publicada: true,
    createdAt: '2020-02-01T00:00:00.000Z',
    updatedAt: '2020-02-01T00:00:00.000Z',
  },
}

const sesionFutura: Sesion = {
  id: 's3',
  coacheeId: 'coachee-1',
  fechaHora: '2999-01-01T00:00:00.000Z',
  linkVideollamada: 'https://meet.example.com/x',
  resumenCompartido: null,
  confirmada: false,
  postSesion: null,
}

describe('SesionesView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getMisSesiones).mockReset()
    vi.mocked(getSlotsLibres).mockReset().mockResolvedValue([])
    vi.mocked(crearSolicitudSesion).mockReset()
    vi.mocked(confirmarSesion).mockReset()
  })

  it('shows an editable post-sesión form for a past session without a published post-sesión', async () => {
    vi.mocked(getMisSesiones).mockResolvedValue([sesionPasadaSinPublicar])

    const wrapper = mount(SesionesView)
    await flushPromises()

    expect(wrapper.text()).toContain('Realizada')
    expect(wrapper.find('textarea').exists()).toBe(true)
    expect(wrapper.text()).toContain('Publicar')
  })

  it('shows a read-only summary once the post-sesión is published', async () => {
    vi.mocked(getMisSesiones).mockResolvedValue([sesionPasadaPublicada])

    const wrapper = mount(SesionesView)
    await flushPromises()

    expect(wrapper.find('textarea').exists()).toBe(false)
    expect(wrapper.text()).toContain('Aprendí mucho')
    expect(wrapper.text()).toContain('5/5')
  })

  it('does not show a post-sesión form for a future session', async () => {
    vi.mocked(getMisSesiones).mockResolvedValue([sesionFutura])

    const wrapper = mount(SesionesView)
    await flushPromises()

    expect(wrapper.text()).toContain('Programada')
    expect(wrapper.find('textarea').exists()).toBe(false)
    expect(wrapper.find('a[href="https://meet.example.com/x"]').exists()).toBe(true)
  })

  it('lets the coachee confirm attendance for an unconfirmed future session', async () => {
    vi.mocked(getMisSesiones).mockResolvedValue([sesionFutura])
    vi.mocked(confirmarSesion).mockResolvedValue({ ...sesionFutura, confirmada: true })

    const wrapper = mount(SesionesView)
    await flushPromises()

    expect(wrapper.text()).not.toContain('✓ Confirmada')
    const confirmarBtn = wrapper.findAll('button').find((b) => b.text() === 'Confirmar asistencia')!
    await confirmarBtn.trigger('click')
    await flushPromises()

    expect(confirmarSesion).toHaveBeenCalledWith('s3')
    expect(wrapper.text()).toContain('✓ Confirmada')
    expect(wrapper.findAll('button').find((b) => b.text() === 'Confirmar asistencia')).toBeUndefined()
  })

  it('shows "✓ Confirmada" instead of the button for an already confirmed session', async () => {
    vi.mocked(getMisSesiones).mockResolvedValue([{ ...sesionFutura, confirmada: true }])

    const wrapper = mount(SesionesView)
    await flushPromises()

    expect(wrapper.text()).toContain('✓ Confirmada')
    expect(wrapper.findAll('button').find((b) => b.text() === 'Confirmar asistencia')).toBeUndefined()
  })

  it('lets the coachee request a reschedule for a future session', async () => {
    vi.mocked(getMisSesiones).mockResolvedValue([sesionFutura])
    vi.mocked(solicitarReagendamiento).mockResolvedValue({
      id: 'sol-1',
      sesionId: 's3',
      coacheeId: 'coachee-1',
      motivo: 'tengo un viaje',
      estado: 'pendiente',
      createdAt: '2999-01-01T00:00:00.000Z',
    })

    const wrapper = mount(SesionesView)
    await flushPromises()

    const buttons = wrapper.findAll('button')
    const solicitarBtn = buttons.find((b) => b.text() === 'Solicitar reagendamiento')
    expect(solicitarBtn).toBeTruthy()
    await solicitarBtn!.trigger('click')
    await flushPromises()

    const modal = new DOMWrapper(document.body)
    const textarea = modal.find('textarea')
    expect(textarea.exists()).toBe(true)
    await textarea.setValue('tengo un viaje')

    const enviarBtn = modal.findAll('button').find((b) => b.text() === 'Enviar')
    await enviarBtn!.trigger('click')
    await flushPromises()

    expect(solicitarReagendamiento).toHaveBeenCalledWith('s3', 'tengo un viaje')
  })

  it('lets the coachee request an available slot', async () => {
    // Un martes 13:00 de la semana actual — DisponibilidadCalendar arranca mostrando la
    // semana de "hoy", así que el slot debe caer dentro de ese rango para renderizarse.
    const slot = inicioDeSemana()
    slot.setDate(slot.getDate() + 1)
    slot.setHours(13, 0, 0, 0)
    const slotIso = slot.toISOString()

    vi.mocked(getMisSesiones).mockResolvedValue([])
    vi.mocked(getSlotsLibres).mockResolvedValue([slotIso])
    vi.mocked(crearSolicitudSesion).mockResolvedValue({
      id: 'req-1',
      coacheeId: 'coachee-1',
      fechaHoraPropuesta: slotIso,
      motivo: null,
      estado: 'pendiente',
      respuestaCoach: null,
      sesionCreadaId: null,
      createdAt: slotIso,
      resolvedAt: null,
    })

    const wrapper = mount(SesionesView)
    await flushPromises()

    const slotBtn = wrapper.find('button[title="Pedir esta hora"]')
    expect(slotBtn.exists()).toBe(true)
    await slotBtn.trigger('click')
    await flushPromises()

    const modal = new DOMWrapper(document.body)
    const enviarBtn = modal.findAll('button').find((b) => b.text() === 'Pedir esta hora')
    await enviarBtn!.trigger('click')
    await flushPromises()

    expect(crearSolicitudSesion).toHaveBeenCalledWith(slotIso, undefined)
  })
})
