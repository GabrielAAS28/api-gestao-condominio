import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateVisitanteDto {
  @ApiProperty() @IsInt() condominioId!: number;
  @ApiProperty() @IsInt() unidadeId!: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() pesCodMorador?: number;

  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(100)
  nome!: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(14) cpf?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(20) rg?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(20) telefone?: string;

  @ApiProperty() @IsDateString()
  dataEntrada!: string;

  @ApiPropertyOptional() @IsOptional() @IsString()
  observacoes?: string;
}
