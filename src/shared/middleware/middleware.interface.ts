import {type NextFunction, type Request, type Response} from 'express';

export interface MiddlewareInterface {
  execute(req: Request, res: Response, next: NextFunction): void | Promise<void>;
}
