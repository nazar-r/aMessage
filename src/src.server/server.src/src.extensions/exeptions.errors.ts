import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Request, Response } from 'express';
import * as types from './extensions.types/types';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost) {
        const httpContext = host.switchToHttp();
        const response = httpContext.getResponse<Response>();
        const request = httpContext.getRequest<Request>();
        const status = exception.getStatus();
        const exceptionResponse = exception.getResponse() as types.ExceptionResponseBody;
        const error: types.ExceptionResponseBody = {
            message: exceptionResponse.message ?? 'Error',
            error: exceptionResponse.error ?? 'Error',
        };

        response.status(status).json({
            statusCode: status,
            message: error.message,
            error,
            timestamp: new Date().toISOString(),
            path: request.url,
        });
    }
}