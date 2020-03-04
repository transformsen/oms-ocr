/**
 * The API module.
 */

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ApiController } from './api.controller';
import { ApiService } from './api.service';
import { JobSchema } from './job.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{
      name: 'Job',
      schema: JobSchema,
    }]),
  ],
  controllers: [ApiController],
  providers: [ApiService],
})
export class ApiModule {}