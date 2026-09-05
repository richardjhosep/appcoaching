import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import FlashcardsTab from './FlashcardsTab.vue'
import type { FlashcardConEstado, Repaso } from '../../../api/flashcards'

vi.mock('../../../api/flashcards', async () => {
  const actual = await vi.importActual<typeof import('../../../api/flashcards')>('../../../api/flashcards')
  return {
    ...actual,
    listFlashcardsDisponibles: vi.fn(),
    registrarRepaso: vi.fn(),
  }
})

import { listFlashcardsDisponibles, registrarRepaso } from '../../../api/flashcards'

const pendiente: FlashcardConEstado = {
  id: 'fc-1',
  anverso: '¿Qué es la escucha activa?',
  reverso: 'Prestar atención plena a lo que dice la otra persona.',
  competenciaId: 'comp-1',
  competencia: { id: 'comp-1', nombre: 'Comunicación' },
  recursoId: null,
  activo: true,
  fechaLimite: null,
  proximaRevision: null,
  debeRepasar: true,
}

const alDia: FlashcardConEstado = {
  ...pendiente,
  id: 'fc-2',
  proximaRevision: '2099-01-01',
  debeRepasar: false,
}

describe('FlashcardsTab (coachee)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(listFlashcardsDisponibles).mockReset()
    vi.mocked(registrarRepaso).mockReset()
  })

  it('shows an empty state when there is nothing to review', async () => {
    vi.mocked(listFlashcardsDisponibles).mockResolvedValue([alDia])

    const wrapper = mount(FlashcardsTab)
    await flushPromises()

    expect(wrapper.text()).toContain('Ya repasaste todo por hoy')
  })

  it('shows the front of the first pending card, unflipped', async () => {
    vi.mocked(listFlashcardsDisponibles).mockResolvedValue([pendiente])

    const wrapper = mount(FlashcardsTab)
    await flushPromises()

    expect(wrapper.text()).toContain('¿Qué es la escucha activa?')
    expect(wrapper.text()).toContain('Toca la tarjeta para ver la respuesta')
    // El reverso ya está en el DOM (el flip es puramente visual vía CSS
    // backface-visibility, no v-if) — lo que confirma el estado "sin voltear"
    // es la ausencia de los botones de resultado, no la ausencia del texto.
    expect(wrapper.findAll('button').some((b) => b.text() === 'Fácil')).toBe(false)
  })

  it('flips the card and lets the coachee mark a result, advancing the deck', async () => {
    vi.mocked(listFlashcardsDisponibles).mockResolvedValue([pendiente])
    vi.mocked(registrarRepaso).mockResolvedValue({
      id: 'repaso-1',
      flashcardId: 'fc-1',
      coacheeId: 'coachee-1',
      resultado: 'facil',
      proximaRevision: '2026-08-23',
      createdAt: '2026-08-16T00:00:00.000Z',
    } satisfies Repaso)

    const wrapper = mount(FlashcardsTab)
    await flushPromises()

    await wrapper.find('.flip-card').trigger('click')
    expect(wrapper.text()).toContain('Prestar atención plena')

    const facilBtn = wrapper.findAll('button').find((b) => b.text() === 'Fácil')
    await facilBtn!.trigger('click')
    await flushPromises()

    expect(registrarRepaso).toHaveBeenCalledWith('fc-1', 'facil')
    expect(wrapper.text()).toContain('Flashcard repasada hoy')
  })
})
