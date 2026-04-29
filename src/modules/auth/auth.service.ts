import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EmailService } from '../../shared/email/email.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly cfg: ConfigService,
    private readonly email: EmailService,
  ) {}

  // ---------- LOGIN ----------
  async login(dto: LoginDto, meta: { userAgent?: string; ip?: string } = {}) {
    const pessoa = await this.prisma.pessoa.findUnique({
      where: { pesEmail: dto.email.toLowerCase().trim() },
    });

    if (!pessoa || !pessoa.pesAtivo || !pessoa.pesSenhaLogin) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const ok = await bcrypt.compare(dto.senha, pessoa.pesSenhaLogin);
    if (!ok) throw new UnauthorizedException('Credenciais inválidas');

    return this.issueTokens(pessoa, meta);
  }

  // ---------- REFRESH ----------
  async refresh(dto: RefreshTokenDto, meta: { userAgent?: string; ip?: string } = {}) {
    const tokenHash = this.hashToken(dto.refreshToken);
    const record = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { pessoa: true },
    });

    if (!record || record.revokedAt || record.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }
    if (!record.pessoa.pesAtivo) {
      throw new UnauthorizedException('Usuário inativo');
    }

    // Rotação: revoga o token atual e emite um novo par
    await this.prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokens(record.pessoa, meta);
  }

  // ---------- LOGOUT ----------
  async logout(refreshToken?: string, pesCod?: number) {
    if (refreshToken) {
      const tokenHash = this.hashToken(refreshToken);
      await this.prisma.refreshToken
        .update({ where: { tokenHash }, data: { revokedAt: new Date() } })
        .catch(() => undefined);
    } else if (pesCod) {
      await this.prisma.refreshToken.updateMany({
        where: { pesCod, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    return { success: true };
  }

  // ---------- ESQUECI MINHA SENHA ----------
  async forgotPassword(dto: ForgotPasswordDto) {
    const pessoa = await this.prisma.pessoa.findUnique({
      where: { pesEmail: dto.email.toLowerCase().trim() },
    });

    // Resposta sempre genérica (evita enumeração de emails)
    if (!pessoa || !pessoa.pesAtivo) {
      return { success: true };
    }

    const rawToken = randomBytes(32).toString('hex');
    const ttlHours = this.cfg.get<number>('passwordReset.ttlHours') ?? 2;
    const expiracao = new Date(Date.now() + ttlHours * 3600 * 1000);

    await this.prisma.passwordResetToken.create({
      data: { token: rawToken, pesCod: pessoa.pesCod, expiracao },
    });

    const baseUrl = this.cfg.get<string>('passwordReset.baseUrl');
    const link = `${baseUrl}?token=${rawToken}`;

    try {
      await this.email.sendPasswordResetEmail({
        to: pessoa.pesEmail,
        nome: pessoa.pesNome,
        link,
        ttlHours,
      });
    } catch (e) {
      this.logger.error('Falha ao enviar email de reset de senha', e as Error);
    }

    return { success: true };
  }

  // ---------- REDEFINIR SENHA POR TOKEN ----------
  async resetPassword(dto: ResetPasswordDto) {
    const tokenRow = await this.prisma.passwordResetToken.findUnique({
      where: { token: dto.token },
    });

    if (
      !tokenRow ||
      tokenRow.usedAt ||
      tokenRow.expiracao < new Date()
    ) {
      throw new BadRequestException('Token inválido ou expirado');
    }

    const hash = await bcrypt.hash(dto.novaSenha, 10);

    await this.prisma.$transaction([
      this.prisma.pessoa.update({
        where: { pesCod: tokenRow.pesCod },
        data: { pesSenhaLogin: hash },
      }),
      this.prisma.passwordResetToken.update({
        where: { token: tokenRow.token },
        data: { usedAt: new Date() },
      }),
      // invalida todos os refresh tokens ativos do usuário
      this.prisma.refreshToken.updateMany({
        where: { pesCod: tokenRow.pesCod, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    return { success: true };
  }

  // ---------- TROCAR SENHA (usuário logado) ----------
  async changePassword(pesCod: number, dto: ChangePasswordDto) {
    const pessoa = await this.prisma.pessoa.findUnique({
      where: { pesCod },
    });
    if (!pessoa?.pesSenhaLogin) {
      throw new BadRequestException('Usuário não possui senha cadastrada');
    }
    const ok = await bcrypt.compare(dto.senhaAtual, pessoa.pesSenhaLogin);
    if (!ok) throw new UnauthorizedException('Senha atual incorreta');

    const hash = await bcrypt.hash(dto.novaSenha, 10);
    await this.prisma.pessoa.update({
      where: { pesCod },
      data: { pesSenhaLogin: hash },
    });

    // revoga refresh tokens para forçar relogin nos outros dispositivos
    await this.prisma.refreshToken.updateMany({
      where: { pesCod, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return { success: true };
  }

  // ---------- HELPERS ----------
  private async issueTokens(
    pessoa: { pesCod: number; pesEmail: string; pesIsGlobalAdmin: boolean; pesNome: string },
    meta: { userAgent?: string; ip?: string } = {},
  ) {
    const payload = {
      sub: pessoa.pesCod,
      email: pessoa.pesEmail,
      isGlobalAdmin: pessoa.pesIsGlobalAdmin,
    };

    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.cfg.get<string>('jwt.accessSecret'),
      expiresIn: this.cfg.get<string>('jwt.accessExpiresIn'),
    });

    const refreshToken = randomBytes(48).toString('hex');
    const refreshExpires = this.parseDuration(
      this.cfg.get<string>('jwt.refreshExpiresIn') ?? '7d',
    );
    const expiresAt = new Date(Date.now() + refreshExpires);

    await this.prisma.refreshToken.create({
      data: {
        pesCod: pessoa.pesCod,
        tokenHash: this.hashToken(refreshToken),
        expiresAt,
        userAgent: meta.userAgent?.slice(0, 255),
        ipAddress: meta.ip?.slice(0, 45),
      },
    });

    return {
      tokenType: 'Bearer',
      accessToken,
      refreshToken,
      expiresIn: this.parseDuration(
        this.cfg.get<string>('jwt.accessExpiresIn') ?? '15m',
      ) / 1000,
      usuario: {
        pesCod: pessoa.pesCod,
        nome: pessoa.pesNome,
        email: pessoa.pesEmail,
        isGlobalAdmin: pessoa.pesIsGlobalAdmin,
      },
    };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private parseDuration(d: string): number {
    // Aceita: "15m", "7d", "2h", "3600s", ou número puro em segundos
    const m = d.match(/^(\d+)([smhd])?$/);
    if (!m) return Number(d) * 1000;
    const n = parseInt(m[1], 10);
    const unit = m[2] ?? 's';
    const map: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
    const mult = map[unit] ?? 1000;
    return n * mult;
  }
}
