import {
  Body,
  Controller,
  Get,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GlobalAdminOnly } from '../../common/decorators/roles.decorator';
import { CondominiosService } from './condominios.service';
import { CreateCondominioDto } from './dto/create-condominio.dto';
import { UpdateCondominioDto } from './dto/update-condominio.dto';

@ApiBearerAuth()
@ApiTags('condominios')
@Controller('condominios')
export class CondominiosController {
  constructor(private readonly service: CondominiosService) {}

  @GlobalAdminOnly()
  @Post()
  criar(@Body() dto: CreateCondominioDto) {
    return this.service.criar(dto);
  }

  @Get()
  listar(
    @Query('ativos', new ParseBoolPipe({ optional: true })) ativos?: boolean,
    @Query('busca') busca?: string,
  ) {
    return this.service.listar({ ativos, busca });
  }

  @Get(':id')
  buscar(@Param('id', ParseIntPipe) id: number) {
    return this.service.buscarPorId(id);
  }

  @Put(':id')
  atualizar(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCondominioDto) {
    return this.service.atualizar(id, dto);
  }

  @GlobalAdminOnly()
  @Put(':id/inativar')
  inativar(@Param('id', ParseIntPipe) id: number) {
    return this.service.inativar(id);
  }

  @GlobalAdminOnly()
  @Put(':id/ativar')
  ativar(@Param('id', ParseIntPipe) id: number) {
    return this.service.ativar(id);
  }
}
