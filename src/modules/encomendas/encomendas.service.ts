import { Injectable, NotFoundException } from '@nestjs/common';
import { EncomendaStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  CreateEncomendaDto,
  RetiradaEncomendaDto,
  UpdateStatusEncomendaDto,
} from './dto/encomenda.dto';

@Injectable()
export class EncomendasService {
  constructor(private readonly prisma: PrismaService) {}

  criar(dto: CreateEncomendaDto, pesCodRegistro: number) {
    return this.prisma.encomenda.create({
      data: {
        conCod: dto.condominioId,
        uniCod: dto.unidadeId,
        pesCodRegistro,
        destinatario: dto.destinatario,
        tipo: dto.tipo,
        descricao: dto.descricao,
        dataRecebimento: new Date(dto.dataRecebimento),
        nomeRecebidoPor: dto.nomeRecebidoPor,
        observacoes: dto.observacoes,
        status: EncomendaStatus.PENDENTE,
      },
      include: this.commonInclude(),
    });
  }

  async listar(params: {
    condominioId?: number;
    unidadeId?: number;
    busca?: string;
    status?: EncomendaStatus;
    take?: number;
    skip?: number;
  }) {
    const { take = 20, skip = 0 } = params;
    const where: Prisma.EncomendaWhereInput = {};
    if (params.condominioId) where.conCod = params.condominioId;
    if (params.unidadeId) where.uniCod = params.unidadeId;
    if (params.status) where.status = params.status;
    if (params.busca) {
      where.OR = [
        { destinatario: { contains: params.busca, mode: 'insensitive' } },
        { descricao: { contains: params.busca, mode: 'insensitive' } },
        { nomeRecebidoPor: { contains: params.busca, mode: 'insensitive' } },
      ];
    }
    const [items, total] = await this.prisma.$transaction([
      this.prisma.encomenda.findMany({
        where,
        orderBy: { dataRecebimento: 'desc' },
        take: Math.min(take, 100),
        skip,
        include: this.commonInclude(),
      }),
      this.prisma.encomenda.count({ where }),
    ]);
    return { items: items.map(serializeEncomenda), total, take, skip };
  }

  async buscarPorId(encCod: bigint) {
    const e = await this.prisma.encomenda.findUnique({
      where: { encCod },
      include: this.commonInclude(),
    });
    if (!e) throw new NotFoundException('Encomenda não encontrada');
    return serializeEncomenda(e);
  }

  async atualizarStatus(encCod: bigint, dto: UpdateStatusEncomendaDto) {
    await this.buscarPorId(encCod);
    const e = await this.prisma.encomenda.update({
      where: { encCod },
      data: {
        status: dto.status,
        observacaoAtualizacao: dto.observacaoAtualizacao,
        dataAtualizacaoStatus: new Date(),
      },
      include: this.commonInclude(),
    });
    return serializeEncomenda(e);
  }

  async marcarRetirada(encCod: bigint, dto: RetiradaEncomendaDto) {
    await this.buscarPorId(encCod);
    const e = await this.prisma.encomenda.update({
      where: { encCod },
      data: {
        status: EncomendaStatus.RETIRADA,
        nomeRetirada: dto.nomeRetirada,
        pesCodRetirada: dto.pesCodRetirada,
        dataRetirada: new Date(),
        dataAtualizacaoStatus: new Date(),
        observacaoAtualizacao: dto.observacoes,
      },
      include: this.commonInclude(),
    });
    return serializeEncomenda(e);
  }

  async remover(encCod: bigint) {
    await this.buscarPorId(encCod);
    return this.prisma.encomenda.delete({ where: { encCod } });
  }

  private commonInclude(): Prisma.EncomendaInclude {
    return {
      condominio: { select: { conCod: true, conNome: true } },
      unidade: { select: { uniCod: true, uniNumero: true, bloco: true } },
      pessoaRegistro: { select: { pesCod: true, pesNome: true } },
      pessoaRetirada: { select: { pesCod: true, pesNome: true } },
    };
  }
}

// O Prisma retorna `encCod` como BigInt; o JSON.stringify nativo não suporta BigInt.
function serializeEncomenda<T extends { encCod: bigint; tamanhoArquivo?: bigint | null }>(
  e: T,
): Omit<T, 'encCod'> & { encCod: string } {
  return { ...e, encCod: e.encCod.toString() } as any;
}
