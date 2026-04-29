import {
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { VisitanteStatus } from '@prisma/client';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { VisitantesService } from './visitantes.service';
import { CreateVisitanteDto } from './dto/visitante.dto';

@ApiBearerAuth()
@ApiTags('visitantes')
@Controller('visitantes')
export class VisitantesController {
  constructor(private readonly service: VisitantesService) {}

  @Post()
  registrar(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateVisitanteDto) {
    return this.service.registrar(dto, user.pesCod);
  }

  @Get()
  listar(
    @Query('condominioId', new ParseIntPipe({ optional: true })) condominioId?: number,
    @Query('unidadeId', new ParseIntPipe({ optional: true })) unidadeId?: number,
    @Query('status', new ParseEnumPipe(VisitanteStatus, { optional: true })) status?: VisitanteStatus,
    @Query('busca') busca?: string,
  ) {
    return this.service.listar({ condominioId, unidadeId, status, busca });
  }

  @Get(':id')
  buscar(@Param('id', ParseIntPipe) id: number) {
    return this.service.buscarPorId(id);
  }

  @Put(':id/marcar-saida')
  marcarSaida(@Param('id', ParseIntPipe) id: number) {
    return this.service.marcarSaida(id);
  }
}
