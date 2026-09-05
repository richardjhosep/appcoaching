import type { Intento } from '../api/quiz'

export interface RankingQuizItem {
  coacheeId: string
  nombre: string
  mejorPuntaje: number
  totalPreguntas: number
  totalIntentos: number
  fechaMejorIntento: string
}

/**
 * Agrupa los intentos (uno por respuesta enviada, puede haber varios por coachee) en un
 * ranking de 1 fila por coachee — el coach ve quién va mejor sin tener que comparar
 * intentos sueltos a ojo. Ordenado por mejor puntaje descendente; en empate, gana quien
 * lo logró primero (mismo criterio que un leaderboard clásico).
 */
export function rankingDeIntentos(intentos: Intento[]): RankingQuizItem[] {
  const porCoachee = new Map<string, RankingQuizItem>()

  for (const intento of intentos) {
    const actual = porCoachee.get(intento.coacheeId)
    if (!actual) {
      porCoachee.set(intento.coacheeId, {
        coacheeId: intento.coacheeId,
        nombre: intento.coachee?.nombre ?? 'Coachee',
        mejorPuntaje: intento.puntaje,
        totalPreguntas: intento.totalPreguntas,
        totalIntentos: 1,
        fechaMejorIntento: intento.createdAt,
      })
      continue
    }
    actual.totalIntentos += 1
    const mejora =
      intento.puntaje > actual.mejorPuntaje ||
      (intento.puntaje === actual.mejorPuntaje && intento.createdAt < actual.fechaMejorIntento)
    if (mejora) {
      actual.mejorPuntaje = intento.puntaje
      actual.fechaMejorIntento = intento.createdAt
    }
  }

  return [...porCoachee.values()].sort((a, b) => {
    if (b.mejorPuntaje !== a.mejorPuntaje) return b.mejorPuntaje - a.mejorPuntaje
    return a.fechaMejorIntento.localeCompare(b.fechaMejorIntento)
  })
}
