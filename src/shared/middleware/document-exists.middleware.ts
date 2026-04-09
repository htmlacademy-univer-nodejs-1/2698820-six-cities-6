import {StatusCodes} from 'http-status-codes';
import {HttpError} from '../http-error/http-error.js';
import {type DocumentExistsInterface} from '../types/document-exists.interface.js';
import {type MiddlewareInterface} from './middleware.interface.js';

export class DocumentExistsMiddleware<T> implements MiddlewareInterface {
  constructor(
    private readonly service: DocumentExistsInterface<T>,
    private readonly entityName: string,
    private readonly paramName: string,
    private readonly localKey: string
  ) {}

  public async execute(
    req: import('express').Request,
    res: import('express').Response,
    next: import('express').NextFunction
  ): Promise<void> {
    const rawDocumentId = req.params[this.paramName];
    const documentId = Array.isArray(rawDocumentId) ? rawDocumentId[0] : rawDocumentId;
    const document = await this.service.findById(documentId);

    if (!document) {
      throw new HttpError(StatusCodes.NOT_FOUND, `${this.entityName} not found`);
    }

    res.locals[this.localKey] = document;
    next();
  }
}
