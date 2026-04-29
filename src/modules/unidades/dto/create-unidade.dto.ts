import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UnidadeStatusOcupacao, UnidadeTipo } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateUnidadeDto {
  @ApiProperty()
  @IsInt()
  conCod!: number;

  @ApiProperty()
  @IsString() @IsNotEmpty() @MaxLength(10)
  uniNumero!: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(50)
  bloco?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(50)
  andar?: string;

  @ApiPropertyOptional({ enum: UnidadeStatusOcupacao })
  @IsOptional() @IsEnum(UnidadeStatusOcupacao)
  uniStatusOcupacao?: UnidadeStatusOcupacao;

  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0)
  fracaoIdeal?: number;

  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0)
  areaPrivada?: number;

  @ApiPropertyOptional() @IsOptional() @IsString()
  observacao?: string;

  @ApiPropertyOptional({ enum: UnidadeTipo })
  @IsOptional() @IsEnum(UnidadeTipo)
  unidadeTipo?: UnidadeTipo;
}
