import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreatePessoaDto } from './dto/create-pessoa.dto';
import { UpdatePessoaDto } from './dto/update-pessoa.dto';

@Injectable()
export class PessoasService {
  constructor(private readonly prisma: PrismaService) {}

  async criar(dto: CreatePessoaDto) {
    const email = dto.pesEmail.toLowerCase().trim();
    const exists = await this.prisma.pessoa.findFirst({
      where: { OR: [{ pesEmail: email }, { pesCpfCnpj: dto.pesCpfCnpj }] },
    });
    if (exists) {
      throw new BadRequestException(
        'Já existe uma pessoa com este email ou CPF/CNPJ',
      );
    }

    const senhaHash = dto.senha ? await bcrypt.hash(dto.senha, 10) : null;

    return this.prisma.pessoa.create({
      data: {
        pesNome: dto.pesNome,
        pesCpfCnpj: dto.pesCpfCnpj,
        pesEmail: email,
        pesTipo: dto.pesTipo ?? 'F',
        pesTelefone: dto.pesTelefone,
        pesTelefone2: dto.pesTelefone2,
        pesSenhaLogin: senhaHash,
        pesIsGlobalAdmin: dto.pesIsGlobalAdmin ?? false,
      },
      select: this.defaultSelect(),
    });
  }

  async listar(params: { busca?: string; ativos?: boolean; take?: number; skip?: number }) {
    const { busca, ativos, take = 50, skip = 0 } = params;
    const where: Prisma.PessoaWhereInput = {};
    if (ativos !== undefined) where.pesAtivo = ativos;
    if (busca) {
      where.OR = [
        { pesNome: { contains: busca, mode: 'insensitive' } },
        { pesEmail: { contains: busca, mode: 'insensitive' } },
        { pesCpfCnpj: { contains: busca } },
      ];
    }
    const [items, total] = await this.prisma.$transaction([
      this.prisma.pessoa.findMany({
        where,
        orderBy: { pesNome: 'asc' },
        take: Math.min(take, 200),
        skip,
        select: this.defaultSelect(),
      }),
      this.prisma.pessoa.count({ where }),
    ]);
    return { items, total, take, skip };
  }

  async buscarPorId(pesCod: number) {
    const pessoa = await this.prisma.pessoa.findUnique({
      where: { pesCod },
      select: this.defaultSelect(true),
    });
    if (!pessoa) throw new NotFoundException('Pessoa não encontrada');
    return pessoa;
  }

  async atualizar(pesCod: number, dto: UpdatePessoaDto) {
    await this.buscarPorId(pesCod);

    const data: Prisma.PessoaUpdateInput = { ...dto };
    if (dto.pesEmail) data.pesEmail = dto.pesEmail.toLowerCase().trim();
    if (dto.senha) {
      data.pesSenhaLogin = await bcrypt.hash(dto.senha, 10);
      delete (data as any).senha;
    } else {
      delete (data as any).senha;
    }

    return this.prisma.pessoa.update({
      where: { pesCod },
      data,
      select: this.defaultSelect(),
    });
  }

  async inativar(pesCod: number) {
    await this.buscarPorId(pesCod);
    return this.prisma.pessoa.update({
      where: { pesCod },
      data: { pesAtivo: false },
      select: this.defaultSelect(),
    });
  }

  async ativar(pesCod: number) {
    await this.buscarPorId(pesCod);
    return this.prisma.pessoa.update({
      where: { pesCod },
      data: { pesAtivo: true },
      select: this.defaultSelect(),
    });
  }

  private defaultSelect(includeRoles = false): Prisma.PessoaSelect {
    return {
      pesCod: true,
      pesNome: true,
      pesCpfCnpj: true,
      pesEmail: true,
      pesTipo: true,
      pesTelefone: true,
      pesTelefone2: true,
      pesAtivo: true,
      pesIsGlobalAdmin: true,
      pesDtCadastro: true,
      pesDtAtualizacao: true,
      papeis: includeRoles
        ? {
            select: {
              conCod: true,
              uscPapel: true,
              uscAtivoAssociacao: true,
              uscDtAssociacao: true,
            },
          }
        : false,
    };
  }
}
