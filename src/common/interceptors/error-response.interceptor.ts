import { ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { FastifyReply } from 'fastify';
import { CallHandler } from '@nestjs/common';

@Injectable()
export class ErrorResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        if (context.getType() === 'http') {
          const response = context.switchToHttp().getResponse<FastifyReply>();

          if (
            data &&
            typeof data === 'object' &&
            'statusCode' in data &&
            typeof data.statusCode === 'number' &&
            data.statusCode >= 400
          ) {
            const statusCode = data.statusCode;
            response.status(statusCode);
            return data;
          }
        }
        return data;
      }),
    );
  }
}
