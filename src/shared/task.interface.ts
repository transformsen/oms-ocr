import { CompletionStatus, SuccessStatus } from './enums';
import { ITaskAttempt } from './task-attempt.interface';

export interface ITask {
  completionStatus: CompletionStatus,
  overallStatus: SuccessStatus,
  lastProcessingAttempt: Date,
  attempts: ITaskAttempt[],
};
