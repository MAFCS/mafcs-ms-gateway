import * as Joi from 'joi';
import { RpcException } from '@nestjs/microservices';
import { EnvVars } from '../interfaces/env';

export const envSchema: Joi.ObjectSchema<EnvVars> = Joi.object({
    NATS_SERVER: Joi.string().required(),
    NODE_ENV: Joi.string().valid('development', 'qa', 'production', 'test').default('development'),
    PORT: Joi.number().default(3002),
    DATABASE_URL: Joi.string().required(),
}).unknown(true)

const { error, value } = envSchema.validate(process.env);

if (error) {
    throw new RpcException(`Config validation error: ${error.message}`);
}

const envVars: EnvVars = value;

export const envs = {
    NATS_SERVER: envVars.NATS_SERVER,
    NODE_ENV: envVars.NODE_ENV,
    PORT: envVars.PORT,
    DATABASE_URL: envVars.DATABASE_URL,
}