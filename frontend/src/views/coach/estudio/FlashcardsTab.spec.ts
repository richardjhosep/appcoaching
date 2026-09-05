import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises, DOMWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import FlashcardsTab from './FlashcardsTab.vue'
import type { Flashcard } from '../../../api/flashcards'
import type { Competencia } from '../../../api/competencias'

vi.mock('../../../api/flashcards', async () => {
  const actual = await vi.importActual<typeof import('../../../api/flashcards')>('../../../api/flashcards')
  return {
    ...actual,
    listFlashcards: vi.fn(),
    createFlashcard: vi.fn(),
    deleteFlashcard: vi.fn(),
    setFlashcardActivo: vi.fn(),
  }
})

vi.mock('../../../api/competencias', async () => {
  const actual = await vi.importActual<typeof import('../../../api/competencias')>('../../../api/competencias')
  return {
    ...actual,
    listCompetencias: vi.fn(),
  }
})

import { listFlashcards, createFlashcard } from '../../../api/flashcards'
import { listCompetencias } from '../../../api/competencias'

vi.mock('../../../lib/notify', () => ({
  notifySuccess: vi.fn(),
  notifyError: vi.fn(),
  confirmDialog: vi.fn(),
}))

const competencia: Competencia = {
  id: 'comp-1',
  nombre: 'Comunicación',
  definicion: 'def',
  niveles: [],
}

const flashcard: Flashcard = {
  id: 'fc-1',
  anverso: '¿Qué es la escucha activa?',
  reverso: 'Prestar atención plena.',
  competenciaId: 'comp-1',
  competencia: { id: 'comp-1', nombre: 'Comunicación' },
  recursoId: null,
  activo: true,
  fechaLimite: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

describe('FlashcardsTab (coach)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(listFlashcards).mockReset()
    vi.mocked(listCompetencias).mockResolvedValue([competencia])
  })

  it('shows an empty state when the coach has no flashcards yet', async () => {
    vi.mocked(listFlashcards).mockResolvedValue([])

    const wrapper = mount(FlashcardsTab)
    await flushPromises()

    expect(wrapper.text()).toContain('Todavía no has creado ninguna flashcard')
  })

  it('lists existing flashcards', async () => {
    vi.mocked(listFlashcards).mockResolvedValue([flashcard])

    const wrapper = mount(FlashcardsTab)
    await flushPromises()

    expect(wrapper.text()).toContain('¿Qué es la escucha activa?')
  })

  it('creates a new flashcard from the modal', async () => {
    vi.mocked(listFlashcards).mockResolvedValue([])
    vi.mocked(createFlashcard).mockResolvedValue(flashcard)

    const wrapper = mount(FlashcardsTab)
    await flushPromises()

    const nuevoBtn = wrapper.findAll('button').find((b) => b.text() === 'Nueva flashcard')
    await nuevoBtn!.trigger('click')
    await flushPromises()

    const modal = new DOMWrapper(document.body)
    const textareas = modal.findAll('textarea')
    await textareas[0].setValue('¿Qué es la escucha activa?')
    await textareas[1].setValue('Prestar atención plena.')
    await modal.find('select').setValue('comp-1')
    await modal.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(createFlashcard).toHaveBeenCalledWith({
      anverso: '¿Qué es la escucha activa?',
      reverso: 'Prestar atención plena.',
      competenciaId: 'comp-1',
    })
  })
})
