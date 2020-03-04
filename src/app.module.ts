import { ConfigModule, ConfigService } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ApiModule } from './api/api.module';
import { ProcessorModule } from './processor/processor.module';

@Module({
  imports: [
    ApiModule,
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('WM_OMP_MONGODB_URL'),
      }),
      inject: [ConfigService],
    }),
    ProcessorModule,
  ],
})
export class AppModule {}
