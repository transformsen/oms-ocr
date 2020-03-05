import { ConfigModule, ConfigService } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ApiModule } from './api/api.module';
import { MockApiModule } from './mock-api/mock-api.module';
import { ProcessorModule } from './processor/processor.module';

@Module({
  imports: [
    ApiModule,
    ConfigModule.forRoot({
      envFilePath: `${process.env.WM_OMP_CONFIG_ENV || ''}.env`,
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('WM_OMP_MONGODB_URL'),
      }),
      inject: [ConfigService],
    }),
    MockApiModule,
    ProcessorModule,
  ],
  providers: [MongooseModule],
})
export class AppModule {}
