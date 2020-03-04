/**
 * The Mongoose Schema of Jobs collection.
 */

import { Schema } from 'mongoose';
import { v4 as uuid } from 'uuid';

import { Tasks, ValidStatus, ValidTasks, Status } from './api.enums';

const TaskAttemptSchema = new Schema({
  time: Date,
  status: {
    type: String,
    enum: ValidStatus,
  },
  retryableStatus: Boolean,
  errorDetails: {
    name: String,
    message: String,
    details: String,
  },
  successDetails: {
    details: String,
  },
});

const TaskSchema = new Schema({
  completionStatus: {
    type: String,
    enum: ValidStatus,
  },
  overallStatus: {
    type: String,
    enum: ValidStatus,
  },
  lastProcessingAttempt: Date,
  attempts: [TaskAttemptSchema],
});

const RelationshipSchema = new Schema({
  type: String,
  conf: {
    id: String,
    catalogId: String,
    formId: String,
    sourceSystemType: String,
  },
});

export const JobSchema = new Schema({
  _id: {
    type: String,
    default: uuid,
  },
  version: String,
  requestContext: {
    source: {
      system: {
        name: String,
        version: String,
        stagingEnvironment: String,
        datacenterEnvironment: String,
      },
      user: {
        id: String,
      },
    },
  },
  created: Date,
  name: String,
  completionStatus: {
    type: String,
    enum: ValidStatus,
    default: Status.Incomplete,
  },
  overallStatus: {
    type: String,
    enum: ValidStatus,
    default: Status.NotAttempted,
  },
  lastProcessingAttempt: Date,
  requestedSendDate: Date,
  recipient: {
    addressee: String,
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    zip: String,
    zip4: String,
  },
  item: {
    contentType: String,
    encodingType: String,
    content: String,
  },
  taskOrder: [{
    type: String,
    enum: ValidTasks,
  }],
  tasks: {
    [Tasks.FireEventPostalMailSent]: TaskSchema,
    [Tasks.UploadToDms]: TaskSchema,
  },
  storage: {
    system: String,
    conf: {
      locationId: String,
      locationName: String,
    },
  },
  relationships: [RelationshipSchema],
});
