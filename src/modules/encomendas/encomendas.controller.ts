import {
  BadRequestException,
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
import { EncomendaStatus } from '@prisma/client';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { EncomendasService } from './encomendas.service';
import {
  CreateEncomendaDto,
  RetiradaEncomendaDto,
  UpdateStatusEncomendaDto,
} from './dto/encomenda.dto';

function toBigInt(v: string): bigint {
  try {
    return BigInt(v);
  } catch {
    throw new BadRequestException('ID inválido');
  }
}

@ApiBearerAuth()
@ApiTags('encomendas')
@Controller('encomendas')
export class EncomendasController {
  constructor(private readonly service: EncomendasService) {}

  @Post()
  criar(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateEncomendaDto) {
    return this.service.criar(dto, user.pesCod);
  }

  @Get()
  listar(
    @Query('condominioId', new ParseIntPipe({ optional: true })) condominioId?: number,
    @Query('unidadeId', new ParseIntPipe({ optional: true })) unidadeId?: number,
    @Query('busca') busca?: string,
    @Query('status', new ParseEnumPipe(EncomendaStatus, { optional: true })) status?: EncomendaStatus,
    @Query('take', new ParseIntPipe({ optional: true })) take?: number,
    @Query('skip', new ParseIntPipe({ optional: true })) skip?: number,
  ) {
    return this.service.listar({ condominioId, unidadeId, busca, status, take, skip });
  }

  @Get(':id')
  buscar(@Param('id') id: string) {
    return this.service.buscarPorId(toBigInt(id));
  }

  @Put(':id/status')
  status(@Param('id') id: string, @Body() dto: UpdateStatusEncomendaDto) {
    return this.service.atualizarStatus(toBigInt(id), dto);
  }

  @Post(':id/marcar-retirada')
  retirada(@Param('id') id: string, @Body() dto: RetiradaEncomendaDto) {
    return this.service.marcarRetirada(toBigInt(id), dto);
  }

  @Delete(':id')
  remover(@Param('id') id: string) {
    return this.service.remover(toBigInt(id));
  }
}
