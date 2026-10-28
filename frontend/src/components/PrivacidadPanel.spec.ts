import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import PrivacidadPanel from './PrivacidadPanel.vue'

const api = vi.hoisted(() => ({
  descargarJson: vi.fn(),
  exportarCoachee: vi.fn(),
  getMisDatos: vi.fn(),
  solicitarSupresion: vi.fn(),
  suprimirCoachee: vi.fn(),
}))
vi.mock('../api/privacidad', () => api)

const notify = vi.hoisted(() => ({
  confirmDialog: vi.fn(),
  notifyError: vi.fn(),
  notifySuccess: vi.fn(),
  promptDialog: vi.fn(),
}))
vi.mock('../lib/notify', () => notify)

const botones = (w: ReturnType<typeof mount>) => w.findAll('button')

describe('PrivacidadPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('el titular descarga sus datos', async () => {
    api.getMisDatos.mockResolvedValue({ generadoEn: '2026-10-28T00:00:00Z' })
    const w = mount(PrivacidadPanel, { props: { modo: 'titular' } })
    await botones(w)[0].trigger('click')
    await flushPromises()
    expect(api.getMisDatos).toHaveBeenCalled()
    expect(api.descargarJson).toHaveBeenCalledWith({ generadoEn: '2026-10-28T00:00:00Z' }, 'mis-datos-coachnexus')
  })

  it('el titular no envía la solicitud si cancela la confirmación', async () => {
    notify.confirmDialog.mockResolvedValue(false)
    const w = mount(PrivacidadPanel, { props: { modo: 'titular' } })
    await botones(w)[1].trigger('click')
    await flushPromises()
    expect(api.solicitarSupresion).not.toHaveBeenCalled()
  })

  it('el titular envía la solicitud al confirmar', async () => {
    notify.confirmDialog.mockResolvedValue(true)
    api.solicitarSupresion.mockResolvedValue({ success: true })
    const w = mount(PrivacidadPanel, { props: { modo: 'titular' } })
    await botones(w)[1].trigger('click')
    await flushPromises()
    expect(api.solicitarSupresion).toHaveBeenCalled()
    expect(notify.notifySuccess).toHaveBeenCalled()
  })

  it('el coach elimina con el nombre escrito y avisa al padre', async () => {
    notify.promptDialog.mockResolvedValue('Ana Pérez')
    api.suprimirCoachee.mockResolvedValue({ success: true, archivosBorrados: 2 })
    const w = mount(PrivacidadPanel, { props: { modo: 'coach', coacheeId: 'c1', coacheeNombre: 'Ana Pérez' } })
    await botones(w)[1].trigger('click')
    await flushPromises()
    expect(api.suprimirCoachee).toHaveBeenCalledWith('c1', 'Ana Pérez')
    expect(w.emitted('suprimido')).toHaveLength(1)
  })

  it('el coach no elimina si cancela el cuadro de confirmación', async () => {
    notify.promptDialog.mockResolvedValue(null)
    const w = mount(PrivacidadPanel, { props: { modo: 'coach', coacheeId: 'c1', coacheeNombre: 'Ana Pérez' } })
    await botones(w)[1].trigger('click')
    await flushPromises()
    expect(api.suprimirCoachee).not.toHaveBeenCalled()
    expect(w.emitted('suprimido')).toBeUndefined()
  })
})
