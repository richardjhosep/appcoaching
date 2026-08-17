import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises, DOMWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import QuizView from './QuizView.vue'
import type { Quiz, QuizConPreguntas } from '../../api/quiz'
import type { Competencia } from '../../api/competencias'

vi.mock('../../api/quiz', async () => {
  const actual = await vi.importActual<typeof import('../../api/quiz')>('../../api/quiz')
  return {
    ...actual,
    listQuizzes: vi.fn(),
    createQuiz: vi.fn(),
    getQuizParaCoach: vi.fn(),
    listIntentosDeQuiz: vi.fn(),
    addPregunta: vi.fn(),
    deleteQuiz: vi.fn(),
    setQuizActivo: vi.fn(),
  }
})

vi.mock('../../api/competencias', async () => {
  const actual = await vi.importActual<typeof import('../../api/competencias')>('../../api/competencias')
  return {
    ...actual,
    listCompetencias: vi.fn(),
  }
})

import {
  listQuizzes,
  createQuiz,
  getQuizParaCoach,
  listIntentosDeQuiz,
  addPregunta,
} from '../../api/quiz'
import { listCompetencias } from '../../api/competencias'

vi.mock('../../lib/notify', () => ({
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

const quiz: Quiz = {
  id: 'quiz-1',
  titulo: 'Comunicación efectiva',
  competenciaId: 'comp-1',
  competencia: { id: 'comp-1', nombre: 'Comunicación' },
  recursoId: null,
  activo: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const quizConPreguntas: QuizConPreguntas = {
  ...quiz,
  preguntas: [],
}

describe('QuizView (coach)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(listQuizzes).mockReset()
    vi.mocked(listCompetencias).mockResolvedValue([competencia])
    vi.mocked(listIntentosDeQuiz).mockResolvedValue([])
    vi.mocked(getQuizParaCoach).mockResolvedValue(quizConPreguntas)
  })

  it('shows an empty state when the coach has no quizzes yet', async () => {
    vi.mocked(listQuizzes).mockResolvedValue([])

    const wrapper = mount(QuizView)
    await flushPromises()

    expect(wrapper.text()).toContain('Todavía no has creado ningún quiz')
  })

  it('lists existing quizzes', async () => {
    vi.mocked(listQuizzes).mockResolvedValue([quiz])

    const wrapper = mount(QuizView)
    await flushPromises()

    expect(wrapper.text()).toContain('Comunicación efectiva')
  })

  it('creates a new quiz from the modal', async () => {
    vi.mocked(listQuizzes).mockResolvedValue([])
    vi.mocked(createQuiz).mockResolvedValue(quiz)

    const wrapper = mount(QuizView)
    await flushPromises()

    const nuevoBtn = wrapper.findAll('button').find((b) => b.text() === 'Nuevo quiz')
    await nuevoBtn!.trigger('click')
    await flushPromises()

    const modal = new DOMWrapper(document.body)
    await modal.find('input[type="text"]').setValue('Comunicación efectiva')
    await modal.find('select').setValue('comp-1')
    await modal.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(createQuiz).toHaveBeenCalledWith({ titulo: 'Comunicación efectiva', competenciaId: 'comp-1' })
  })

  it('adds a pregunta to a selected quiz', async () => {
    vi.mocked(listQuizzes).mockResolvedValue([quiz])
    vi.mocked(addPregunta).mockResolvedValue({
      id: 'pregunta-1',
      quizId: 'quiz-1',
      enunciado: '¿2+2?',
      opciones: ['3', '4'],
      respuestaCorrecta: 1,
      orden: 1,
      createdAt: '2026-01-01T00:00:00.000Z',
    })

    const wrapper = mount(QuizView)
    await flushPromises()

    const quizCard = wrapper.findAll('button').find((b) => b.text().includes('Comunicación efectiva'))
    await quizCard!.trigger('click')
    await flushPromises()

    const inputs = wrapper.findAll('input[type="text"]')
    await inputs[0].setValue('¿2+2?')
    await inputs[1].setValue('3')
    await inputs[2].setValue('4')

    const agregarBtn = wrapper.findAll('button').find((b) => b.text() === 'Agregar pregunta')
    await agregarBtn!.trigger('click')
    await flushPromises()

    expect(addPregunta).toHaveBeenCalledWith('quiz-1', {
      enunciado: '¿2+2?',
      opciones: ['3', '4'],
      respuestaCorrecta: 0,
    })
    expect(wrapper.text()).toContain('¿2+2?')
  })
})
