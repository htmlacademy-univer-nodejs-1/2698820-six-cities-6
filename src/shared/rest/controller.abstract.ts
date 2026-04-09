import asyncHandler from 'express-async-handler';
import {StatusCodes} from 'http-status-codes';
import {Router, type Response, type RouterOptions} from 'express';
import {inject, injectable} from 'inversify';
import {type ControllerInterface} from './controller.interface.js';
import {type Logger} from '../libs/logger/logger.interface.js';
import {Component} from '../types/component.js';
import {type RouteInterface} from './route.interface.js';

@injectable()
export abstract class Controller implements ControllerInterface {
  protected readonly router: Router;

  constructor(
    @inject(Component.Logger) protected readonly logger: Logger,
    routerOptions?: RouterOptions
  ) {
    this.router = Router(routerOptions);
  }

  public getRouter(): Router {
    return this.router;
  }

  protected addRoute(route: RouteInterface): void {
    const middlewares = route.middlewares ?? [];
    this.logger.info(`Register route: [${route.method.toUpperCase()}] ${route.path}`);
    this.router[route.method](
      route.path,
      ...middlewares.map((middleware) => middleware.execute.bind(middleware)),
      asyncHandler(route.handler as never)
    );
  }

  protected ok<T>(response: Response, dto: T): void {
    response.status(StatusCodes.OK).json(dto);
  }

  protected created<T>(response: Response, dto: T): void {
    response.status(StatusCodes.CREATED).json(dto);
  }

  protected noContent(response: Response): void {
    response.status(StatusCodes.NO_CONTENT).send();
  }
}
