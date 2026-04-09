import {mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import multer from 'multer';
import {extension} from 'mime-types';
import {nanoid} from 'nanoid';
import {StatusCodes} from 'http-status-codes';
import {HttpError} from '../http-error/http-error.js';
import {type MiddlewareInterface} from './middleware.interface.js';

type UploadedFile = {
  mimetype: string;
};

type UploadedRequest = import('express').Request & {
  file?: {
    filename: string;
  };
};

export class UploadFileMiddleware implements MiddlewareInterface {
  private readonly uploadMiddleware: import('express').RequestHandler;

  constructor(
    private readonly fieldName: string,
    uploadDirectory: string,
    private readonly acceptedMimeTypes: string[] = []
  ) {
    const absoluteUploadDirectory = resolve(uploadDirectory);
    mkdirSync(absoluteUploadDirectory, {recursive: true});

    const storage = multer.diskStorage({
      destination: absoluteUploadDirectory,
      filename: (_req: unknown, file: UploadedFile, callback: (error: Error | null, filename: string) => void) => {
        const fileExtension = extension(file.mimetype);
        const fileName = fileExtension ? `${nanoid()}.${fileExtension}` : nanoid();
        callback(null, fileName);
      }
    });

    this.uploadMiddleware = multer({
      storage,
      fileFilter: (_request: unknown, file: UploadedFile, callback: (error: Error | null, acceptFile?: boolean) => void) => {
        if (this.acceptedMimeTypes.length > 0 && !this.acceptedMimeTypes.includes(file.mimetype)) {
          callback(new HttpError(StatusCodes.BAD_REQUEST, `Unsupported file type: ${file.mimetype}`));
          return;
        }

        callback(null, true);
      }
    }).single(this.fieldName);
  }

  public execute(
    req: import('express').Request,
    res: import('express').Response,
    next: import('express').NextFunction
  ): void {
    const requestWithFile = req as UploadedRequest;

    this.uploadMiddleware(req, res, (error) => {
      if (error) {
        next(error);
        return;
      }

      if (!requestWithFile.file) {
        next(new HttpError(StatusCodes.BAD_REQUEST, `File field "${this.fieldName}" is required`));
        return;
      }

      next();
    });
  }
}
