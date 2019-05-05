class BaseError extends Error {
  constructor(message: string, public data: any) {
    super(message);
  }
}

export class InvalidVersionError extends BaseError {
  constructor(data: any) {
    super(`Invalid version string`, data);

    this.name = 'InvalidVersionString';
  }
}
