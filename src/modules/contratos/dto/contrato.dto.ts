import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ContratoStatus } from '@prisma/client';

export class CreateContratoDto {
  @ApiProperty() @IsInt() condominioId!: number;

  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(100)
  empresa!: string;

  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(255)
  servico!: string;

  @ApiProperty() @IsNumber() @Min(0)
  valor!: number;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100)
  responsavel?: string;

  @ApiProperty({ enum: ContratoStatus })
  @IsEnum(ContratoStatus)
  status!: ContratoStatus;

  @ApiProperty({ example: '2026-01-01' }) @IsDateString()
  dataInicio!: string;

  @ApiProperty({ example: '2026-12-31' }) @IsDateString()
  dataFim!: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  observacoes?: string;
}

export class UpdateContratoDto extends PartialType(CreateContratoDto) {}
