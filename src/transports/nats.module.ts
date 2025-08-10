import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { NATS_SERVICE } from 'src/common/constants/ms-names.constant';
import { envs } from 'src/config/schema/app.schema';

@Module({
  imports: [
    ClientsModule.registerAsync({
      clients: [
        {
          name: NATS_SERVICE,
          useFactory: () => ({
            transport: Transport.NATS,
            options: {
              servers: envs.NATS_SERVER,
            },
          }),
        },
      ],
    }),
  ],
  exports: [
    ClientsModule.registerAsync({
      clients: [
        {
          name: NATS_SERVICE,
          useFactory: () => ({
            transport: Transport.NATS,
            options: {
              servers: envs.NATS_SERVER,
            },
          }),
        },
      ],
    }),
  ],
})
export class NatsModule { }
