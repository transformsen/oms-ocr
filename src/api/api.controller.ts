/**
 * The ApiController.
 */

import {
  Body,
  Controller,
  HttpCode,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';

import { ApiService } from './api.service';
import { SubmitJobDto } from './submit-job.dto';

@Controller()
@UsePipes(new ValidationPipe({
  forbidUnknownValues: true,
  whitelist: true,
  forbidNonWhitelisted: true,
}))
export class ApiController {
  constructor(private readonly apiService: ApiService) {}

  @Post('job')
  @HttpCode(200)
  async submitJob(@Body() body: SubmitJobDto): Promise<string> {
    const job = await this.apiService.submitJob(body);
    return job.id;
  }
}
