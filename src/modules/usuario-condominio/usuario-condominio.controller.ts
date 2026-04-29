import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { GlobalAdminOnly } from '../../common/decorators/roles.decorator';
import { AssociarUsuarioDto } from './dto/associar-usuario.dto';
import { UsuarioCondominioService } from './usuario-condominio.service';

@ApiBearerAuth()
@ApiTags('usuario-condominio')
@Controller('usuario-condominio')
export class UsuarioCondominioController {
  constructor(private readonly service: UsuarioCondominioService) {}

  @GlobalAdminOnly()
  @Post()
  associar(@Body() dto: AssociarUsuarioDto) {
    return this.service.associar(dto);
  }

  @Get('por-pessoa/:pessoaId')
  listarPorPessoa(@Param('pessoaId', ParseIntPipe) pesCod: number) {
    return this.service.listarPorPessoa(pesCod);
  }

  @Get('por-condominio/:condominioId')
  listarPorCondominio(@Param('condominioId', ParseIntPipe) conCod: number) {
    return this.service.listarPorCondominio(conCod);
  }

  @GlobalAdminOnly()
  @Delete(':pesCod/:conCod/:papel')
  desassociar(
    @Param('pesCod', ParseIntPipe) pesCod: number,
    @Param('conCod', ParseIntPipe) conCod: number,
    @Param('papel', new ParseEnumPipe(UserRole)) papel: UserRole,
  ) {
    return this.service.desassociar(pesCod, conCod, papel);
  }
}
