import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

interface PasswordResetEmailParams {
  to: string;
  nome: string;
  link: string;
  ttlHours: number;
}

interface LeadNotificationParams {
  name: string;
  email: string;
  whatsapp?: string;
  reason?: string;
}

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter?: Transporter;
  private from!: string;

  constructor(private readonly cfg: ConfigService) {}

  onModuleInit() {
    const host = this.cfg.get<string>('mail.host');
    const port = this.cfg.get<number>('mail.port');
    const secure = this.cfg.get<boolean>('mail.secure');
    const user = this.cfg.get<string>('mail.user');
    const pass = this.cfg.get<string>('mail.password');
    const fromAddr = this.cfg.get<string>('mail.fromAddress') ?? user ?? 'noreply@condigtal.com';
    const fromName = this.cfg.get<string>('mail.fromName') ?? 'CONDIGTAL';

    this.from = `"${fromName}" <${fromAddr}>`;

    if (!user || !pass) {
      this.logger.warn(
        'MAIL_USER/MAIL_PASSWORD não configurados — emails serão apenas logados (modo dev).',
      );
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });
  }

  async sendPasswordResetEmail(params: PasswordResetEmailParams) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color: #2c3e50;">Redefinição de senha - CONDIGTAL</h2>
        <p>Olá, <strong>${escape(params.nome)}</strong>,</p>
        <p>Recebemos um pedido de redefinição da sua senha. Para criar uma nova, clique no link abaixo:</p>
        <p>
          <a href="${params.link}" style="display:inline-block;padding:12px 24px;background:#3498db;color:#fff;text-decoration:none;border-radius:4px;">
            Redefinir minha senha
          </a>
        </p>
        <p>Ou copie e cole esta URL no navegador:</p>
        <p style="word-break:break-all;color:#555;">${params.link}</p>
        <p><small>Este link expira em ${params.ttlHours} hora(s). Se você não solicitou, ignore este email.</small></p>
      </div>
    `;
    return this.send({
      to: params.to,
      subject: 'Redefinição de senha - CONDIGTAL',
      html,
    });
  }

  async sendLeadNotification(to: string[], params: LeadNotificationParams) {
    if (!to.length) return;
    const html = `
      <h2>Novo lead</h2>
      <p><strong>Nome:</strong> ${escape(params.name)}</p>
      <p><strong>Email:</strong> ${escape(params.email)}</p>
      <p><strong>WhatsApp:</strong> ${escape(params.whatsapp ?? '-')}</p>
      <p><strong>Motivo:</strong> ${escape(params.reason ?? '-')}</p>
    `;
    return this.send({ to: to.join(','), subject: 'Novo lead CONDIGTAL', html });
  }

  private async send(opts: { to: string; subject: string; html: string }) {
    if (!this.transporter) {
      this.logger.debug(
        `[EMAIL DRY-RUN] to=${opts.to} subject="${opts.subject}"\n${opts.html}`,
      );
      return;
    }
    try {
      const info = await this.transporter.sendMail({
        from: this.from,
        ...opts,
      });
      this.logger.log(`Email enviado para ${opts.to} (messageId=${info.messageId})`);
    } catch (e) {
      this.logger.error(`Falha ao enviar email para ${opts.to}`, e as Error);
      throw e;
    }
  }
}

function escape(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
