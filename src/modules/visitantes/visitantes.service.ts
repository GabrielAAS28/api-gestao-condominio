import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, VisitanteStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateVisitanteDto } from './dto/visitante.dto';

@Injectable()
export class VisitantesService {
  constructor(private readonly prisma: PrismaService) {}

  registrar(dto: CreateVisitanteDto, pesCodRegistro: number) {
    return this.prisma.visitante.create({
      data: {
        conCod: dto.condominioId,
        uniCod: dto.unidadeId,
        pesCodMorador: dto.pesCodMorador,
        pesCodRegistro,
        nome: dto.nome,
        cpf: dto.cpf,
        rg: dto.rg,
        telefone: dto.telefone,
        dataEntrada: new Date(dto.dataEntrada),
        observacoes: dto.observacoes,
        status: VisitanteStatus.NO_LOCAL,
      },
    });
  }

  listar(params: {
    condominioId?: number;
    unidadeId?: number;
    status?: VisitanteStatus;
    busca?: string;
  }) {
    const where: Prisma.VisitanteWhereInput = {};
    if (params.condominioId) where.conCod = params.condominioId;
    if (params.unidadeId) where.uniCod = params.unidadeId;
    if (params.status) where.status = params.status;
    if (params.busca) {
      where.OR = [
        { nome: { contains: params.busca, mode: 'insensitive' } },
        { cpf: { contains: params.busca } },
      ];
    }
    return this.prisma.visitante.findMany({
      where,
      orderBy: { dataEntrada: 'desc' },
      include: {
        unidade: { select: { uniCod: true, uniNumero: true, bloco: true } },
        condominio: { select: { conCod: true, conNome: true } },
      },
    });
  }

  async buscarPorId(visCod: number) {
    const v = await this.prisma.visitante.findUnique({ where: { visCod } });
    if (!v) throw new NotFoundException('Visitante não encontrado');
    return v;
  }

  async marcarSaida(visCod: number) {
    await this.buscarPorId(visCod);
    return this.prisma.visitante.update({
      where: { visCod },
      data: { status: VisitanteStatus.SAIU, dataSaida: new Date() },
    });
  }
}
