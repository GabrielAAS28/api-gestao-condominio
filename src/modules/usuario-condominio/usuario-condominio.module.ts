import { Module } from '@nestjs/common';
import { UsuarioCondominioController } from './usuario-condominio.controller';
import { UsuarioCondominioService } from './usuario-condominio.service';

@Module({
  controllers: [UsuarioCondominioController],
  providers: [UsuarioCondominioService],
  exports: [UsuarioCondominioService],
})
export class UsuarioCondominioModule {}
