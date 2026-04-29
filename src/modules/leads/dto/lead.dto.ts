import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateLeadDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(150)
  name!: string;

  @ApiProperty() @IsEmail() @MaxLength(150)
  email!: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(20)
  whatsapp?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500)
  reason?: string;
}
