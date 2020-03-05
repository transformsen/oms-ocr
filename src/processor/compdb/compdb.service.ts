/**
 * The CompdbService.
 */

import {
  HttpService,
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Document, Model } from 'mongoose';
import {
  CompletionStatus,
  SuccessStatus,
  Tasks,
} from 'src/shared/enums';

import { IJob } from 'src/shared/job.interface';
import { ITaskAttempt } from 'src/shared/task-attempt.interface';

const SEC_MS = 1000;
const MIN_MS = 60 * SEC_MS;

/**
 * Adds specified task to the given job, or job update object.
 * @param {object} job
 * @param {Tasks} task
 */
function addTask(job, task: Tasks) {
  if (!job.taskOrder) job.taskOrder = [];
  if (!job.tasks) job.tasks = {};
  job.taskOrder.push(task);
  job.tasks[task] = {
    completionStatus: CompletionStatus.Incomplete,
    overallStatus: SuccessStatus.NotAttempted,
    lastProcessingAttempt: null,
    attempts: [],
  };
}

@Injectable()
export class CompDbService
  implements OnModuleInit, OnModuleDestroy {

  /* True when CompDb is processing a job. */
  private activeJob = false;

  private nextJobTimerId: NodeJS.Timeout;

  private processingAttemptsMax: number;
  private taskProcessingSpanTime: number;
  private ttlTime: number;

  private baseDmsUrl: string;
  private baseEventApiUrl: string;

  /**
   * Launches CompDb component on module start-up.
   */
  onModuleInit() {
    this.nextJobTimerId = setTimeout(this.doNextJob, 0);
  }

  /**
   * Tears down CompDb component on module shutdown.
   */
  onModuleDestroy() {
    clearTimeout(this.nextJobTimerId);
    this.nextJobTimerId = null;
  }

  constructor(
    configService: ConfigService,
    private httpService: HttpService,
    @InjectModel('Job') private jobModel: Model<IJob>
  ) {
    this.processingAttemptsMax = +configService.get<number>(
      'WM_OMP_PROCESSING_ATTEMPTS_MAX',
    );
    this.taskProcessingSpanTime = MIN_MS * configService.get<number>(
      'WM_OMP_TASK_PROCESSING_SPAN_MINUTES',
    );
    this.ttlTime = MIN_MS * configService.get<number>(
      'WP_OMP_TTL_MINUTES',
    );
    this.baseDmsUrl = configService.get<string>(
      'WM_OMP_ROOT_URI_DMS',
    );
    this.baseEventApiUrl = configService.get<string>(
      'WM_OMP_ROOT_URI_EVENT_API',
    );
    this.doNextJob = this.doNextJob.bind(this);
  }

  /**
   * Receives a PDF file for further processing by CompDb component.
   * @param {string} name Filename.
   * @param {string} content Base64-encoded file content.
   * @return {Promise<boolean>} Resolves to true if the caller should delete
   *  the file after the call (because its content successfully added to DB
   *  for future processing), or false if the caller should keep the file and
   *  retry its submission later. It also may reject in the case of errors, e.g.
   *  if the caller attempts to re-submit a file to a job that has received
   *  the file before.
   */
  async receiveFile(name: string, content: string): Promise<boolean> {
    const jobName = name.match(/(.*)\.pdf$/i)[1];
    const job: Document<IJob> = await this.jobModel.findOne({
      name: jobName,
    }).exec();
    if (!job) return false;
    if (
      (job.item && job.item.content) // Already got content.
      || job.overallStatus !== SuccessStatus.NotAttempted // Already in work.
    ) {
      throw Error('The job has received the asset before');
    }
    const update = {
      item: {
        contentType: 'application/pdf',
        encodingType: 'base64',
        content,
      },

      /* Resets this to guarantee that it will be picked up in the very next
       * job processing cycle (this.doNextJob()). */
      lastProcessingAttempt: null,
    };
    addTask(update, Tasks.UploadToDms);
    addTask(update, Tasks.FireEventPostalMailSent);
    await job.updateOne(update);
    this.doNextJob();
    return true;
  }

  private async doFireEventPostalMailSentTask(
    job: Document<IJob>
  ): Promise<ITaskAttempt> {
    const time = new Date();
    try {
      const url = `${this.baseEventApiUrl}/event`;
      const jobDesc = {
        ...job.toJSON(),
        item: undefined,
        tasks: undefined,
        taskOrder: undefined,
        completionStatus: undefined,
        overallStatus: undefined,
        lastProcessingAttempt: undefined,
      };
      await await this.httpService.post(
        url,
        {
          effectiveDatetime: '',
          classification: 'TECHNICAL',
          description: 'An item has been sent through postal mail',
          subjectAreaNm: 'event',
          subjectSubAreaNm: 'contactevent',
          objNm: 'CONTACT_POSTAL_MAIL',
          srcSysCd: '????',
          eventPayload: {
            contentType: 'application/json',
            contentEncoding: '7bit',
            name: job.name,
            extension: 'json',
            payloadObject: {
              version: '1',
              'mailProcessingJob.id': job.id,
              'mailProcessingJob.created': job.created,
              addressee: {
                name: job.recipient.addressee,
                address: {
                  line1: job.recipient.addressLine1,
                  line2: job.recipient.addressLine2,
                  city: job.recipient.city,
                  state: job.recipient.state,
                  zip: job.recipient.zip,
                  zip4: job.recipient.zip4,
                },
                wid: 'UNKNOWN',
                ioi: 'UNKNOWN',
              },
              item: {
                link: '//some//link//to//dms//doc'
              },
              mailProcessingJob: {
                description: jobDesc,
              },
              originalRequestContext: {
                description: job.requestContext,
              },
            },
          },
        },
      ).toPromise();
      return {
        time,
        status: SuccessStatus.Success,
        retryableStatus: true,
        errorDetails: null,
        successDetails: {
          details: '',
        }
      }
    } catch (error) {
      console.error(error);
      return {
        time,
        status: SuccessStatus.Failure,
        retryableStatus: true,
        errorDetails: {
          name: error.name,
          message: error.message,
          details: '',
        },
        successDetails: null,
      };
    }
  }

  private async doUploadToDmsTask(
    job: Document<IJob>
  ): Promise<ITaskAttempt> {
    const time = new Date();
    try {
      const url = `${this.baseDmsUrl}/documents/upload`;
      const fieldArray = [];
      const add = (name, value) => {
        fieldArray.push({
          id: fieldArray.length,
          fieldName: name,
          fieldValue: value,
        })
      };
      add('mailProcessingJob.id', job.id);
      add('mailProcessingJob.created', job.created);
      add('recipient.addressee', job.recipient.addressee);
      add('mailProcessingJob.name', job.name);
      const crm = job.relationships.find(({type}) => type === 'CRM-CASE');
      const contentSource = job.relationships
        .find(({type}) => type === 'CONTENT-SOURCE');
      add('crm.caseId', crm.conf.id);
      add('content.source.id', contentSource.conf.catalogId);
      add('content.source.formId', contentSource.conf.formId);
      add('uploader.system.name', job.requestContext.source.system.name);
      add('uploader.system.version', job.requestContext.source.system.version);
      add(
        'uploader.system.stagingEnvironment',
        job.requestContext.source.system.stagingEnvironment,
      );
      add(
        'uploader.system.datacenterEnvironment',
        job.requestContext.source.system.datacenterEnvironment,
      );
      await this.httpService.post(
        url,
        [
          {
            file: {
              bytes: job.item.content,
              contentType: job.item.contentType,
            },
            metadatas: [{
              locationId: job.storage.conf.locationId,
              locationName: job.storage.conf.locationName,
              fieldArray,
            }]
          },
        ],
      ).toPromise();
      return {
        time,
        status: SuccessStatus.Success,
        retryableStatus: true,
        errorDetails: null,
        successDetails: {
          details: '',
        }
      }
    } catch (error) {
      return {
        time,
        status: SuccessStatus.Failure,
        retryableStatus: true,
        errorDetails: {
          name: error.name,
          message: error.message,
          details: '',
        },
        successDetails: null,
      };
    }
  }

  /**
   * Attempts to handle the specified job task. The actual processing of each
   * task is delegated to separate methods, which may update the job document
   * in DB as they need, but they must not update the actual job and task status
   * data - this update will be handled by this method, as it is the same for
   * any task.
   * @param {Document<IJob>} job Job.
   * @param {Tasks} taskName Name of the task to process.
   * @returns {Promise<boolean>} Resolves to true or false if the task has
   *  been handled successfully or not.
   */
  private async doTask(
    job: Document<IJob>,
    taskName: Tasks,
  ): Promise<boolean> {
    let attempt: ITaskAttempt;
    switch (taskName) {
      case Tasks.FireEventPostalMailSent:
        attempt = await this.doFireEventPostalMailSentTask(job);
        break;
      case Tasks.UploadToDms:
        attempt = await this.doUploadToDmsTask(job);
        break;
    }
    if (attempt.status === SuccessStatus.Success) {
      await job.updateOne({
        [`tasks.${taskName}.completionStatus`]: CompletionStatus.Complete,
        [`tasks.${taskName}.overallStatus`]: SuccessStatus.Success,
        $push: {
          [`tasks.${taskName}.attempts`]: attempt,
        },
      });
      /* Job handling process will move to the next task in this job. */
      return true;
    } else {
      const update = {
        $push: {
          [`tasks.${taskName}.attempts`]: attempt,
        },
      };
      if (
        job.tasks[taskName].attempts.length + 1 >= this.processingAttemptsMax
      ) {
        update[`tasks.${taskName}.completionStatus`]
          = CompletionStatus.Complete;
        update[`tasks.${taskName}.overallStatus`] = SuccessStatus.Failure;
      } else {
        update[`tasks.${taskName}.completionStatus`]
          = CompletionStatus.Incomplete;
        update[`tasks.${taskName}.overallStatus`]
          = SuccessStatus.WaitingRetry;
      }
      await job.updateOne(update);
      /* Job handling process will move to the next job. */
      return false;
    }
  }

  /**
   * Attemps processing of the next pending job. If some job is being processed
   * currently, it just bails out, as that job, once completed, will trigger
   * processing of the next job automatically.
   */
  async doNextJob() {
    if (this.activeJob) return;

    const now = Date.now();
    this.activeJob = true;
    if (this.taskProcessingSpanTime) clearTimeout(this.taskProcessingSpanTime);

    try {
      const job: Document<IJob> = await this.jobModel.findOne({
        completionStatus: CompletionStatus.Incomplete,
        $or: [
          { lastProcessingAttempt: null },
          { lastProcessingAttempt: { $lt: now - this.taskProcessingSpanTime } },
        ],
      }).exec();

      if (job) {
        /* Found a pending job, not attempted recently. */
        if (!job.taskOrder.length) {
          /* The job is pending to get necessary assets, thus has no tasks
           * scheduled. */
          if (job.created.valueOf() < now - this.ttlTime) {
            /* The job has reached its TTL without getting necessary assets,
             * thus it is marked as failed. */
            await job.updateOne({
              completionStatus: CompletionStatus.Complete,
              overallStatus: SuccessStatus.Failure,
              lastProcessingAttempt: now,
            });
            console.log(`Job ${job.name} reached TTL`);
          } else {
            /* The job keeps on waiting for necessary assets. The update of
             * lastProcessingAttempt value keeps the processor from
             * re-attempting this job for this.taskProcessingSpanTime.
             * Though, if assets arrive, this field will be reset to do
             * the processing right away in the next cycle. */
            await job.updateOne({
              lastProcessingAttempt: now,
            });
          }
        } else {
          /* The job has all necessary assets, thus we can try to do
           * its pending tasks. */
          for (let i = 0; i < job.taskOrder.length; i += 1) {
            const task = job.tasks[job.taskOrder[i]];
            switch (task.completionStatus) {
              case CompletionStatus.Incomplete:
                /* Attempting to complete the task. */
                if (!await this.doTask(job, job.taskOrder[i])) {
                  /* The task has failed. The task handler is expected to
                   * update the job in DB as needed, thus here we just move
                   * to processing the next pending job. */
                  if (job.overallStatus === SuccessStatus.NotAttempted) {
                    await job.updateOne({
                      overallStatus: SuccessStatus.WaitingRetry,
                    });
                  }
                  return this.doNextJob();
                }
                break;
              case CompletionStatus.Complete:
                /* If task is successfully completed, move to the next task. */
                if (task.overallStatus === SuccessStatus.Success) continue;
              default:
                /* If we arrived here, it means the task has failed, but for
                 * some reason the job has not been marked as failed when that
                 * happened. Thus, fixing it by marking the job failed. */
                await job.updateOne({
                  completionStatus: CompletionStatus.Complete,
                  overallStatus: SuccessStatus.Failure,
                  lastProcessingAttempt: now,
                });
            }
          }
          /* If we arrived here, all tasks have been completed successfully,
           * thus marking the job completed and removing artifacts. */
          await job.updateOne({
            completionStatus: CompletionStatus.Complete,
            overallStatus: SuccessStatus.Success,
            lastProcessingAttempt: now,
            item: null,
          });
        }

        /* Attempt a next pending job right away. */
        return this.doNextJob();
      }

      /* If this point is reached, there is no pending job that have not been
       * attempted recently. The next processing cycle will be scheduled below.
       * Alternatively, if other methods update existing jobs, they may call
       * this.doNextJob() directly, to start the next cycle right away. */
    } catch (error) {
      console.error(error);
    } finally {
      this.activeJob = false;
    }

    if (this.nextJobTimerId) {
      this.nextJobTimerId = setTimeout(
        this.doNextJob,
        this.taskProcessingSpanTime,
      );
    }
  }
}
