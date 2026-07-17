import { IsInt, IsString, Min, MinLength } from 'class-validator';

export class CreateEmpresaDto {
  @IsString()
  @MinLength(2)
  nombre: string;

  @IsInt()
  @Min(0)
  tarifaHora: number;
}
