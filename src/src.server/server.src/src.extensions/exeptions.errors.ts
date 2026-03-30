import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import * as types from './extensions.types/types';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse() as types.ExceptionResponseBody;

    const error: types.ExceptionResponseBody = {
      message: exceptionResponse?.message ?? 'Error',
      error: exceptionResponse?.error ?? 'Error',
    };

    reply.status(status).send({
      statusCode: status,
      message: error.message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}