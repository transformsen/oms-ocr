/**
 * Misc stuff, needed in different places.
 */

export const enum CompletionStatus {
  Complete = 'COMPLETE',
  Incomplete = 'INCOMPLETE',
};

export const ValidCompletionStatus = [
  CompletionStatus.Complete,
  CompletionStatus.Incomplete,
];

export const enum SuccessStatus {
  Failure = 'FAILURE',
  NotAttempted = 'NOT_ATTEMPTED',
  Success = 'SUCCESS',
  WaitingRetry = 'WAITING_RETRY',
};

export const ValidSuccessStatus = [
  SuccessStatus.Failure,
  SuccessStatus.NotAttempted,
  SuccessStatus.Success,
  SuccessStatus.WaitingRetry,
];

export const enum Tasks {
  FireEventPostalMailSent = 'FIRE_EVENT_POSTAL_MAIL_SENT',
  UploadToDms = 'UPLOAD_TO_DMS',
};

export const ValidTasks = [
  Tasks.FireEventPostalMailSent,
  Tasks.UploadToDms,
];
