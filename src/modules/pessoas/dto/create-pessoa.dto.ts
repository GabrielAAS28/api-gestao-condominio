import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PessoaTipo } from '@prisma/client';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreatePessoaDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  pesNome!: string;

  @ApiProperty({ description: 'CPF (11 dígitos) ou CNPJ (14 dígitos) sem formatação' })
  @IsString()
  @Length(11, 14)
  pesCpfCnpj!: string;

  @ApiProperty()
  @IsEmail()
  @MaxLength(100)
  pesEmail!: string;

  @ApiPropertyOptional({ enum: PessoaTipo, default: PessoaTipo.F })
  @IsOptional()
  @IsEnum(PessoaTipo)
  pesTipo?: PessoaTipo;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  pesTelefone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  pesTelefone2?: string;

  @ApiPropertyOptional({ description: 'Senha inicial; se não informada, usuário só entra via reset.' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  senha?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  pesIsGlobalAdmin?: boolean;
}
