import { IsArray, IsIn } from 'class-validator';

export class ResponderTestEstiloDto {
  // 'A' o 'B' elegida por pregunta, en el mismo orden en que
  // GET /tests-estilo/:id devolvió las preguntas.
  @IsArray()
  @IsIn(['A', 'B'], { each: true })
  respuestas: ('A' | 'B')[];
}
