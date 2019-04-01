class BaseError extends Error {
  constructor(message: string, public data: any) {
    super(message);
  }
}

export class NoComponentError extends BaseError {
  constructor(data: any) {
    super(`Couldn't find component`, data);

    this.name = 'NoComponentError';
  }
}

export class NoComponentVersionError extends BaseError {
  constructor(data: any) {
    super('Component version should be specified.', data);

    this.name = 'NoComponentVersionError';
  }
}

export class ComponentExistsError extends BaseError {
  constructor(data: any) {
    super(`Can't publish component since it already exists.`, data);

    this.name = 'ComponentExistsError';
  }
}

export class NoPackageError extends BaseError {
  constructor(data: any) {
    super(`Missing 'package.json' file`, data);

    this.name = 'NoPackageError';
  }
}
