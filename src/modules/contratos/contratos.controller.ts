import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ContratoStatus } from '@prisma/client';
import { ContratosService } from './contratos.service';
import { CreateContratoDto, UpdateContratoDto } from './dto/contrato.dto';

@ApiBearerAuth()
@ApiTags('contratos')
@Controller('contratos')
export class ContratosController {
  constructor(private readonly service: ContratosService) {}

  @Post()
  criar(@Body() dto: CreateContratoDto) {
    return this.service.criar(dto);
  }

  @Get()
  listar(
    @Query('condominioId', new ParseIntPipe({ optional: true })) condominioId?: number,
    @Query('status', new ParseEnumPipe(ContratoStatus, { optional: true })) status?: ContratoStatus,
    @Query('busca') busca?: string,
  ) {
    return this.service.listar({ condominioId, status, busca });
  }

  @Get(':id')
  buscar(@Param('id', ParseIntPipe) id: number) {
    return this.service.buscarPorId(id);
  }

  @Put(':id')
  atualizar(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateContratoDto) {
    return this.service.atualizar(id, dto);
  }

  @Delete(':id')
  remover(@Param('id', ParseIntPipe) id: number) {
    return this.service.remover(id);
  }
}
