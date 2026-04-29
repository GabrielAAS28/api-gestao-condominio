import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ReservaStatus } from '@prisma/client';
import {
  CurrentUser,
  AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';
import { ReservasService } from './reservas.service';
import { CreateReservaDto, RejeitarReservaDto } from './dto/reserva.dto';

@ApiBearerAuth()
@ApiTags('reservas')
@Controller('reservas')
export class ReservasController {
  constructor(private readonly service: ReservasService) {}

  @Post()
  criar(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateReservaDto) {
    return this.service.criar(dto, user.pesCod);
  }

  @Get()
  listar(
    @Query('condominioId') condominioIdRaw?: string,
    @Query('unidadeId') unidadeIdRaw?: string,
    @Query('areaComumId') areaComumIdRaw?: string,
    @Query('pesCodMorador') pesCodMoradorRaw?: string,
    @Query('status') statusRaw?: string,
    @Query('dataDe') dataDe?: string,
    @Query('dataAte') dataAte?: string,
  ) {
    const condominioId = this.parseOptionalInt(condominioIdRaw, 'condominioId');
    const unidadeId = this.parseOptionalInt(unidadeIdRaw, 'unidadeId');
    const areaComumId = this.parseOptionalInt(areaComumIdRaw, 'areaComumId');
    const pesCodMorador = this.parseOptionalInt(pesCodMoradorRaw, 'pesCodMorador');
    const status = this.parseReservaStatus(statusRaw);

    return this.service.listar({
      condominioId,
      unidadeId,
      areaComumId,
      pesCodMorador,
      status,
      dataDe,
      dataAte,
    });
  }

  @Get(':id')
  buscar(@Param('id', ParseIntPipe) id: number) {
    return this.service.buscarPorId(id);
  }

  @Put(':id/aprovar')
  aprovar(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.aprovar(id, user.pesCod);
  }

  @Put(':id/rejeitar')
  rejeitar(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejeitarReservaDto,
  ) {
    return this.service.rejeitar(id, user.pesCod, dto);
  }

  @Put(':id/cancelar')
  cancelar(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.cancelarPeloMorador(id, user.pesCod);
  }

  @Put(':id/concluir')
  concluir(@Param('id', ParseIntPipe) id: number) {
    return this.service.concluir(id);
  }

  private parseOptionalInt(value: string | undefined, field: string): number | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    const parsed = Number(value);
    if (!Number.isInteger(parsed)) {
      throw new BadRequestException(`${field} deve ser um inteiro válido`);
    }
    return parsed;
  }

  private parseReservaStatus(value: string | undefined): ReservaStatus | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    if ((Object.values(ReservaStatus) as string[]).includes(value)) {
      return value as ReservaStatus;
    }
    throw new BadRequestException('status inválido');
  }
}
