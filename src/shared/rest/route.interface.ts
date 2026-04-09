/* eslint-disable @typescript-eslint/no-explicit-any */
import {type MiddlewareInterface} from '../middleware/middleware.interface.js';

export type HttpMethod = 'get' | 'post' | 'delete' | 'patch' | 'put';

export interface RouteInterface {
  path: string;
  method: HttpMethod;
  handler: (...args: any[]) => any;
  middlewares?: MiddlewareInterface[];
}
