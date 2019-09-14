class BaseError extends Error {
  constructor(message: string, public data: any) {
    super(message);
  }
}

export class ComponentGetFailedError extends BaseError {
  constructor(message: string, response: Response) {
    super(message, response);
  }
}

export class ComponentIntegrityCheckFailed extends BaseError {
  constructor(component: { name: string; version: string }) {
    super('Integrity check failed', component);
  }
}
