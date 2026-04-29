import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PublicoDestino } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { StorageService } from '../../shared/storage/storage.service';
import { CreateComunicadoDto } from './dto/comunicado.dto';

@Injectable()
export class ComunicadosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async criar(
    dto: CreateComunicadoDto,
    file: Express.Multer.File | undefined,
    pesCodCriador: number,
  ) {
    let caminhoAnexo: string | undefined;
    if (file) {
      const stored = await this.storage.store(file, 'comunicados');
      caminhoAnexo = stored.relativePath;
    }
    return this.prisma.comunicado.create({
      data: {
        titulo: dto.titulo,
        mensagem: dto.mensagem,
        publicoDestino: dto.publicoDestino,
        isUrgente: dto.isUrgente ?? false,
        caminhoAnexo,
        pesCodCriador,
        condominios: {
          connect: dto.condominiosIds.map((id) => ({ conCod: id })),
        },
      },
      include: { condominios: true },
    });
  }

  async listar(params: {
    titulo?: string;
    mensagem?: string;
    publicoDestino?: PublicoDestino;
    isUrgente?: boolean;
    condominioId?: number;
    take?: number;
    skip?: number;
  }) {
    const { take = 20, skip = 0 } = params;
    const where: Prisma.ComunicadoWhereInput = {};
    if (params.titulo) where.titulo = { contains: params.titulo, mode: 'insensitive' };
    if (params.mensagem) where.mensagem = { contains: params.mensagem, mode: 'insensitive' };
    if (params.publicoDestino) where.publicoDestino = params.publicoDestino;
    if (params.isUrgente !== undefined) where.isUrgente = params.isUrgente;
    if (params.condominioId) {
      where.condominios = { some: { conCod: params.condominioId } };
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.comunicado.findMany({
        where,
        orderBy: { dataCadastro: 'desc' },
        take: Math.min(take, 100),
        skip,
        include: {
          condominios: { select: { conCod: true, conNome: true } },
          pessoaCriador: { select: { pesCod: true, pesNome: true } },
          _count: { select: { leituras: true } },
        },
      }),
      this.prisma.comunicado.count({ where }),
    ]);
    return { items, total, take, skip };
  }

  async buscarPorId(comCod: number) {
    const c = await this.prisma.comunicado.findUnique({
      where: { comCod },
      include: {
        condominios: true,
        pessoaCriador: { select: { pesCod: true, pesNome: true } },
        leituras: { include: { pessoa: { select: { pesCod: true, pesNome: true } } } },
      },
    });
    if (!c) throw new NotFoundException('Comunicado não encontrado');
    return c;
  }

  async marcarComoLido(comCod: number, pesCod: number) {
    return this.prisma.comunicadoLeitura.upsert({
      where: { comCod_pesCod: { comCod, pesCod } },
      update: {},
      create: { comCod, pesCod },
    });
  }

  async remover(comCod: number) {
    const c = await this.buscarPorId(comCod);
    if (c.caminhoAnexo) await this.storage.delete(c.caminhoAnexo);
    await this.prisma.comunicado.delete({ where: { comCod } });
    return { success: true };
  }

  async streamAnexo(comCod: number) {
    const c = await this.buscarPorId(comCod);
    if (!c.caminhoAnexo) throw new NotFoundException('Comunicado sem anexo');
    return {
      filename: c.caminhoAnexo.split('/').pop() ?? 'arquivo',
      stream: await this.storage.loadAsStream(c.caminhoAnexo),
    };
  }
}
