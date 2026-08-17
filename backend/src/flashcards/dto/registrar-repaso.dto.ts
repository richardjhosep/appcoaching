import { IsIn } from 'class-validator';
import type { ResultadoRepaso } from '../entities/repaso-flashcard.entity';

export class RegistrarRepasoDto {
  @IsIn(['facil', 'dificil', 'olvidado'])
  resultado: ResultadoRepaso;
}
