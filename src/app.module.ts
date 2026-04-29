import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { PrismaModule } from './common/prisma/prisma.module';
import { AppController } from './app.controller';

import { AuthModule } from './modules/auth/auth.module';
import { PessoasModule } from './modules/pessoas/pessoas.module';
import { CondominiosModule } from './modules/condominios/condominios.module';
import { UnidadesModule } from './modules/unidades/unidades.module';
import { UsuarioCondominioModule } from './modules/usuario-condominio/usuario-condominio.module';
import { OcupantesModule } from './modules/ocupantes/ocupantes.module';
import { OcorrenciasModule } from './modules/ocorrencias/ocorrencias.module';
import { ComunicadosModule } from './modules/comunicados/comunicados.module';
import { EncomendasModule } from './modules/encomendas/encomendas.module';
import { AreasComunsModule } from './modules/areas-comuns/areas-comuns.module';
import { ReservasModule } from './modules/reservas/reservas.module';
import { VisitantesModule } from './modules/visitantes/visitantes.module';
import { ContratosModule } from './modules/contratos/contratos.module';
import { LeadsModule } from './modules/leads/leads.module';

import { EmailModule } from './shared/email/email.module';
import { StorageModule } from './shared/storage/storage.module';

import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60_000, limit: 120 },
    ]),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/api/static/uploads',
    }),
    PrismaModule,
    EmailModule,
    StorageModule,
    AuthModule,
    PessoasModule,
    CondominiosModule,
    UnidadesModule,
    UsuarioCondominioModule,
    OcupantesModule,
    OcorrenciasModule,
    ComunicadosModule,
    EncomendasModule,
    AreasComunsModule,
    ReservasModule,
    VisitantesModule,
    ContratosModule,
    LeadsModule,
  ],
  controllers: [AppController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
