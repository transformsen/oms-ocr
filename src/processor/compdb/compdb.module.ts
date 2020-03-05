/**
 * The CompDbModule implements the file processing workflow.
 */

import { HttpModule, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CompDbService } from './compdb.service';
import { JobSchema } from 'src/shared/job.schema';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([{
      name: 'Job',
      schema: JobSchema,
    }]),
  ],
  exports: [CompDbService],
  providers: [CompDbService],
})
export class CompDbModule {}
