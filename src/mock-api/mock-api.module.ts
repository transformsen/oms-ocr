/**
 * This is a trivial mock-up of DMS and Event API. It exposes to endpoints:
 *
 * POST /mocks/document/upload
 * POST /mocks/event
 *
 * each endpoint just prints received body to the console log, and responds
 * with 200 status.
 */

import { Module } from '@nestjs/common';
import { MockApiController } from './mock-api.controller';

@Module({
  controllers: [MockApiController],
})
export class MockApiModule {}
