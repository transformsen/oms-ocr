/**
 * The TypeScript interface of Job objects.
 */

import {
  CompletionStatus,
  SuccessStatus,
  Tasks,
} from './enums';
import { ITask } from './task.interface';

interface IRelationship {
  type: string,
  conf: {
    id: string,
    catalogId: string,
    formId: string,
    sourceSystemType: string,
  },
};

export interface IJob {
  version: string,
  requestContext: {
    source: {
      system: {
        name: string,
        version: string,
        stagingEnvironment: string,
        datacenterEnvironment: string,
      },
      user: {
        id: string,
      },
    },
  },
  id: string,
  created: Date,
  finishedAt: Date,
  name: string,
  completionStatus: CompletionStatus,
  overallStatus: SuccessStatus,
  lastProcessingAttempt: Date,
  requestedSendDate: Date,
  recipient: {
    addressee: string,
    addressLine1: string,
    addressLine2: string,
    city: string,
    state: string,
    zip: string,
    zip4: string,
  },
  item: {
    contentType: string,
    encodingType: string,
    content: string,
  },
  taskOrder: Tasks[],
  tasks: {
    [Tasks.FireEventPostalMailSent]: ITask,
    [Tasks.UploadToDms]: ITask,
  },
  storage: {
    system: string,
    conf: {
      locationId: string,
      locationName: string,
    },
  },
  relationships: IRelationship[],
};
