import { PartialType } from '@nestjs/mapped-types';
import { CreateNotaPizarraDto } from './create-nota-pizarra.dto';

export class UpdateNotaPizarraDto extends PartialType(CreateNotaPizarraDto) {}
