import { PartialType } from '@nestjs/mapped-types';
import { CreateNodoPersonalDto } from './create-nodo-personal.dto';

export class UpdateNodoPersonalDto extends PartialType(CreateNodoPersonalDto) {}
