import { Module } from '@nestjs/common';
import { ComunicadosController } from './comunicados.controller';
import { ComunicadosService } from './comunicados.service';

@Module({
  controllers: [ComunicadosController],
  providers: [ComunicadosService],
})
export class ComunicadosModule {}
