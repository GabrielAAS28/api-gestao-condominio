import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ReservaStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  CreateReservaDto,
  RejeitarReservaDto,
} from './dto/reserva.dto';

@Injectable()
export class ReservasService {
  constructor(private readonly prisma: PrismaService) {}

  async criar(dto: CreateReservaDto, pesCodSolicitante: number) {
    if (!dto.termosAceitos) {
      throw new BadRequestException('Os termos de uso devem ser aceitos.');
    }

    const area = await this.prisma.areaComum.findUnique({
      where: { areCod: dto.areaComumId },
    });
    if (!area) throw new NotFoundException('Área comum não encontrada');
    if (!area.ativa) throw new BadRequestException('Área comum inativa');

    if (dto.turnoId) {
      const turno = await this.prisma.areaComumTurno.findFirst({
        where: { turCod: dto.turnoId, areCod: dto.areaComumId },
      });
      if (!turno) throw new NotFoundException('Turno não encontrado para esta área');
      if (!turno.ativo) throw new BadRequestException('Turno inativo');
    }

    const data = new Date(dto.data);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const diasAteData = Math.ceil(
      (data.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diasAteData < area.diasAntecedenciaMin) {
      throw new BadRequestException(
        `Reserva exige antecedência mínima de ${area.diasAntecedenciaMin} dia(s).`,
      );
    }
    if (diasAteData > area.diasAntecedenciaMax) {
      throw new BadRequestException(
        `Reserva permite no máximo ${area.diasAntecedenciaMax} dia(s) de antecedência.`,
      );
    }

    // Verifica conflito de reserva (mesma data + área + turno) para reservas não rejeitadas/canceladas
    const conflito = await this.prisma.reserva.findFirst({
      where: {
        areCod: dto.areaComumId,
        turCod: dto.turnoId ?? null,
        data,
        status: { in: [ReservaStatus.PENDENTE_APROVACAO, ReservaStatus.APROVADA] },
      },
    });
    if (conflito) {
      throw new BadRequestException('Já existe uma reserva para essa data/turno.');
    }

    if (dto.convidados && dto.convidados.length > 0) {
      if (!area.permiteConvidados) {
        throw new BadRequestException('Esta área comum não permite convidados.');
      }
      if (
        area.limiteConvidados !== null &&
        area.limiteConvidados !== undefined &&
        dto.convidados.length > area.limiteConvidados
      ) {
        throw new BadRequestException(
          `Limite máximo de ${area.limiteConvidados} convidados.`,
        );
      }
    }

    return this.prisma.reserva.create({
      data: {
        areCod: dto.areaComumId,
        turCod: dto.turnoId,
        uniCod: dto.unidadeId,
        pesCodMorador: dto.pesCodMorador ?? pesCodSolicitante,
        data,
        termosAceitos: dto.termosAceitos,
        status: ReservaStatus.PENDENTE_APROVACAO,
        convidados: dto.convidados
          ? {
              create: dto.convidados.map((c) => ({
                nome: c.nome,
                documento: c.documento,
              })),
            }
          : undefined,
      },
      include: { convidados: true, areaComum: true, turno: true, unidade: true },
    });
  }

  listar(params: {
    condominioId?: number;
    unidadeId?: number;
    areaComumId?: number;
    pesCodMorador?: number;
    status?: ReservaStatus;
    dataDe?: string;
    dataAte?: string;
  }) {
    const where: Prisma.ReservaWhereInput = {};
    if (params.unidadeId) where.uniCod = params.unidadeId;
    if (params.areaComumId) where.areCod = params.areaComumId;
    if (params.pesCodMorador) where.pesCodMorador = params.pesCodMorador;
    if (params.status) where.status = params.status;
    if (params.condominioId) {
      where.areaComum = { conCod: params.condominioId };
    }
    if (params.dataDe || params.dataAte) {
      where.data = {};
      if (params.dataDe) (where.data as any).gte = new Date(params.dataDe);
      if (params.dataAte) (where.data as any).lte = new Date(params.dataAte);
    }
    return this.prisma.reserva.findMany({
      where,
      orderBy: { data: 'desc' },
      include: {
        areaComum: { select: { areCod: true, nome: true } },
        turno: { select: { turCod: true, nome: true } },
        unidade: { select: { uniCod: true, uniNumero: true, bloco: true } },
        morador: { select: { pesCod: true, pesNome: true } },
        convidados: true,
      },
    });
  }

  async buscarPorId(resCod: number) {
    const r = await this.prisma.reserva.findUnique({
      where: { resCod },
      include: {
        areaComum: true,
        turno: true,
        unidade: true,
        morador: { select: { pesCod: true, pesNome: true, pesEmail: true } },
        aprovador: { select: { pesCod: true, pesNome: true } },
        convidados: true,
      },
    });
    if (!r) throw new NotFoundException('Reserva não encontrada');
    return r;
  }

  async aprovar(resCod: number, pesCodAprovador: number) {
    const r = await this.buscarPorId(resCod);
    if (r.status !== ReservaStatus.PENDENTE_APROVACAO) {
      throw new ForbiddenException('Apenas reservas pendentes podem ser aprovadas.');
    }
    return this.prisma.reserva.update({
      where: { resCod },
      data: {
        status: ReservaStatus.APROVADA,
        pesCodAprovador,
        motivoRejeicao: null,
      },
    });
  }

  async rejeitar(resCod: number, pesCodAprovador: number, dto: RejeitarReservaDto) {
    const r = await this.buscarPorId(resCod);
    if (r.status !== ReservaStatus.PENDENTE_APROVACAO) {
      throw new ForbiddenException('Apenas reservas pendentes podem ser rejeitadas.');
    }
    return this.prisma.reserva.update({
      where: { resCod },
      data: {
        status: ReservaStatus.REJEITADA,
        pesCodAprovador,
        motivoRejeicao: dto.motivoRejeicao,
      },
    });
  }

  async cancelarPeloMorador(resCod: number, pesCodMorador: number) {
    const r = await this.buscarPorId(resCod);
    if (r.pesCodMorador !== pesCodMorador) {
      throw new ForbiddenException('Apenas o solicitante pode cancelar a reserva.');
    }
    if (
      r.status === ReservaStatus.CONCLUIDA ||
      r.status === ReservaStatus.REJEITADA ||
      r.status === ReservaStatus.CANCELADA_PELO_MORADOR
    ) {
      throw new BadRequestException('Reserva não pode ser cancelada nesse status.');
    }
    return this.prisma.reserva.update({
      where: { resCod },
      data: { status: ReservaStatus.CANCELADA_PELO_MORADOR },
    });
  }

  async concluir(resCod: number) {
    const r = await this.buscarPorId(resCod);
    if (r.status !== ReservaStatus.APROVADA) {
      throw new BadRequestException('Apenas reservas aprovadas podem ser concluídas.');
    }
    return this.prisma.reserva.update({
      where: { resCod },
      data: { status: ReservaStatus.CONCLUIDA },
    });
  }
}
