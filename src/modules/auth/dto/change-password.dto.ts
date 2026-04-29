import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  senhaAtual!: string;

  @ApiProperty({ minLength: 6 })
  @IsString()
  @MinLength(6)
  novaSenha!: string;
}
