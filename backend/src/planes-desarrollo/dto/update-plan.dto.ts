import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class UpdatePlanDto {
  @IsOptional()
  @IsUUID()
  competenciaId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  nivelActual?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  nivelObjetivo?: number;

  @IsOptional()
  @IsString()
  plazo?: string;

  @IsOptional()
  @IsString()
  descripcionEstadoActual?: string;

  @IsOptional()
  @IsString()
  objetivoGeneral?: string;

  @IsOptional()
  @IsString()
  habitoCuando?: string;

  @IsOptional()
  @IsString()
  habitoEnVezDe?: string;

  @IsOptional()
  @IsString()
  habitoVoyA?: string;

  @IsOptional()
  @IsString()
  habitoObvio?: string;

  @IsOptional()
  @IsString()
  habitoSencillo?: string;

  @IsOptional()
  @IsString()
  habitoAtractivo?: string;

  @IsOptional()
  @IsString()
  habitoSatisfactorio?: string;

  @IsOptional()
  @IsString()
  formacionLibros?: string;

  @IsOptional()
  @IsString()
  formacionArticulos?: string;

  @IsOptional()
  @IsString()
  formacionVideos?: string;

  @IsOptional()
  @IsString()
  formacionPodcasts?: string;

  @IsOptional()
  @IsString()
  formacionPracticaGuiada?: string;
}
