import { IsString, Matches, MinLength } from 'class-validator';
import {
  PASSWORD_COMPLEXITY_MESSAGE,
  PASSWORD_COMPLEXITY_REGEX,
  PASSWORD_LENGTH_MESSAGE,
  PASSWORD_MIN_LENGTH,
} from '../../common/password-policy';

export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH, { message: PASSWORD_LENGTH_MESSAGE })
  @Matches(PASSWORD_COMPLEXITY_REGEX, { message: PASSWORD_COMPLEXITY_MESSAGE })
  newPassword: string;
}
