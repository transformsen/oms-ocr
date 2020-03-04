/**
 * Misc stuff, needed in different places.
 */

export const enum Status {
  Complete = 'COMPLETE',
  Failure = 'FAILURE',
  Incomplete = 'INCOMPLETE',
  NotAttempted = 'NOT_ATTEMPTED',
  Success = 'SUCCESS',
};

export const ValidStatus = [
  Status.Complete,
  Status.Failure,
  Status.Incomplete,
  Status.NotAttempted,
  Status.Success,
];

export const enum Tasks {
  FireEventPostalMailSent = 'FIRE_EVENT_POSTAL_MAIL_SENT',
  UploadToDms = 'UPLOAD_TO_DMS',
};

export const ValidTasks = [
  Tasks.FireEventPostalMailSent,
  Tasks.UploadToDms,
];
