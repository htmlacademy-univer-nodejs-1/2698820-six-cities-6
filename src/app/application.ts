import {resolve} from 'node:path';
import cors from 'cors';
import express, {type Express} from 'express';
import { inject, injectable } from 'inversify';
import { CommentController } from '../modules/comment/comment.controller.js';
import { OfferController } from '../modules/offer/offer.controller.js';
import { UserController } from '../modules/user/user.controller.js';
import { type Config } from '../shared/config/config.interface.js';
import { type DatabaseClient } from '../shared/database/database-client.interface.js';
import { type ExceptionFilter } from '../shared/exception-filter/exception-filter.interface.js';
import { type Logger } from '../shared/libs/logger/logger.interface.js';
import { Component } from '../shared/types/component.js';

@injectable()
export class Application {
  private readonly app: Express;

  constructor(
    @inject(Component.Logger) private readonly logger: Logger,
    @inject(Component.Config) private readonly config: Config,
    @inject(Component.DatabaseClient) private readonly databaseClient: DatabaseClient,
    @inject(Component.UserController) private readonly userController: UserController,
    @inject(Component.OfferController) private readonly offerController: OfferController,
    @inject(Component.CommentController) private readonly commentController: CommentController,
    @inject(Component.ExceptionFilter) private readonly exceptionFilter: ExceptionFilter
  ) {
    this.app = express();
  }

  public async init(): Promise<void> {
    const dbUri = `mongodb://${this.config.get('DB_HOST')}:${this.config.get('DB_PORT')}/${this.config.get('DB_NAME')}`;
    await this.databaseClient.connect(dbUri);

    this.registerMiddlewares();
    this.registerRoutes();
    this.registerExceptionFilter();
    this.initServer();

    this.logger.info('Application initialized');
  }

  private registerMiddlewares(): void {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use('/static', express.static(resolve(this.config.get('UPLOAD_DIRECTORY'))));
  }

  private registerRoutes(): void {
    this.app.use('/api/users', this.userController.getRouter());
    this.app.use('/api/offers/:offerId/comments', this.commentController.getRouter());
    this.app.use('/api/offers', this.offerController.getRouter());
  }

  private registerExceptionFilter(): void {
    this.app.use(this.exceptionFilter.catch.bind(this.exceptionFilter));
  }

  private initServer(): void {
    const port = this.config.get('PORT');

    this.app.listen(port, () => {
      this.logger.info(`Server started on port ${port}`);
    });
  }
}
