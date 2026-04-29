import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class ConvidadoDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(150)
  nome!: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(50)
  documento?: string;
}

export class CreateReservaDto {
  @ApiProperty() @IsInt() areaComumId!: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() turnoId?: number;
  @ApiProperty() @IsInt() unidadeId!: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() pesCodMorador?: number;

  @ApiProperty({ example: '2026-05-15' })
  @IsDateString()
  data!: string;

  @ApiProperty() @IsBoolean()
  termosAceitos!: boolean;

  @ApiPropertyOptional({ type: [ConvidadoDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConvidadoDto)
  convidados?: ConvidadoDto[];
}

export class RejeitarReservaDto {
  @ApiProperty() @IsString() @IsNotEmpty()
  motivoRejeicao!: string;
}
