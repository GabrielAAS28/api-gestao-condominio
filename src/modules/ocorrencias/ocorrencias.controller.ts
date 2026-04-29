import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { OcorrenciaStatus, OcorrenciaTipo } from '@prisma/client';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { OcorrenciasService } from './ocorrencias.service';
import {
  CreateOcorrenciaDto,
  CriarComentarioDto,
  FinalizarOcorrenciaDto,
  UpdateOcorrenciaDto,
} from './dto/ocorrencia.dto';

@ApiBearerAuth()
@ApiTags('ocorrencias')
@Controller('ocorrencias')
export class OcorrenciasController {
  constructor(private readonly service: OcorrenciasService) {}

  @Post()
  criar(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateOcorrenciaDto) {
    return this.service.criar(dto, user.pesCod);
  }

  @Get()
  @ApiOperation({ summary: 'Listar ocorrências com filtros e paginação' })
  listar(
    @Query('condominioId', new ParseIntPipe({ optional: true })) condominioId?: number,
    @Query('buscaUnidade') buscaUnidade?: string,
    @Query('buscaTitulo') buscaTitulo?: string,
    @Query('tipo', new ParseEnumPipe(OcorrenciaTipo, { optional: true })) tipo?: OcorrenciaTipo,
    @Query('status', new ParseEnumPipe(OcorrenciaStatus, { optional: true })) status?: OcorrenciaStatus,
    @Query('take', new ParseIntPipe({ optional: true })) take?: number,
    @Query('skip', new ParseIntPipe({ optional: true })) skip?: number,
  ) {
    return this.service.listar({ condominioId, buscaUnidade, buscaTitulo, tipo, status, take, skip });
  }

  @Get(':id')
  buscar(@Param('id', ParseIntPipe) id: number) {
    return this.service.buscarDetalhes(id);
  }

  @Put(':id')
  atualizar(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateOcorrenciaDto) {
    return this.service.atualizar(id, dto);
  }

  @Put(':id/finalizar')
  finalizar(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: FinalizarOcorrenciaDto,
  ) {
    return this.service.finalizar(id, dto, user.pesCod);
  }

  @Post(':id/comentarios')
  comentar(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CriarComentarioDto,
  ) {
    return this.service.adicionarComentario(id, dto, user.pesCod);
  }

  @Post(':id/anexos')
  @UseInterceptors(FileInterceptor('arquivo'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { arquivo: { type: 'string', format: 'binary' } },
    },
  })
  uploadAnexo(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.service.adicionarAnexo(id, file, user.pesCod);
  }

  @Get(':id/anexos/:anexoId/download')
  async download(
    @Param('anexoId', ParseIntPipe) anexoId: number,
    @Res() res: Response,
  ) {
    const { anexo, stream } = await this.service.streamAnexo(anexoId);
    res.setHeader(
      'Content-Type',
      anexo.tipoArquivo ?? 'application/octet-stream',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(anexo.nomeOriginal ?? 'arquivo')}"`,
    );
    stream.pipe(res);
  }

  @Delete(':id/anexos/:anexoId')
  removerAnexo(
    @Param('id', ParseIntPipe) id: number,
    @Param('anexoId', ParseIntPipe) anexoId: number,
  ) {
    return this.service.excluirAnexo(id, anexoId);
  }
}
