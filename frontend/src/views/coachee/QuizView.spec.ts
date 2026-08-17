import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import QuizView from './QuizView.vue'
import type { QuizParaResponder, QuizResumen, ResultadoIntento } from '../../api/quiz'

vi.mock('../../api/quiz', async () => {
  const actual = await vi.importActual<typeof import('../../api/quiz')>('../../api/quiz')
  return {
    ...actual,
    listQuizzesDisponibles: vi.fn(),
    getQuizParaResponder: vi.fn(),
    enviarIntento: vi.fn(),
  }
})

import { listQuizzesDisponibles, getQuizParaResponder, enviarIntento } from '../../api/quiz'

vi.mock('../../lib/notify', () => ({
  notifySuccess: vi.fn(),
  notifyError: vi.fn(),
}))

const quizResumen: QuizResumen = {
  id: 'quiz-1',
  titulo: 'Comunicación efectiva',
  competenciaId: 'comp-1',
  competencia: { id: 'comp-1', nombre: 'Comunicación' },
  recursoId: null,
  activo: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  totalPreguntas: 2,
  mejorPuntaje: null,
}

const quizParaResponder: QuizParaResponder = {
  id: 'quiz-1',
  titulo: 'Comunicación efectiva',
  competenciaId: 'comp-1',
  recursoId: null,
  preguntas: [
    { id: 'p1', enunciado: '¿Pregunta 1?', opciones: ['A', 'B'], orden: 1 },
    { id: 'p2', enunciado: '¿Pregunta 2?', opciones: ['C', 'D'], orden: 2 },
  ],
}

describe('QuizView (coachee)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(listQuizzesDisponibles).mockReset()
  })

  it('shows an empty state when there are no quizzes available', async () => {
    vi.mocked(listQuizzesDisponibles).mockResolvedValue([])

    const wrapper = mount(QuizView)
    await flushPromises()

    expect(wrapper.text()).toContain('Todavía no tienes quiz disponibles')
  })

  it('lists available quizzes', async () => {
    vi.mocked(listQuizzesDisponibles).mockResolvedValue([quizResumen])

    const wrapper = mount(QuizView)
    await flushPromises()

    expect(wrapper.text()).toContain('Comunicación efectiva')
    expect(wrapper.text()).toContain('2 preguntas')
  })

  it('lets the coachee answer every question and see feedback', async () => {
    vi.mocked(listQuizzesDisponibles).mockResolvedValue([quizResumen])
    vi.mocked(getQuizParaResponder).mockResolvedValue(quizParaResponder)
    const resultado: ResultadoIntento = {
      puntaje: 1,
      totalPreguntas: 2,
      detalle: [
        { preguntaId: 'p1', correcta: true, respuestaCorrecta: 0 },
        { preguntaId: 'p2', correcta: false, respuestaCorrecta: 1 },
      ],
    }
    vi.mocked(enviarIntento).mockResolvedValue(resultado)

    const wrapper = mount(QuizView)
    await flushPromises()

    const quizCard = wrapper.findAll('button').find((b) => b.text().includes('Comunicación efectiva'))
    await quizCard!.trigger('click')
    await flushPromises()

    const radios = wrapper.findAll('input[type="radio"]')
    expect(radios.length).toBe(4)
    await radios[0].setValue(true) // pregunta 1, opción A
    await radios[2].setValue(true) // pregunta 2, opción C

    const enviarBtn = wrapper.findAll('button').find((b) => b.text() === 'Enviar respuestas')
    expect(enviarBtn!.attributes('disabled')).toBeUndefined()
    await enviarBtn!.trigger('click')
    await flushPromises()

    expect(enviarIntento).toHaveBeenCalledWith('quiz-1', [0, 0])
    expect(wrapper.text()).toContain('1/2')
  })

  it('disables submit until every question has an answer', async () => {
    vi.mocked(listQuizzesDisponibles).mockResolvedValue([quizResumen])
    vi.mocked(getQuizParaResponder).mockResolvedValue(quizParaResponder)

    const wrapper = mount(QuizView)
    await flushPromises()
    const quizCard = wrapper.findAll('button').find((b) => b.text().includes('Comunicación efectiva'))
    await quizCard!.trigger('click')
    await flushPromises()

    const enviarBtn = wrapper.findAll('button').find((b) => b.text() === 'Enviar respuestas')
    expect(enviarBtn!.attributes('disabled')).toBeDefined()
  })
})
