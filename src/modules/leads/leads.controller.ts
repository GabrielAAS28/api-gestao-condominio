import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/lead.dto';

@ApiTags('leads')
@Controller('leads')
export class LeadsController {
  constructor(private readonly service: LeadsService) {}

  @Public()
  @Post()
  registrar(@Body() dto: CreateLeadDto) {
    return this.service.registrar(dto);
  }
}
