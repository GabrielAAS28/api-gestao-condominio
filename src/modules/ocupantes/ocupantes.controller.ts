import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { OcupantesService } from './ocupantes.service';
import { CreateOcupanteDto } from './dto/ocupante.dto';

@ApiBearerAuth()
@ApiTags('ocupantes')
@Controller('ocupantes')
export class OcupantesController {
  constructor(private readonly service: OcupantesService) {}

  @Post()
  criar(@Body() dto: CreateOcupanteDto) {
    return this.service.criar(dto);
  }

  @Get('por-unidade/:unidadeId')
  listarPorUnidade(@Param('unidadeId', ParseIntPipe) uniCod: number) {
    return this.service.listarPorUnidade(uniCod);
  }

  @Get('por-pessoa/:pessoaId')
  listarPorPessoa(@Param('pessoaId', ParseIntPipe) pesCod: number) {
    return this.service.listarPorPessoa(pesCod);
  }

  @Get(':id')
  buscar(@Param('id', ParseIntPipe) id: number) {
    return this.service.buscarPorId(id);
  }

  @Put(':id')
  atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateOcupanteDto>,
  ) {
    return this.service.atualizar(id, dto);
  }

  @Delete(':id')
  remover(@Param('id', ParseIntPipe) id: number) {
    return this.service.remover(id);
  }
}
