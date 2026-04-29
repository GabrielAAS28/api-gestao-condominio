import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../common/prisma/prisma.service';
import type { AuthenticatedUser } from '../../../common/decorators/current-user.decorator';

export interface JwtPayload {
  sub: number; // pesCod
  email: string;
  isGlobalAdmin: boolean;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly cfg: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: cfg.get<string>('jwt.accessSecret'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const pessoa = await this.prisma.pessoa.findUnique({
      where: { pesCod: payload.sub },
      include: {
        papeis: {
          where: { uscAtivoAssociacao: true },
          select: { conCod: true, uscPapel: true },
        },
      },
    });

    if (!pessoa || !pessoa.pesAtivo) {
      throw new UnauthorizedException('Usuário inativo ou não encontrado');
    }

    const roles = pessoa.papeis.map(
      (p) => `ROLE_${p.uscPapel}_${p.conCod}`,
    );
    if (pessoa.pesIsGlobalAdmin) roles.push('ROLE_GLOBAL_ADMIN');

    return {
      pesCod: pessoa.pesCod,
      email: pessoa.pesEmail,
      nome: pessoa.pesNome,
      isGlobalAdmin: pessoa.pesIsGlobalAdmin,
      roles,
    };
  }
}
