import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateOcupanteDto } from './dto/ocupante.dto';

@Injectable()
export class OcupantesService {
  constructor(private readonly prisma: PrismaService) {}

  criar(dto: CreateOcupanteDto) {
    return this.prisma.ocupante.create({
      data: {
        ...dto,
        ocuDtInicioOcupacao: dto.ocuDtInicioOcupacao
          ? new Date(dto.ocuDtInicioOcupacao)
          : undefined,
        ocuDtFimOcupacao: dto.ocuDtFimOcupacao
          ? new Date(dto.ocuDtFimOcupacao)
          : undefined,
        ocuDtCadastro: new Date(),
      },
      include: {
        pessoa: { select: { pesCod: true, pesNome: true, pesEmail: true } },
        unidade: { select: { uniCod: true, uniNumero: true, bloco: true, conCod: true } },
      },
    });
  }

  listarPorUnidade(uniCod: number) {
    return this.prisma.ocupante.findMany({
      where: { uniCod },
      include: { pessoa: { select: { pesCod: true, pesNome: true, pesEmail: true } } },
      orderBy: { ocuDtCadastro: 'desc' },
    });
  }

  listarPorPessoa(pesCod: number) {
    return this.prisma.ocupante.findMany({
      where: { pesCod },
      include: {
        unidade: {
          include: { condominio: { select: { conCod: true, conNome: true } } },
        },
      },
    });
  }

  async buscarPorId(ocuCod: number) {
    const o = await this.prisma.ocupante.findUnique({
      where: { ocuCod },
      include: { pessoa: true, unidade: { include: { condominio: true } } },
    });
    if (!o) throw new NotFoundException('Ocupante não encontrado');
    return o;
  }

  async atualizar(ocuCod: number, dto: Partial<CreateOcupanteDto>) {
    await this.buscarPorId(ocuCod);
    return this.prisma.ocupante.update({
      where: { ocuCod },
      data: {
        ...dto,
        ocuDtInicioOcupacao: dto.ocuDtInicioOcupacao
          ? new Date(dto.ocuDtInicioOcupacao)
          : undefined,
        ocuDtFimOcupacao: dto.ocuDtFimOcupacao
          ? new Date(dto.ocuDtFimOcupacao)
          : undefined,
      },
    });
  }

  async remover(ocuCod: number) {
    await this.buscarPorId(ocuCod);
    return this.prisma.ocupante.delete({ where: { ocuCod } });
  }
}
