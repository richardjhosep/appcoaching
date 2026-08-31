import { IsString, MinLength } from 'class-validator';

export class DejarFeedbackDto {
  @IsString()
  @MinLength(1)
  comentarioCoach: string;
}
