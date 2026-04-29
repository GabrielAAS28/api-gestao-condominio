import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateCondominioDto } from './dto/create-condominio.dto';
import { UpdateCondominioDto } from './dto/update-condominio.dto';

@Injectable()
export class CondominiosService {
  constructor(private readonly prisma: PrismaService) {}

  criar(dto: CreateCondominioDto) {
    return this.prisma.condominio.create({ data: dto });
  }

  listar(params: { ativos?: boolean; busca?: string }) {
    return this.prisma.condominio.findMany({
      where: {
        ...(params.ativos !== undefined ? { conAtivo: params.ativos } : {}),
        ...(params.busca
          ? {
              OR: [
                { conNome: { contains: params.busca, mode: 'insensitive' } },
                { conCidade: { contains: params.busca, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { conNome: 'asc' },
    });
  }

  async buscarPorId(conCod: number) {
    const c = await this.prisma.condominio.findUnique({ where: { conCod } });
    if (!c) throw new NotFoundException('Condomínio não encontrado');
    return c;
  }

  async atualizar(conCod: number, dto: UpdateCondominioDto) {
    await this.buscarPorId(conCod);
    return this.prisma.condominio.update({ where: { conCod }, data: dto });
  }

  async inativar(conCod: number) {
    await this.buscarPorId(conCod);
    return this.prisma.condominio.update({
      where: { conCod },
      data: { conAtivo: false },
    });
  }

  async ativar(conCod: number) {
    await this.buscarPorId(conCod);
    return this.prisma.condominio.update({
      where: { conCod },
      data: { conAtivo: true },
    });
  }
}
