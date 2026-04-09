declare module 'multer' {
  import {type RequestHandler} from 'express';

  interface DiskStorageOptions {
    destination: string;
    filename: (
      request: unknown,
      file: {mimetype: string},
      callback: (error: Error | null, filename: string) => void
    ) => void;
  }

  interface FileFilterCallback {
    (error: Error | null, acceptFile?: boolean): void;
  }

  interface MulterOptions {
    storage?: unknown;
    fileFilter?: (request: unknown, file: {mimetype: string}, callback: FileFilterCallback) => void;
  }

  interface MulterInstance {
    single(fieldName: string): RequestHandler;
  }

  interface MulterFactory {
    (options?: MulterOptions): MulterInstance;
    diskStorage(options: DiskStorageOptions): unknown;
  }

  const multer: MulterFactory;

  export default multer;
}
