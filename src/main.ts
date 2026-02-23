import 'reflect-metadata';
import { Application } from './app/application.js';
import { createContainer } from './shared/container.js';
import { Component } from './shared/types/component.js';

const bootstrap = async (): Promise<void> => {
  const container = createContainer();
  const application = container.get<Application>(Component.Application);
  await application.init();
};

void bootstrap();
