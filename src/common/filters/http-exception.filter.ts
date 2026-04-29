import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Erro interno do servidor';
    let error = 'InternalServerError';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const body = res as Record<string, any>;
        message = body.message ?? body.error ?? message;
        error = body.error ?? exception.name;
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      ({ status, message, error } = mapPrismaError(exception));
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;
    }

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} — ${error}: ${
          Array.isArray(message) ? message.join('; ') : message
        }`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(status).json({
      statusCode: status,
      error,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}

function mapPrismaError(e: Prisma.PrismaClientKnownRequestError) {
  switch (e.code) {
    case 'P2002': {
      const target = (e.meta as any)?.target;
      return {
        status: HttpStatus.CONFLICT,
        message: `Registro já existe${target ? ` (campo: ${target})` : ''}`,
        error: 'UniqueConstraintViolation',
      };
    }
    case 'P2025':
      return {
        status: HttpStatus.NOT_FOUND,
        message: 'Registro não encontrado',
        error: 'NotFound',
      };
    case 'P2003':
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Violação de chave estrangeira',
        error: 'ForeignKeyViolation',
      };
    default:
      return {
        status: HttpStatus.BAD_REQUEST,
        message: `Erro no banco (${e.code})`,
        error: 'DatabaseError',
      };
  }
}
