/**
 * The ApiService.
 */

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { IJob } from './job.interface';
import { SubmitJobDto } from './submit-job.dto';

@Injectable()
export class ApiService {
  constructor(@InjectModel('Job') private jobModel: Model<IJob>) {}

  /**
   * Creates job object in MongoDB.
   * @param {SubmitJobDto} submitJob Job description.
   * @returns {Promise<IJob>}
   */
  async submitJob(submitJob: SubmitJobDto): Promise<IJob> {
    const job = new this.jobModel(submitJob);
    return job.save();
  }
}
