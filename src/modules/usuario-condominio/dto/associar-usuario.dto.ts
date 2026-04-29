import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { IsBoolean, IsEnum, IsInt, IsOptional } from 'class-validator';

export class AssociarUsuarioDto {
  @ApiProperty()
  @IsInt()
  pesCod!: number;

  @ApiProperty()
  @IsInt()
  conCod!: number;

  @ApiProperty({ enum: UserRole })
  @IsEnum(UserRole)
  uscPapel!: UserRole;

  @ApiProperty({ default: true })
  @IsOptional()
  @IsBoolean()
  uscAtivoAssociacao?: boolean;
}
