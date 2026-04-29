import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CondominioTipologia } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCondominioDto {
  @ApiProperty()
  @IsString() @IsNotEmpty() @MaxLength(100)
  conNome!: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100)
  conLogradouro?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(10)
  conNumero?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(50)
  conComplemento?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(50)
  conBairro?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(50)
  conCidade?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @Length(2, 2)
  conEstado?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(8)
  conCep?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(50)
  conPais?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100)
  conReferencia?: string;

  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0)
  conNumeroUnidades?: number;

  @ApiProperty({ enum: CondominioTipologia })
  @IsEnum(CondominioTipologia)
  conTipologia!: CondominioTipologia;

  @ApiPropertyOptional({ minimum: 1, maximum: 31 })
  @IsOptional() @IsInt() @Min(1) @Max(31)
  conDtVencimentoTaxa?: number;

  @ApiPropertyOptional() @IsOptional() @IsBoolean()
  conGeracaoAutoAtiva?: boolean;

  @ApiPropertyOptional({ minimum: 1, maximum: 31 })
  @IsOptional() @IsInt() @Min(1) @Max(31)
  conDiaGeracaoCobranca?: number;
}
