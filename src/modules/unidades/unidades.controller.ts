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
import { UnidadeStatusOcupacao } from '@prisma/client';
import { UnidadesService } from './unidades.service';
import { CreateUnidadeDto } from './dto/create-unidade.dto';
import { UpdateUnidadeDto } from './dto/update-unidade.dto';

@ApiBearerAuth()
@ApiTags('unidades')
@Controller('unidades')
export class UnidadesController {
  constructor(private readonly service: UnidadesService) {}

  @Post()
  criar(@Body() dto: CreateUnidadeDto) {
    return this.service.criar(dto);
  }

  @Get('por-condominio/:condominioId')
  listarPorCondominio(
    @Param('condominioId', ParseIntPipe) conCod: number,
    @Query('incluirInativas', new ParseBoolPipe({ optional: true })) inc?: boolean,
  ) {
    return this.service.listarPorCondominio(conCod, inc ?? false);
  }

  @Get()
  listar(
    @Query('conCod', new ParseIntPipe({ optional: true })) conCod?: number,
    @Query('incluirInativas', new ParseBoolPipe({ optional: true })) inc?: boolean,
    @Query('statusOcupacao') statusOcupacao?: UnidadeStatusOcupacao,
    @Query('busca') busca?: string,
  ) {
    return this.service.listar({
      conCod,
      incluirInativas: inc ?? false,
      statusOcupacao,
      busca,
    });
  }

  @Get(':id')
  buscar(@Param('id', ParseIntPipe) id: number) {
    return this.service.buscarPorId(id);
  }

  @Put(':id')
  atualizar(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUnidadeDto) {
    return this.service.atualizar(id, dto);
  }

  @Put(':id/inativar')
  inativar(@Param('id', ParseIntPipe) id: number) {
    return this.service.inativar(id);
  }

  @Put(':id/ativar')
  ativar(@Param('id', ParseIntPipe) id: number) {
    return this.service.ativar(id);
  }
}
