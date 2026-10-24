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
    getMisReagendamientos: vi.fn(),
  }
})

import {
  getMisSesiones,
  solicitarReagendamiento,
  confirmarSesion,
  getMisReagendamientos,
  guardarPostSesion,
  publicarPostSesion,
} from '../../api/sesiones'

vi.mock('../../api/disponibilidad', () => ({
  getSlotsLibres: vi.fn(),
}))
vi.mock('../../api/solicitudes-sesion', () => ({
  crearSolicitudSesion: vi.fn(),
}))

import { getSlotsLibres } from '../../api/disponibilidad'
import { crearSolicitudSesion } from '../../api/solicitudes-sesion'

vi.mock('../../api/ciclos', () => ({
  getMiCicloActual: vi.fn().mockResolvedValue(null),
}))
import { getMiCicloActual } from '../../api/ciclos'

vi.mock('../../lib/notify', () => ({
  notifySuccess: vi.fn(),
  notifyError: vi.fn(),
  confirmDialog: vi.fn(),
}))
import { notifySuccess, confirmDialog } from '../../lib/notify'

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
    vi.mocked(getMisReagendamientos).mockReset().mockResolvedValue([])
    vi.mocked(guardarPostSesion).mockReset()
    vi.mocked(publicarPostSesion).mockReset()
    vi.mocked(confirmDialog).mockReset()
    vi.mocked(notifySuccess).mockReset()
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

    expect(wrapper.text()).not.toContain('Confirmada')
    const confirmarBtn = wrapper.findAll('button').find((b) => b.text() === 'Confirmar asistencia')!
    await confirmarBtn.trigger('click')
    await flushPromises()

    expect(confirmarSesion).toHaveBeenCalledWith('s3')
    expect(wrapper.text()).toContain('Confirmada')
    expect(wrapper.findAll('button').find((b) => b.text() === 'Confirmar asistencia')).toBeUndefined()
  })

  it('shows "Confirmada" instead of the button for an already confirmed session', async () => {
    vi.mocked(getMisSesiones).mockResolvedValue([{ ...sesionFutura, confirmada: true }])

    const wrapper = mount(SesionesView)
    await flushPromises()

    expect(wrapper.text()).toContain('Confirmada')
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
    const enviarBtn = modal.findAll('button').find((b) => b.text() === 'Solicitar esta hora')
    await enviarBtn!.trigger('click')
    await flushPromises()

    expect(crearSolicitudSesion).toHaveBeenCalledWith(slotIso, undefined)
  })

  it('summarizes the upcoming sessions and the ones still without a date, and jumps to the agenda on click', async () => {
    const otraFutura: Sesion = { ...sesionFutura, id: 's4', fechaHora: '2998-06-01T15:00:00.000Z', confirmada: true }
    // Copia: otro test confirma sesionFutura y muta el fixture compartido.
    vi.mocked(getMisSesiones).mockResolvedValue([sesionPasadaPublicada, { ...sesionFutura, confirmada: false }, otraFutura])
    vi.mocked(getMiCicloActual).mockResolvedValueOnce({ totalSesiones: 8, sesionesRestantes: 5 } as never)
    const scrollIntoView = vi.fn()
    Element.prototype.scrollIntoView = scrollIntoView

    const wrapper = mount(SesionesView)
    await flushPromises()

    const resumen = wrapper.find('section[aria-label="Próximas sesiones"]')
    expect(resumen.text()).toContain('Te quedan 5 de 8 sesiones del proceso')
    expect(resumen.text()).toContain('3 aún sin fecha')
    const chips = resumen.findAll('button')
    // La más próxima primero (2998 antes que 2999), y la sesión pasada no aparece.
    expect(chips).toHaveLength(2)
    expect(chips[0].text()).toContain('jun')
    expect(chips[0].find('svg[aria-label="confirmada"]').exists()).toBe(true)
    expect(chips[1].find('svg[aria-label="confirmada"]').exists()).toBe(false)

    await chips[0].trigger('click')
    await flushPromises()

    expect(scrollIntoView).toHaveBeenCalled()
    // Resalta la tarjeta de detalle de esa sesión, igual que un clic dentro del calendario.
    expect(wrapper.find('.ring-2').exists()).toBe(true)
  })

  it('shows "Solicitud pendiente" and disables the reschedule button while a request is pending', async () => {
    vi.mocked(getMisSesiones).mockResolvedValue([{ ...sesionFutura }])
    vi.mocked(getMisReagendamientos).mockResolvedValue([
      {
        id: 'r1',
        sesionId: 's3',
        estado: 'pendiente',
        motivo: null,
        respuestaCoach: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        resolvedAt: null,
      },
    ])

    const wrapper = mount(SesionesView)
    await flushPromises()

    expect(wrapper.text()).toContain('Solicitud pendiente')
    const btn = wrapper.findAll('button').find((b) => b.text() === 'Solicitar reagendamiento')!
    expect(btn.attributes('disabled')).toBeDefined()
  })

  it('keeps the reschedule button enabled when the previous request was already resolved', async () => {
    vi.mocked(getMisSesiones).mockResolvedValue([{ ...sesionFutura }])
    vi.mocked(getMisReagendamientos).mockResolvedValue([
      {
        id: 'r1',
        sesionId: 's3',
        estado: 'resuelta',
        motivo: null,
        respuestaCoach: 'ok',
        createdAt: '2026-01-01T00:00:00.000Z',
        resolvedAt: '2026-01-02T00:00:00.000Z',
      },
    ])

    const wrapper = mount(SesionesView)
    await flushPromises()

    expect(wrapper.text()).not.toContain('Solicitud pendiente')
    const btn = wrapper.findAll('button').find((b) => b.text() === 'Solicitar reagendamiento')!
    expect(btn.attributes('disabled')).toBeUndefined()
  })

  it('does not publish without the required fields and shows inline errors', async () => {
    vi.mocked(getMisSesiones).mockResolvedValue([sesionPasadaSinPublicar])

    const wrapper = mount(SesionesView)
    await flushPromises()
    await wrapper.findAll('button').find((b) => b.text() === 'Publicar')!.trigger('click')
    await flushPromises()

    expect(confirmDialog).not.toHaveBeenCalled()
    expect(publicarPostSesion).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Cuéntanos tu aprendizaje principal.')
    expect(wrapper.text()).toContain('Elige qué tan útil fue la sesión.')
    expect(wrapper.text()).toContain('Elige qué tan cerca estás de tu objetivo.')
  })

  it('asks for confirmation before publishing, saves the draft first and notifies', async () => {
    vi.mocked(getMisSesiones).mockResolvedValue([{ ...sesionPasadaSinPublicar, id: 's9' }])
    vi.mocked(confirmDialog).mockResolvedValue(true)
    const publicada = { ...sesionPasadaPublicada.postSesion!, sesionId: 's9', aprendizaje: 'Mi aprendizaje', utilidad: 4, cercaniaObjetivo: 7 }
    vi.mocked(guardarPostSesion).mockResolvedValue({ ...publicada, publicada: false })
    vi.mocked(publicarPostSesion).mockResolvedValue(publicada)

    const wrapper = mount(SesionesView)
    await flushPromises()
    await wrapper.find('textarea').setValue('Mi aprendizaje')
    await wrapper.find('[role="group"][aria-label^="Utilidad"] button:nth-child(4)').trigger('click')
    await wrapper.find('[role="group"][aria-label^="Qué tan cerca"] button:nth-child(7)').trigger('click')
    await wrapper.findAll('button').find((b) => b.text() === 'Publicar')!.trigger('click')
    await flushPromises()

    expect(confirmDialog).toHaveBeenCalled()
    expect(guardarPostSesion).toHaveBeenCalledWith('s9', expect.objectContaining({ aprendizaje: 'Mi aprendizaje', utilidad: 4, cercaniaObjetivo: 7 }))
    expect(publicarPostSesion).toHaveBeenCalledWith('s9')
    expect(notifySuccess).toHaveBeenCalledWith('Post-sesión publicada')
    expect(wrapper.text()).toContain('Utilidad: 4/5')
  })

  it('does not publish when the coachee cancels the confirmation', async () => {
    vi.mocked(getMisSesiones).mockResolvedValue([{ ...sesionPasadaSinPublicar, id: 's8' }])
    vi.mocked(confirmDialog).mockResolvedValue(false)

    const wrapper = mount(SesionesView)
    await flushPromises()
    await wrapper.find('textarea').setValue('Algo')
    await wrapper.find('[role="group"][aria-label^="Utilidad"] button:nth-child(2)').trigger('click')
    await wrapper.find('[role="group"][aria-label^="Qué tan cerca"] button:nth-child(3)').trigger('click')
    await wrapper.findAll('button').find((b) => b.text() === 'Publicar')!.trigger('click')
    await flushPromises()

    expect(publicarPostSesion).not.toHaveBeenCalled()
  })

  it('notifies when the draft is saved', async () => {
    vi.mocked(getMisSesiones).mockResolvedValue([{ ...sesionPasadaSinPublicar, id: 's7' }])
    vi.mocked(guardarPostSesion).mockResolvedValue({ ...sesionPasadaPublicada.postSesion!, publicada: false })

    const wrapper = mount(SesionesView)
    await flushPromises()
    await wrapper.findAll('button').find((b) => b.text() === 'Guardar borrador')!.trigger('click')
    await flushPromises()

    expect(notifySuccess).toHaveBeenCalledWith('Borrador guardado')
  })

  it('never renders "null/5" for a published post-sesión without ratings', async () => {
    vi.mocked(getMisSesiones).mockResolvedValue([
      { ...sesionPasadaPublicada, postSesion: { ...sesionPasadaPublicada.postSesion!, utilidad: null, cercaniaObjetivo: null } },
    ])

    const wrapper = mount(SesionesView)
    await flushPromises()

    expect(wrapper.text()).not.toContain('null')
    expect(wrapper.text()).toContain('Utilidad: —')
  })

  it('shows an error state with retry when the sessions fail to load', async () => {
    vi.mocked(getMisSesiones).mockRejectedValueOnce(new Error('sin conexión'))
    vi.mocked(getMisSesiones).mockResolvedValueOnce([])

    const wrapper = mount(SesionesView)
    await flushPromises()
    expect(wrapper.find('[role="alert"]').text()).toContain('sin conexión')

    await wrapper.findAll('button').find((b) => b.text() === 'Reintentar')!.trigger('click')
    await flushPromises()
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })
})
