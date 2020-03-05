import { SuccessStatus } from './enums';

export interface ITaskAttempt {
  time: Date,
  status: SuccessStatus,
  retryableStatus: boolean,
  errorDetails: {
    name: string,
    message: string,
    details: string,
  },
  successDetails: {
    details: string,
  },
};
