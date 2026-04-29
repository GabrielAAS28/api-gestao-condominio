import { Module } from '@nestjs/common';
import { AreasComunsController } from './areas-comuns.controller';
import { AreasComunsService } from './areas-comuns.service';

@Module({
  controllers: [AreasComunsController],
  providers: [AreasComunsService],
  exports: [AreasComunsService],
})
export class AreasComunsModule {}
