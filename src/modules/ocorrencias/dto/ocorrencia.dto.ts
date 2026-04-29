import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OcorrenciaStatus, OcorrenciaTipo } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateOcorrenciaDto {
  @ApiPropertyOptional()
  @IsOptional() @IsInt()
  condominioId?: number;

  @ApiProperty()
  @IsInt()
  unidadeId!: number;

  @ApiProperty({ enum: OcorrenciaTipo })
  @IsEnum(OcorrenciaTipo)
  tipo!: OcorrenciaTipo;

  @ApiProperty()
  @IsString() @IsNotEmpty() @MaxLength(150)
  titulo!: string;

  @ApiProperty()
  @IsString() @IsNotEmpty()
  descricao!: string;
}

export class UpdateOcorrenciaDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(150)
  titulo?: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  descricao?: string;

  @ApiPropertyOptional({ enum: OcorrenciaTipo })
  @IsOptional() @IsEnum(OcorrenciaTipo)
  tipo?: OcorrenciaTipo;

  @ApiPropertyOptional({ enum: OcorrenciaStatus })
  @IsOptional() @IsEnum(OcorrenciaStatus)
  status?: OcorrenciaStatus;
}

export class CriarComentarioDto {
  @ApiProperty()
  @IsString() @IsNotEmpty()
  comentario!: string;
}

export class FinalizarOcorrenciaDto {
  @ApiPropertyOptional()
  @IsOptional() @IsString()
  parecerFinal?: string;
}
