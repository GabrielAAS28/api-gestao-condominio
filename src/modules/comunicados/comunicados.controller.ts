import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
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
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { PublicoDestino } from '@prisma/client';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { ComunicadosService } from './comunicados.service';
import { CreateComunicadoDto } from './dto/comunicado.dto';

@ApiBearerAuth()
@ApiTags('comunicados')
@Controller('comunicados')
export class ComunicadosController {
  constructor(private readonly service: ComunicadosService) {}

  @Post()
  @UseInterceptors(FileInterceptor('anexo'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateComunicadoDto })
  criar(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateComunicadoDto,
    @UploadedFile() anexo?: Express.Multer.File,
  ) {
    return this.service.criar(dto, anexo, user.pesCod);
  }

  @Get()
  listar(
    @Query('titulo') titulo?: string,
    @Query('mensagem') mensagem?: string,
    @Query('publicoDestino') publicoDestinoRaw?: string,
    @Query('isUrgente') isUrgenteRaw?: string,
    @Query('condominioId') condominioIdRaw?: string,
    @Query('take') takeRaw?: string,
    @Query('skip') skipRaw?: string,
  ) {
    const publicoDestino = this.parsePublicoDestino(publicoDestinoRaw);
    const isUrgente = this.parseBoolean(isUrgenteRaw, 'isUrgente');
    const condominioId = this.parseOptionalInt(condominioIdRaw, 'condominioId');
    const take = this.parseOptionalInt(takeRaw, 'take');
    const skip = this.parseOptionalInt(skipRaw, 'skip');

    return this.service.listar({ titulo, mensagem, publicoDestino, isUrgente, condominioId, take, skip });
  }

  @Get(':id')
  buscar(@Param('id', ParseIntPipe) id: number) {
    return this.service.buscarPorId(id);
  }

  @Put(':id/marcar-como-lido')
  marcarLido(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.marcarComoLido(id, user.pesCod);
  }

  @Delete(':id')
  remover(@Param('id', ParseIntPipe) id: number) {
    return this.service.remover(id);
  }

  @Get(':id/anexo/download')
  async download(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const { filename, stream } = await this.service.streamAnexo(id);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(filename)}"`,
    );
    stream.pipe(res);
  }

  private parseOptionalInt(value: string | undefined, field: string): number | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    const parsed = Number(value);
    if (!Number.isInteger(parsed)) {
      throw new BadRequestException(`${field} deve ser um inteiro válido`);
    }
    return parsed;
  }

  private parseBoolean(value: string | undefined, field: string): boolean | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    if (value === 'true') return true;
    if (value === 'false') return false;
    throw new BadRequestException(`${field} deve ser true ou false`);
  }

  private parsePublicoDestino(value: string | undefined): PublicoDestino | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    if ((Object.values(PublicoDestino) as string[]).includes(value)) {
      return value as PublicoDestino;
    }
    throw new BadRequestException('publicoDestino inválido');
  }
}
