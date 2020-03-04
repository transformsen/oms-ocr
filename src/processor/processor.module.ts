/**
 * The ProcessorModule monitors a network directory, detects new files, and
 * schedules their processing by CompDbModule.
 */

import { Module } from '@nestjs/common';

import { CompDbModule } from './compdb/compdb.module';

@Module({
  imports: [CompDbModule],
})
export class ProcessorModule {}
