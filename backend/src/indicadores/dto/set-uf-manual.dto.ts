import { IsNumber, Min } from 'class-validator';

export class SetUfManualDto {
  @IsNumber()
  @Min(1)
  valorUf: number;
}
