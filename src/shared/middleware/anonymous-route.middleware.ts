import {StatusCodes} from 'http-status-codes';
import {HttpError} from '../http-error/http-error.js';
import {type MiddlewareInterface} from './middleware.interface.js';

export class AnonymousRouteMiddleware implements MiddlewareInterface {
  public execute(
    req: import('express').Request,
    _res: import('express').Response,
    next: import('express').NextFunction
  ): void {
    if (req.headers.authorization) {
      throw new HttpError(StatusCodes.FORBIDDEN, 'Only anonymous users can access this route');
    }

    next();
  }
}
