import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import QuizTab from './QuizTab.vue'
import type { QuizParaResponder, QuizResumen, ResultadoIntento } from '../../../api/quiz'

vi.mock('../../../api/quiz', async () => {
  const actual = await vi.importActual<typeof import('../../../api/quiz')>('../../../api/quiz')
  return {
    ...actual,
    listQuizzesDisponibles: vi.fn(),
    getQuizParaResponder: vi.fn(),
    enviarIntento: vi.fn(),
    misIntentos: vi.fn(),
  }
})

import { listQuizzesDisponibles, getQuizParaResponder, enviarIntento, misIntentos } from '../../../api/quiz'

vi.mock('../../../lib/notify', () => ({
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
  fechaLimite: null,
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

describe('QuizTab (coachee)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(listQuizzesDisponibles).mockReset()
    vi.mocked(misIntentos).mockResolvedValue([])
  })

  it('shows an empty state when there are no quizzes available', async () => {
    vi.mocked(listQuizzesDisponibles).mockResolvedValue([])

    const wrapper = mount(QuizTab)
    await flushPromises()

    expect(wrapper.text()).toContain('Todavía no tienes quiz disponibles')
  })

  it('lists available quizzes', async () => {
    vi.mocked(listQuizzesDisponibles).mockResolvedValue([quizResumen])

    const wrapper = mount(QuizTab)
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

    const wrapper = mount(QuizTab)
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

  it('shows "Tu progreso" with only the coachee\'s own past attempts for this quiz', async () => {
    vi.mocked(listQuizzesDisponibles).mockResolvedValue([quizResumen])
    vi.mocked(getQuizParaResponder).mockResolvedValue(quizParaResponder)
    vi.mocked(misIntentos).mockResolvedValue([
      {
        id: 'i1',
        quizId: 'quiz-1',
        coacheeId: 'c1',
        respuestas: [0, 1],
        puntaje: 1,
        totalPreguntas: 2,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'i2',
        quizId: 'otro-quiz',
        coacheeId: 'c1',
        respuestas: [0, 0],
        puntaje: 2,
        totalPreguntas: 2,
        createdAt: '2026-01-02T00:00:00.000Z',
      },
    ])

    const wrapper = mount(QuizTab)
    await flushPromises()
    const quizCard = wrapper.findAll('button').find((b) => b.text().includes('Comunicación efectiva'))
    await quizCard!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Tu progreso en este quiz')
    expect(wrapper.findAll('li').length).toBe(1) // solo el intento de "quiz-1", no el de "otro-quiz"
  })

  it('disables submit until every question has an answer', async () => {
    vi.mocked(listQuizzesDisponibles).mockResolvedValue([quizResumen])
    vi.mocked(getQuizParaResponder).mockResolvedValue(quizParaResponder)

    const wrapper = mount(QuizTab)
    await flushPromises()
    const quizCard = wrapper.findAll('button').find((b) => b.text().includes('Comunicación efectiva'))
    await quizCard!.trigger('click')
    await flushPromises()

    const enviarBtn = wrapper.findAll('button').find((b) => b.text() === 'Enviar respuestas')
    expect(enviarBtn!.attributes('disabled')).toBeDefined()
  })
})
