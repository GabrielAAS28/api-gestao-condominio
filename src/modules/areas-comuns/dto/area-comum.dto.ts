import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class TurnoDto {
  @ApiPropertyOptional() @IsOptional() @IsInt() turCod?: number;

  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(50)
  nome!: string;

  @ApiProperty({ example: '08:00:00' })
  @IsString()
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/, { message: 'horaInicio deve ser HH:mm[:ss]' })
  horaInicio!: string;

  @ApiProperty({ example: '12:00:00' })
  @IsString()
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/, { message: 'horaFim deve ser HH:mm[:ss]' })
  horaFim!: string;

  @ApiPropertyOptional() @IsOptional() @IsBoolean() ativo?: boolean;
}

export class CreateAreaComumDto {
  @ApiProperty() @IsInt() condominioId!: number;

  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(100)
  nome!: string;

  @ApiPropertyOptional() @IsOptional() @IsString() descricao?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() termosUso?: string;

  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) capacidadeMaxima?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() permiteConvidados?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) limiteConvidados?: number;

  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) diasAntecedenciaMin?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) diasAntecedenciaMax?: number;

  @ApiPropertyOptional() @IsOptional() @IsBoolean() ativa?: boolean;

  @ApiPropertyOptional() @IsOptional() @IsNumber() taxaValor?: number;

  @ApiPropertyOptional({ type: [TurnoDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TurnoDto)
  turnos?: TurnoDto[];
}

export class UpdateAreaComumDto extends PartialType(CreateAreaComumDto) {}
