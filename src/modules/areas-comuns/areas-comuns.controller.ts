import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AreasComunsService } from './areas-comuns.service';
import {
  CreateAreaComumDto,
  TurnoDto,
  UpdateAreaComumDto,
} from './dto/area-comum.dto';

@ApiBearerAuth()
@ApiTags('areas-comuns')
@Controller('areas-comuns')
export class AreasComunsController {
  constructor(private readonly service: AreasComunsService) {}

  @Post()
  criar(@Body() dto: CreateAreaComumDto) {
    return this.service.criar(dto);
  }

  @Get()
  listar(
    @Query('condominioId') condominioIdRaw?: string,
    @Query('ativa') ativaRaw?: string,
  ) {
    const condominioId = this.parseOptionalInt(condominioIdRaw, 'condominioId');
    const ativa = this.parseOptionalBool(ativaRaw, 'ativa');
    return this.service.listar({ condominioId, ativa });
  }

  @Get(':id')
  buscar(@Param('id', ParseIntPipe) id: number) {
    return this.service.buscarPorId(id);
  }

  @Put(':id')
  atualizar(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAreaComumDto) {
    return this.service.atualizar(id, dto);
  }

  @Delete(':id')
  remover(@Param('id', ParseIntPipe) id: number) {
    return this.service.remover(id);
  }

  // -------- Turnos --------
  @Post(':id/turnos')
  adicionarTurno(@Param('id', ParseIntPipe) id: number, @Body() dto: TurnoDto) {
    return this.service.adicionarTurno(id, dto);
  }

  @Put('turnos/:turCod')
  atualizarTurno(
    @Param('turCod', ParseIntPipe) turCod: number,
    @Body() dto: TurnoDto,
  ) {
    return this.service.atualizarTurno(turCod, dto);
  }

  @Delete('turnos/:turCod')
  removerTurno(@Param('turCod', ParseIntPipe) turCod: number) {
    return this.service.removerTurno(turCod);
  }

  private parseOptionalInt(value: string | undefined, field: string): number | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    const parsed = Number(value);
    if (!Number.isInteger(parsed)) {
      throw new BadRequestException(`${field} deve ser um inteiro válido`);
    }
    return parsed;
  }

  private parseOptionalBool(value: string | undefined, field: string): boolean | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    if (value === 'true') return true;
    if (value === 'false') return false;
    throw new BadRequestException(`${field} deve ser true ou false`);
  }
}
