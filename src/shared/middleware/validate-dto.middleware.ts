import {plainToInstance, type ClassConstructor} from 'class-transformer';
import {validate} from 'class-validator';
import {StatusCodes} from 'http-status-codes';
import {HttpError} from '../http-error/http-error.js';
import {type MiddlewareInterface} from './middleware.interface.js';

type RequestPart = 'body' | 'params' | 'query';

export class ValidateDtoMiddleware<T extends object> implements MiddlewareInterface {
  constructor(
    private readonly dtoClass: ClassConstructor<T>,
    private readonly requestPart: RequestPart = 'body'
  ) {}

  public async execute(req: import('express').Request, _res: import('express').Response, next: import('express').NextFunction): Promise<void> {
    const dto = plainToInstance(this.dtoClass, req[this.requestPart]);
    const errors = await validate(dto, {whitelist: true});

    if (errors.length > 0) {
      const details = errors.flatMap((error) => Object.values(error.constraints ?? {}));
      throw new HttpError(StatusCodes.BAD_REQUEST, 'Validation failed', details);
    }

    req[this.requestPart] = dto as typeof req[typeof this.requestPart];
    next();
  }
}
