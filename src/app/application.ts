import { inject, injectable } from 'inversify';
import { type Config } from '../shared/config/config.interface.js';
import { type Logger } from '../shared/libs/logger/logger.interface.js';
import { Component } from '../shared/types/component.js';

@injectable()
export class Application {
  constructor(
    @inject(Component.Logger) private readonly logger: Logger,
    @inject(Component.Config) private readonly config: Config
  ) { }

  public async init(): Promise<void> {
    this.logger.info('Application initialized');
    this.logger.info(`Port: ${this.config.get('PORT')}`);
  }
}
