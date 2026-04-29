import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OcupanteVinculo, TipoPeriodoOcupante } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateOcupanteDto {
  @ApiProperty()
  @IsInt()
  pesCod!: number;

  @ApiProperty()
  @IsInt()
  uniCod!: number;

  @ApiProperty({ enum: OcupanteVinculo })
  @IsEnum(OcupanteVinculo)
  ocuVinculo!: OcupanteVinculo;

  @ApiPropertyOptional() @IsOptional() @IsDateString()
  ocuDtInicioOcupacao?: string;

  @ApiPropertyOptional() @IsOptional() @IsDateString()
  ocuDtFimOcupacao?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100)
  ocuPeriodoUso?: string;

  @ApiPropertyOptional({ enum: TipoPeriodoOcupante })
  @IsOptional() @IsEnum(TipoPeriodoOcupante)
  ocuTipoPeriodo?: TipoPeriodoOcupante;
}
