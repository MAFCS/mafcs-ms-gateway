import { Catch, ArgumentsHost, ExceptionFilter, HttpStatus, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { FastifyReply } from 'fastify';
import { parseStatusCode } from '../utils/parse-status-code';

interface ErrorResponse {
  statusCode?: number;
  message: string | object;
}

@Catch(RpcException)
export class RpcCustomExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(RpcCustomExceptionFilter.name);

  catch(exception: RpcException, host: ArgumentsHost) {
    const rpcError = exception.getError();
    this.logger.error(rpcError);

    if (host.getType() === 'http') {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse<FastifyReply>();

      if (rpcError.toString().includes('Empty response')) {
        const statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        return response.status(statusCode).send({
          statusCode,
          message: rpcError.toString().substring(0, rpcError.toString().indexOf('(') - 1),
        });
      }

      if (typeof rpcError === 'object' && 'error' in rpcError && typeof rpcError.error === 'object') {
        const error = rpcError.error as ErrorResponse;
        if ('statusCode' in error && 'message' in error) {
          const statusCode = parseStatusCode(error as Record<'statusCode', unknown>);
          return response.status(statusCode).send({
            statusCode,
            message: error.message,
          });
        }
      }

      if (
        typeof rpcError === 'object' &&
        'statusCode' in rpcError &&
        ('errors' in rpcError || 'validations' in rpcError)
      ) {
        const errorWithStatus = rpcError as Record<'statusCode', unknown>;
        const statusCode = parseStatusCode(errorWithStatus);
        return response.status(statusCode).send(rpcError);
      }

      if (typeof rpcError === 'object' && 'statusCode' in rpcError && 'message' in rpcError) {
        const errorWithStatus = rpcError as Record<'statusCode', unknown>;
        const statusCode = parseStatusCode(errorWithStatus);
        return response.status(statusCode).send({
          statusCode,
          message: (rpcError as ErrorResponse).message,
        });
      }

      const defaultStatusCode = HttpStatus.BAD_REQUEST;
      return response.status(defaultStatusCode).send({
        statusCode: defaultStatusCode,
        message: rpcError,
      });
    } else {
      if (typeof rpcError === 'object') {
        if (
          'error' in rpcError &&
          typeof rpcError.error === 'object' &&
          rpcError.error !== null &&
          'statusCode' in rpcError.error &&
          'message' in rpcError.error
        ) {
          const nestedError = rpcError.error as Record<'statusCode', unknown>;
          return {
            statusCode: parseStatusCode(nestedError),
            message: (rpcError.error as ErrorResponse).message,
          };
        }

        if ('statusCode' in rpcError && 'message' in rpcError) {
          const errorWithStatus = rpcError as Record<'statusCode', unknown>;
          throw new RpcException({
            statusCode: parseStatusCode(errorWithStatus),
            message: (rpcError as ErrorResponse).message,
          });
        }

        if ('message' in rpcError && typeof rpcError.message === 'object' && rpcError.message !== null) {
          const innerMessage = rpcError.message as ErrorResponse;
          const statusCode =
            'statusCode' in innerMessage && typeof innerMessage.statusCode === 'number'
              ? innerMessage.statusCode
              : HttpStatus.BAD_REQUEST;

          return {
            statusCode: statusCode,
            message: innerMessage,
          };
        }
      }

      if (rpcError.toString().includes('Empty response')) {
        const statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
        return {
          statusCode: statusCode,
          message: rpcError.toString().substring(0, rpcError.toString().indexOf('(') - 1),
        };
      }

      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: rpcError,
      };
    }
  }
}
