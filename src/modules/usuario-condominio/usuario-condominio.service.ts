import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AssociarUsuarioDto } from './dto/associar-usuario.dto';

@Injectable()
export class UsuarioCondominioService {
  constructor(private readonly prisma: PrismaService) {}

  async associar(dto: AssociarUsuarioDto) {
    return this.prisma.usuarioCondominio.upsert({
      where: {
        pesCod_conCod_uscPapel: {
          pesCod: dto.pesCod,
          conCod: dto.conCod,
          uscPapel: dto.uscPapel,
        },
      },
      create: {
        pesCod: dto.pesCod,
        conCod: dto.conCod,
        uscPapel: dto.uscPapel,
        uscAtivoAssociacao: dto.uscAtivoAssociacao ?? true,
      },
      update: {
        uscAtivoAssociacao: dto.uscAtivoAssociacao ?? true,
      },
    });
  }

  listarPorPessoa(pesCod: number) {
    return this.prisma.usuarioCondominio.findMany({
      where: { pesCod },
      include: { condominio: { select: { conCod: true, conNome: true, conAtivo: true } } },
    });
  }

  listarPorCondominio(conCod: number) {
    return this.prisma.usuarioCondominio.findMany({
      where: { conCod },
      include: {
        pessoa: { select: { pesCod: true, pesNome: true, pesEmail: true, pesAtivo: true } },
      },
      orderBy: [{ uscPapel: 'asc' }],
    });
  }

  async desassociar(pesCod: number, conCod: number, papel: UserRole) {
    const exists = await this.prisma.usuarioCondominio.findUnique({
      where: { pesCod_conCod_uscPapel: { pesCod, conCod, uscPapel: papel } },
    });
    if (!exists) throw new NotFoundException('Associação não encontrada');
    return this.prisma.usuarioCondominio.delete({
      where: { pesCod_conCod_uscPapel: { pesCod, conCod, uscPapel: papel } },
    });
  }
}
