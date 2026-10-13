import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateAprendizajeDto {
  // Uno o más aprendizajes de la misma parte estudiada, uno por línea (el formulario los
  // junta con "\n" y la vista los muestra como lista).
  @IsString()
  @MinLength(1)
  contenido: string;

  // "¿Cómo se aplica a mi trabajo?" — obligatorio desde el feedback del coach (10-10-2026):
  // el valor del registro está justamente en bajar el aprendizaje a la práctica.
  @IsString()
  @MinLength(1)
  aplicacion: string;

  // Capítulo(s) o sección estudiada (en un libro); parte/minuto en un video o audio.
  @IsOptional()
  @IsString()
  seccion?: string;
}
