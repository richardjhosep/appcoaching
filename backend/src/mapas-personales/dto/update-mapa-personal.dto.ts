import { PartialType } from '@nestjs/mapped-types';
import { CreateMapaPersonalDto } from './create-mapa-personal.dto';

export class UpdateMapaPersonalDto extends PartialType(CreateMapaPersonalDto) {}
