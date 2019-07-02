class BaseError extends Error {
  constructor(message: string, public data: any) {
    super(message);
  }
}

export class FailedIndexUpsert extends BaseError {
  constructor(error: Error, data: any) {
    super('Upsert index operation failed', { internalError: error, data });
    this.name = 'FailedIndexUpsert';
  }
}
