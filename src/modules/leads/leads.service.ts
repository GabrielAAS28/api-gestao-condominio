import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../../shared/email/email.service';
import { CreateLeadDto } from './dto/lead.dto';

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);

  constructor(
    private readonly email: EmailService,
    private readonly cfg: ConfigService,
  ) {}

  async registrar(dto: CreateLeadDto) {
    const recipients = this.cfg.get<string[]>('leads.notificationEmails') ?? [];
    this.logger.log(`Lead recebido: ${dto.name} <${dto.email}>`);

    if (recipients.length > 0) {
      try {
        await this.email.sendLeadNotification(recipients, dto);
      } catch (err) {
        this.logger.error('Falha ao enviar notificação de lead', err as Error);
      }
    } else {
      this.logger.warn(
        'LEAD_NOTIFICATION_EMAILS não configurado — lead apenas registrado em log.',
      );
    }

    return { success: true, message: 'Recebido. Entraremos em contato em breve.' };
  }
}
