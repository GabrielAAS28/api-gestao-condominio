import { Module } from '@nestjs/common';
import { VisitantesController } from './visitantes.controller';
import { VisitantesService } from './visitantes.service';

@Module({
  controllers: [VisitantesController],
  providers: [VisitantesService],
})
export class VisitantesModule {}
