import {StatusCodes} from 'http-status-codes';
import {Types} from 'mongoose';
import {HttpError} from '../http-error/http-error.js';
import {type MiddlewareInterface} from './middleware.interface.js';

export class ParseObjectIdMiddleware implements MiddlewareInterface {
  constructor(private readonly paramName: string) {}

  public execute(req: import('express').Request, _res: import('express').Response, next: import('express').NextFunction): void {
    const objectId = req.params[this.paramName];

    if (Array.isArray(objectId) || !Types.ObjectId.isValid(objectId)) {
      throw new HttpError(StatusCodes.BAD_REQUEST, `Invalid ${this.paramName}`);
    }

    next();
  }
}
