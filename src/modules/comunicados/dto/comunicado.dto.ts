import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PublicoDestino } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateComunicadoDto {
  @ApiProperty()
  @IsString() @IsNotEmpty() @MaxLength(255)
  titulo!: string;

  @ApiProperty()
  @IsString() @IsNotEmpty()
  mensagem!: string;

  @ApiProperty({ enum: PublicoDestino })
  @IsEnum(PublicoDestino)
  publicoDestino!: PublicoDestino;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  isUrgente?: boolean;

  @ApiProperty({ type: [Number] })
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => Number)
  @IsInt({ each: true })
  condominiosIds!: number[];
}
