import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OcorrenciaStatus, OcorrenciaTipo, Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { StorageService } from '../../shared/storage/storage.service';
import {
  CreateOcorrenciaDto,
  CriarComentarioDto,
  FinalizarOcorrenciaDto,
  UpdateOcorrenciaDto,
} from './dto/ocorrencia.dto';

@Injectable()
export class OcorrenciasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async criar(dto: CreateOcorrenciaDto, pesCodRegistro: number) {
    const unidade = await this.prisma.unidade.findUnique({
      where: { uniCod: dto.unidadeId },
      select: { uniCod: true, conCod: true },
    });
    if (!unidade) throw new BadRequestException('Unidade inexistente');

    const conCod = dto.condominioId ?? unidade.conCod;

    return this.prisma.ocorrencia.create({
      data: {
        conCod,
        uniCod: unidade.uniCod,
        pesCodRegistro,
        titulo: dto.titulo,
        descricao: dto.descricao,
        tipo: dto.tipo,
        status: OcorrenciaStatus.ABERTA,
      },
      include: this.detailsInclude(),
    });
  }

  async listar(params: {
    condominioId?: number;
    buscaUnidade?: string;
    buscaTitulo?: string;
    tipo?: OcorrenciaTipo;
    status?: OcorrenciaStatus;
    take?: number;
    skip?: number;
  }) {
    const { take = 20, skip = 0 } = params;
    const where: Prisma.OcorrenciaWhereInput = {};
    if (params.condominioId) where.conCod = params.condominioId;
    if (params.tipo) where.tipo = params.tipo;
    if (params.status) where.status = params.status;
    if (params.buscaTitulo) {
      where.titulo = { contains: params.buscaTitulo, mode: 'insensitive' };
    }
    if (params.buscaUnidade) {
      where.unidade = {
        OR: [
          { uniNumero: { contains: params.buscaUnidade, mode: 'insensitive' } },
          { bloco: { contains: params.buscaUnidade, mode: 'insensitive' } },
        ],
      };
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.ocorrencia.findMany({
        where,
        orderBy: { dataRegistro: 'desc' },
        take: Math.min(take, 100),
        skip,
        select: {
          ocoCod: true,
          titulo: true,
          tipo: true,
          status: true,
          dataRegistro: true,
          dataFinalizacao: true,
          unidade: { select: { uniCod: true, uniNumero: true, bloco: true } },
          condominio: { select: { conCod: true, conNome: true } },
          pessoaRegistro: { select: { pesCod: true, pesNome: true } },
        },
      }),
      this.prisma.ocorrencia.count({ where }),
    ]);
    return { items, total, take, skip };
  }

  async buscarDetalhes(ocoCod: number) {
    const o = await this.prisma.ocorrencia.findUnique({
      where: { ocoCod },
      include: this.detailsInclude(),
    });
    if (!o) throw new NotFoundException('Ocorrência não encontrada');
    return o;
  }

  async atualizar(ocoCod: number, dto: UpdateOcorrenciaDto) {
    await this.buscarDetalhes(ocoCod);
    return this.prisma.ocorrencia.update({
      where: { ocoCod },
      data: dto,
      include: this.detailsInclude(),
    });
  }

  async finalizar(ocoCod: number, dto: FinalizarOcorrenciaDto, pesCodFinalizou: number) {
    await this.buscarDetalhes(ocoCod);
    return this.prisma.ocorrencia.update({
      where: { ocoCod },
      data: {
        status: OcorrenciaStatus.RESOLVIDA,
        parecerFinal: dto.parecerFinal,
        pesCodFinalizou,
        dataFinalizacao: new Date(),
      },
      include: this.detailsInclude(),
    });
  }

  // ----------- COMENTÁRIOS -----------
  async adicionarComentario(ocoCod: number, dto: CriarComentarioDto, pesCod: number) {
    await this.buscarDetalhes(ocoCod);
    return this.prisma.ocorrenciaComentario.create({
      data: { ocoCod, comentario: dto.comentario, pesCodComentario: pesCod },
      include: { pessoa: { select: { pesCod: true, pesNome: true } } },
    });
  }

  // ----------- ANEXOS -----------
  async adicionarAnexo(
    ocoCod: number,
    file: Express.Multer.File,
    pesCod: number,
  ) {
    await this.buscarDetalhes(ocoCod);
    if (!file) throw new BadRequestException('Arquivo obrigatório');

    const stored = await this.storage.store(file, 'ocorrencias');

    return this.prisma.ocorrenciaAnexo.create({
      data: {
        ocoCod,
        pesCodAnexo: pesCod,
        caminhoArquivo: stored.relativePath,
        nomeOriginal: stored.originalName,
        tipoArquivo: stored.mimeType,
        tamanhoArquivo: BigInt(stored.size),
      },
    });
  }

  async excluirAnexo(ocoCod: number, anexoId: number) {
    const anexo = await this.prisma.ocorrenciaAnexo.findUnique({
      where: { ocaCod: anexoId },
    });
    if (!anexo || anexo.ocoCod !== ocoCod) {
      throw new NotFoundException('Anexo não encontrado');
    }
    await this.storage.delete(anexo.caminhoArquivo);
    await this.prisma.ocorrenciaAnexo.delete({ where: { ocaCod: anexoId } });
    return { success: true };
  }

  async streamAnexo(anexoId: number) {
    const anexo = await this.prisma.ocorrenciaAnexo.findUnique({
      where: { ocaCod: anexoId },
    });
    if (!anexo) throw new NotFoundException('Anexo não encontrado');
    const stream = await this.storage.loadAsStream(anexo.caminhoArquivo);
    return { anexo, stream };
  }

  private detailsInclude(): Prisma.OcorrenciaInclude {
    return {
      condominio: { select: { conCod: true, conNome: true } },
      unidade: { select: { uniCod: true, uniNumero: true, bloco: true } },
      pessoaRegistro: { select: { pesCod: true, pesNome: true, pesEmail: true } },
      pessoaFinalizou: { select: { pesCod: true, pesNome: true } },
      comentarios: {
        orderBy: { dataComentario: 'desc' },
        include: { pessoa: { select: { pesCod: true, pesNome: true } } },
      },
      anexos: { orderBy: { dataAnexo: 'desc' } },
    };
  }
}
