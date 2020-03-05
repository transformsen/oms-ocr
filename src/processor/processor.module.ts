/**
 * The ProcessorModule monitors a network directory, detects new files, and
 * schedules their processing by CompDbModule.
 */

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { CompDbModule } from './compdb/compdb.module';
import { ProcessorService } from './processor.service';
import { JobSchema } from 'src/shared/job.schema';

@Module({
  imports: [
    CompDbModule,
    MongooseModule.forFeature([{
      name: 'Job',
      schema: JobSchema,
    }]),
  ],
  providers: [ProcessorService],
  exports: [MongooseModule],
})
export class ProcessorModule {}
