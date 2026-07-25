import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import NotificationBell from './NotificationBell.vue'
import type { Notificacion } from '../api/notificaciones'

vi.mock('../api/notificaciones', async () => {
  const actual = await vi.importActual<typeof import('../api/notificaciones')>('../api/notificaciones')
  return {
    ...actual,
    getMisNotificaciones: vi.fn(),
    getNoLeidasCount: vi.fn(),
    marcarNotificacionLeida: vi.fn(),
  }
})

import { getMisNotificaciones, getNoLeidasCount, marcarNotificacionLeida } from '../api/notificaciones'

const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/coachee/sesiones', component: { template: '<div />' } }],
})

const notificaciones: Notificacion[] = [
  {
    id: 'n1',
    tipo: 'reagendamiento_resuelto',
    mensaje: 'Tu coach respondió tu solicitud de reagendamiento',
    link: '/coachee/sesiones',
    leida: false,
    createdAt: '2026-07-25T00:00:00.000Z',
  },
]

describe('NotificationBell', () => {
  beforeEach(() => {
    vi.mocked(getMisNotificaciones).mockReset()
    vi.mocked(getNoLeidasCount).mockReset()
    vi.mocked(marcarNotificacionLeida).mockReset()
  })

  it('does not show a badge when there are no unread notifications', async () => {
    vi.mocked(getNoLeidasCount).mockResolvedValue({ count: 0 })
    vi.mocked(getMisNotificaciones).mockResolvedValue([])

    const wrapper = mount(NotificationBell, { global: { plugins: [router] } })
    await flushPromises()

    expect(wrapper.find('[aria-label="Notificaciones"] span').exists()).toBe(false)
    wrapper.unmount()
  })

  it('shows the unread count as a badge', async () => {
    vi.mocked(getNoLeidasCount).mockResolvedValue({ count: 3 })
    vi.mocked(getMisNotificaciones).mockResolvedValue([])

    const wrapper = mount(NotificationBell, { global: { plugins: [router] } })
    await flushPromises()

    expect(wrapper.text()).toContain('3')
    wrapper.unmount()
  })

  it('marks a notification as read and navigates to its link when clicked', async () => {
    vi.mocked(getNoLeidasCount).mockResolvedValue({ count: 1 })
    vi.mocked(getMisNotificaciones).mockResolvedValue(notificaciones)
    vi.mocked(marcarNotificacionLeida).mockResolvedValue({ ...notificaciones[0], leida: true })
    const pushSpy = vi.spyOn(router, 'push')

    const wrapper = mount(NotificationBell, { global: { plugins: [router] } })
    await flushPromises()

    await wrapper.find('[aria-label="Notificaciones"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Tu coach respondió tu solicitud de reagendamiento')

    const item = wrapper.findAll('li button')[0]
    await item.trigger('click')
    await flushPromises()

    expect(marcarNotificacionLeida).toHaveBeenCalledWith('n1')
    expect(pushSpy).toHaveBeenCalledWith('/coachee/sesiones')
    wrapper.unmount()
  })
})
