import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GlobalAdminOnly } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { PessoasService } from './pessoas.service';
import { CreatePessoaDto } from './dto/create-pessoa.dto';
import { UpdatePessoaDto } from './dto/update-pessoa.dto';

@ApiBearerAuth()
@ApiTags('pessoas')
@Controller('pessoas')
export class PessoasController {
  constructor(private readonly service: PessoasService) {}

  @GlobalAdminOnly()
  @Post()
  @ApiOperation({ summary: 'Cadastrar pessoa (admin global)' })
  criar(@Body() dto: CreatePessoaDto) {
    return this.service.criar(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar pessoas com filtros' })
  listar(
    @Query('busca') busca?: string,
    @Query('ativos', new ParseBoolPipe({ optional: true })) ativos?: boolean,
    @Query('take', new ParseIntPipe({ optional: true })) take?: number,
    @Query('skip', new ParseIntPipe({ optional: true })) skip?: number,
  ) {
    return this.service.listar({ busca, ativos, take, skip });
  }

  @Get('me')
  @ApiOperation({ summary: 'Dados detalhados da pessoa logada' })
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.service.buscarPorId(user.pesCod);
  }

  @Get(':id')
  buscar(@Param('id', ParseIntPipe) id: number) {
    return this.service.buscarPorId(id);
  }

  @Put(':id')
  atualizar(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePessoaDto) {
    return this.service.atualizar(id, dto);
  }

  @GlobalAdminOnly()
  @Delete(':id')
  @ApiOperation({ summary: 'Inativar pessoa (soft delete)' })
  inativar(@Param('id', ParseIntPipe) id: number) {
    return this.service.inativar(id);
  }

  @GlobalAdminOnly()
  @Put(':id/ativar')
  ativar(@Param('id', ParseIntPipe) id: number) {
    return this.service.ativar(id);
  }
}
