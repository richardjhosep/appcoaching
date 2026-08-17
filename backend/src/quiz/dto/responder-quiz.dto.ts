import { IsArray, IsInt } from 'class-validator';

export class ResponderQuizDto {
  // Índice de la opción elegida por pregunta, en el mismo orden en que
  // GET /quizzes/:id devolvió las preguntas.
  @IsArray()
  @IsInt({ each: true })
  respuestas: number[];
}
