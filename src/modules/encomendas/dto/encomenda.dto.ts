import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EncomendaStatus, EncomendaTipo } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateEncomendaDto {
  @ApiProperty() @IsInt() condominioId!: number;
  @ApiProperty() @IsInt() unidadeId!: number;
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(100)
  destinatario!: string;

  @ApiProperty({ enum: EncomendaTipo })
  @IsEnum(EncomendaTipo)
  tipo!: EncomendaTipo;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(255)
  descricao?: string;

  @ApiProperty({ description: 'Data/hora ISO de recebimento' })
  @IsDateString()
  dataRecebimento!: string;

  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(100)
  nomeRecebidoPor!: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  observacoes?: string;
}

export class UpdateStatusEncomendaDto {
  @ApiProperty({ enum: EncomendaStatus })
  @IsEnum(EncomendaStatus)
  status!: EncomendaStatus;

  @ApiPropertyOptional() @IsOptional() @IsString()
  observacaoAtualizacao?: string;
}

export class RetiradaEncomendaDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(100)
  nomeRetirada!: string;

  @ApiPropertyOptional() @IsOptional() @IsInt()
  pesCodRetirada?: number;

  @ApiPropertyOptional() @IsOptional() @IsString()
  observacoes?: string;
}
