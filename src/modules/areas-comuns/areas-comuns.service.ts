import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  CreateAreaComumDto,
  TurnoDto,
  UpdateAreaComumDto,
} from './dto/area-comum.dto';

function parseTime(value: string): Date {
  // Aceita "HH:mm" ou "HH:mm:ss" e converte para Date para o tipo @db.Time
  const [h, m, s = '00'] = value.split(':');
  const date = new Date(0);
  date.setUTCHours(Number(h), Number(m), Number(s), 0);
  return date;
}

@Injectable()
export class AreasComunsService {
  constructor(private readonly prisma: PrismaService) {}

  async criar(dto: CreateAreaComumDto) {
    return this.prisma.areaComum.create({
      data: {
        conCod: dto.condominioId,
        nome: dto.nome,
        descricao: dto.descricao,
        termosUso: dto.termosUso,
        capacidadeMaxima: dto.capacidadeMaxima,
        permiteConvidados: dto.permiteConvidados ?? false,
        limiteConvidados: dto.limiteConvidados,
        diasAntecedenciaMin: dto.diasAntecedenciaMin ?? 1,
        diasAntecedenciaMax: dto.diasAntecedenciaMax ?? 30,
        ativa: dto.ativa ?? true,
        taxaValor:
          dto.taxaValor !== undefined ? new Prisma.Decimal(dto.taxaValor) : null,
        turnos: dto.turnos
          ? {
              create: dto.turnos.map((t) => ({
                nome: t.nome,
                horaInicio: parseTime(t.horaInicio),
                horaFim: parseTime(t.horaFim),
                ativo: t.ativo ?? true,
              })),
            }
          : undefined,
      },
      include: { turnos: true },
    });
  }

  listar(params: { condominioId?: number; ativa?: boolean }) {
    const where: Prisma.AreaComumWhereInput = {};
    if (params.condominioId) where.conCod = params.condominioId;
    if (params.ativa !== undefined) where.ativa = params.ativa;
    return this.prisma.areaComum.findMany({
      where,
      orderBy: { nome: 'asc' },
      include: { turnos: { orderBy: { horaInicio: 'asc' } } },
    });
  }

  async buscarPorId(areCod: number) {
    const a = await this.prisma.areaComum.findUnique({
      where: { areCod },
      include: { turnos: { orderBy: { horaInicio: 'asc' } } },
    });
    if (!a) throw new NotFoundException('Área comum não encontrada');
    return a;
  }

  async atualizar(areCod: number, dto: UpdateAreaComumDto) {
    await this.buscarPorId(areCod);
    return this.prisma.areaComum.update({
      where: { areCod },
      data: {
        nome: dto.nome,
        descricao: dto.descricao,
        termosUso: dto.termosUso,
        capacidadeMaxima: dto.capacidadeMaxima,
        permiteConvidados: dto.permiteConvidados,
        limiteConvidados: dto.limiteConvidados,
        diasAntecedenciaMin: dto.diasAntecedenciaMin,
        diasAntecedenciaMax: dto.diasAntecedenciaMax,
        ativa: dto.ativa,
        taxaValor:
          dto.taxaValor !== undefined ? new Prisma.Decimal(dto.taxaValor) : undefined,
      },
      include: { turnos: true },
    });
  }

  async remover(areCod: number) {
    await this.buscarPorId(areCod);
    return this.prisma.areaComum.delete({ where: { areCod } });
  }

  // ----------------- TURNOS -----------------
  async adicionarTurno(areCod: number, dto: TurnoDto) {
    await this.buscarPorId(areCod);
    return this.prisma.areaComumTurno.create({
      data: {
        areCod,
        nome: dto.nome,
        horaInicio: parseTime(dto.horaInicio),
        horaFim: parseTime(dto.horaFim),
        ativo: dto.ativo ?? true,
      },
    });
  }

  async atualizarTurno(turCod: number, dto: TurnoDto) {
    const t = await this.prisma.areaComumTurno.findUnique({ where: { turCod } });
    if (!t) throw new NotFoundException('Turno não encontrado');
    return this.prisma.areaComumTurno.update({
      where: { turCod },
      data: {
        nome: dto.nome,
        horaInicio: parseTime(dto.horaInicio),
        horaFim: parseTime(dto.horaFim),
        ativo: dto.ativo ?? t.ativo,
      },
    });
  }

  async removerTurno(turCod: number) {
    const t = await this.prisma.areaComumTurno.findUnique({ where: { turCod } });
    if (!t) throw new NotFoundException('Turno não encontrado');
    return this.prisma.areaComumTurno.delete({ where: { turCod } });
  }
}
