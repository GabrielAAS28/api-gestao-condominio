import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, UnidadeStatusOcupacao } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateUnidadeDto } from './dto/create-unidade.dto';
import { UpdateUnidadeDto } from './dto/update-unidade.dto';

@Injectable()
export class UnidadesService {
  constructor(private readonly prisma: PrismaService) {}

  criar(dto: CreateUnidadeDto) {
    return this.prisma.unidade.create({
      data: { ...dto, fracaoIdeal: dto.fracaoIdeal as any, areaPrivada: dto.areaPrivada as any },
      include: { condominio: true },
    });
  }

  async listarPorCondominio(conCod: number, incluirInativas = false) {
    return this.prisma.unidade.findMany({
      where: {
        conCod,
        ...(incluirInativas ? {} : { uniAtiva: true }),
      },
      orderBy: [{ bloco: 'asc' }, { uniNumero: 'asc' }],
    });
  }

  async listar(params: {
    conCod?: number;
    incluirInativas?: boolean;
    statusOcupacao?: UnidadeStatusOcupacao;
    busca?: string;
  }) {
    const where: Prisma.UnidadeWhereInput = {};
    if (params.conCod) where.conCod = params.conCod;
    if (!params.incluirInativas) where.uniAtiva = true;
    if (params.statusOcupacao) where.uniStatusOcupacao = params.statusOcupacao;
    if (params.busca) {
      where.OR = [
        { uniNumero: { contains: params.busca, mode: 'insensitive' } },
        { bloco: { contains: params.busca, mode: 'insensitive' } },
      ];
    }
    return this.prisma.unidade.findMany({
      where,
      include: { condominio: { select: { conCod: true, conNome: true } } },
      orderBy: [{ conCod: 'asc' }, { bloco: 'asc' }, { uniNumero: 'asc' }],
    });
  }

  async buscarPorId(uniCod: number) {
    const u = await this.prisma.unidade.findUnique({
      where: { uniCod },
      include: { condominio: true },
    });
    if (!u) throw new NotFoundException('Unidade não encontrada');
    return u;
  }

  async atualizar(uniCod: number, dto: UpdateUnidadeDto) {
    await this.buscarPorId(uniCod);
    return this.prisma.unidade.update({
      where: { uniCod },
      data: { ...dto, fracaoIdeal: dto.fracaoIdeal as any, areaPrivada: dto.areaPrivada as any },
      include: { condominio: true },
    });
  }

  async inativar(uniCod: number) {
    await this.buscarPorId(uniCod);
    return this.prisma.unidade.update({
      where: { uniCod },
      data: { uniAtiva: false },
    });
  }

  async ativar(uniCod: number) {
    await this.buscarPorId(uniCod);
    return this.prisma.unidade.update({
      where: { uniCod },
      data: { uniAtiva: true },
    });
  }
}
