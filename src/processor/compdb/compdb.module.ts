/**
 * The CompDbModule implements the file processing workflow.
 */

import { HttpModule, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CompDbService } from './compdb.service';
import { JobSchema } from 'src/shared/job.schema';
import { DMSApiClientService } from './dms-api-client/dms-api-client.service';
import { EventApiClientService } from './event-api-client/event-api-client.service';
import { OmsOcrService } from './oms-ocr/oms-ocr.service';

@Module({
  imports: [
    HttpModule,
    MongooseModule.forFeature([{
      name: 'Job',
      schema: JobSchema,
    }]),
  ],
  exports: [CompDbService],
  providers: [CompDbService, EventApiClientService, DMSApiClientService, OmsOcrService],
})
export class CompDbModule {}
