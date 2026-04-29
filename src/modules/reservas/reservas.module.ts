import { Module } from '@nestjs/common';
import { ReservasController } from './reservas.controller';
import { ReservasService } from './reservas.service';

@Module({
  controllers: [ReservasController],
  providers: [ReservasService],
})
export class ReservasModule {}
