import { PartialType } from '@nestjs/mapped-types';
import { CreateCondominioDto } from './create-condominio.dto';

export class UpdateCondominioDto extends PartialType(CreateCondominioDto) {}
