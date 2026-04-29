import { Module } from '@nestjs/common';
import { OcupantesController } from './ocupantes.controller';
import { OcupantesService } from './ocupantes.service';

@Module({
  controllers: [OcupantesController],
  providers: [OcupantesService],
})
export class OcupantesModule {}
