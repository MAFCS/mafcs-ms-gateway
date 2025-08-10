import { HttpStatus, ValidationError, ValidationPipeOptions } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

/**
 * Generate errors from validation errors
 * @param errors Validation errors
 * @returns Errors
 */
function generateErrors(errors: ValidationError[]) {
  return errors.reduce(
    (accumulator, currentValue) => ({
      ...accumulator,
      [currentValue.property]:
        (currentValue.children?.length ?? 0) > 0
          ? generateErrors(currentValue.children ?? [])
          : Object.values(currentValue.constraints ?? {}).join(', '),
    }),
    {},
  );
}

/**
 * Validation options
 */
const validationOptions: ValidationPipeOptions = {
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
  errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
  transformOptions: { enableImplicitConversion: true, },
  exceptionFactory: (errors: ValidationError[]) => {
    return new RpcException({
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      errors: generateErrors(errors),
    });
  },
};

export default validationOptions;
