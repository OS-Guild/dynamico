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
