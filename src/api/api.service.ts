/**
 * The ApiService.
 */

import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { IJob } from '../shared/job.interface';
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
    const nameExists = !!await this.jobModel.findOne({
      name: submitJob.name,
    }).exec();
    if (nameExists) {
      throw new HttpException(
        'The specified name is used by another job',
        HttpStatus.BAD_REQUEST,
      );
    }
    const job = new this.jobModel(submitJob);
    return job.save();
  }
}
