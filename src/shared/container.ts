import { Container } from 'inversify';
import { Application } from '../app/application.js';
import { type Config } from './config/config.interface.js';
import { DefaultConfig } from './config/default-config.js';
import { type Logger } from './libs/logger/logger.interface.js';
import { PinoLogger } from './libs/logger/pino.logger.js';
import { Component } from './types/component.js';

export const createContainer = (): Container => {
  const container = new Container();

  container.bind<Application>(Component.Application).to(Application).inSingletonScope();
  container.bind<Logger>(Component.Logger).to(PinoLogger).inSingletonScope();
  container.bind<Config>(Component.Config).to(DefaultConfig).inSingletonScope();

  return container;
};
