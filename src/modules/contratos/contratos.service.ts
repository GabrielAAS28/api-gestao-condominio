import { Injectable, NotFoundException } from '@nestjs/common';
import { ContratoStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateContratoDto, UpdateContratoDto } from './dto/contrato.dto';

@Injectable()
export class ContratosService {
  constructor(private readonly prisma: PrismaService) {}

  criar(dto: CreateContratoDto) {
    return this.prisma.contrato.create({
      data: {
        conCod: dto.condominioId,
        empresa: dto.empresa,
        servico: dto.servico,
        valor: new Prisma.Decimal(dto.valor),
        responsavel: dto.responsavel,
        status: dto.status,
        dataInicio: new Date(dto.dataInicio),
        dataFim: new Date(dto.dataFim),
        observacoes: dto.observacoes,
      },
    });
  }

  listar(params: {
    condominioId?: number;
    status?: ContratoStatus;
    busca?: string;
  }) {
    const where: Prisma.ContratoWhereInput = {};
    if (params.condominioId) where.conCod = params.condominioId;
    if (params.status) where.status = params.status;
    if (params.busca) {
      where.OR = [
        { empresa: { contains: params.busca, mode: 'insensitive' } },
        { servico: { contains: params.busca, mode: 'insensitive' } },
        { responsavel: { contains: params.busca, mode: 'insensitive' } },
      ];
    }
    return this.prisma.contrato.findMany({
      where,
      orderBy: { dataInicio: 'desc' },
      include: { condominio: { select: { conCod: true, conNome: true } } },
    });
  }

  async buscarPorId(id: number) {
    const c = await this.prisma.contrato.findUnique({
      where: { id },
      include: { condominio: { select: { conCod: true, conNome: true } } },
    });
    if (!c) throw new NotFoundException('Contrato não encontrado');
    return c;
  }

  async atualizar(id: number, dto: UpdateContratoDto) {
    await this.buscarPorId(id);
    return this.prisma.contrato.update({
      where: { id },
      data: {
        empresa: dto.empresa,
        servico: dto.servico,
        valor: dto.valor !== undefined ? new Prisma.Decimal(dto.valor) : undefined,
        responsavel: dto.responsavel,
        status: dto.status,
        dataInicio: dto.dataInicio ? new Date(dto.dataInicio) : undefined,
        dataFim: dto.dataFim ? new Date(dto.dataFim) : undefined,
        observacoes: dto.observacoes,
      },
    });
  }

  async remover(id: number) {
    await this.buscarPorId(id);
    return this.prisma.contrato.delete({ where: { id } });
  }
}
