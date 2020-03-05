/**
 * The API module.
 */

import { Module } from '@nestjs/common';

import { ApiController } from './api.controller';
import { ApiService } from './api.service';
import { ProcessorModule } from '../processor/processor.module';

@Module({
  imports: [ProcessorModule],
  controllers: [ApiController],
  providers: [ApiService],
})
export class ApiModule {}