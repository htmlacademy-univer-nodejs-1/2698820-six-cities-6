import {instanceToPlain} from 'class-transformer';
import {type Request, type Response} from 'express';
import {inject, injectable} from 'inversify';
import {StatusCodes} from 'http-status-codes';
import {type UserDocument} from './user.entity.js';
import {type UserService} from './user-service.interface.js';
import {CreateUserDto} from './dto/create-user.dto.js';
import {LoginUserDto} from './dto/login-user.dto.js';
import {LoggedUserRdo} from './rdo/logged-user.rdo.js';
import {UserRdo} from './rdo/user.rdo.js';
import {fillDTO} from '../../shared/helpers/common.js';
import {createAuthToken, parseAuthToken} from '../../shared/helpers/token.js';
import {HttpError} from '../../shared/http-error/http-error.js';
import {type Logger} from '../../shared/libs/logger/logger.interface.js';
import {ValidateDtoMiddleware} from '../../shared/middleware/validate-dto.middleware.js';
import {Controller} from '../../shared/rest/controller.abstract.js';
import {Component} from '../../shared/types/component.js';

@injectable()
export class UserController extends Controller {
  constructor(
    @inject(Component.Logger) logger: Logger,
    @inject(Component.UserService) private readonly userService: UserService
  ) {
    super(logger);

    this.addRoute({path: '/register', method: 'post', handler: this.create, middlewares: [new ValidateDtoMiddleware(CreateUserDto)]});
    this.addRoute({path: '/login', method: 'post', handler: this.login, middlewares: [new ValidateDtoMiddleware(LoginUserDto)]});
    this.addRoute({path: '/logout', method: 'delete', handler: this.logout});
    this.addRoute({path: '/check', method: 'get', handler: this.check});
  }

  public create = async ({body}: Request<object, object, CreateUserDto>, response: Response): Promise<void> => {
    const dto = Object.assign(new CreateUserDto(), body);
    const existingUser = await this.userService.findByEmail(dto.email);

    if (existingUser) {
      throw new HttpError(StatusCodes.CONFLICT, 'User with this email already exists');
    }

    const user = await this.userService.create(dto);
    this.created(response, instanceToPlain(fillDTO(UserRdo, user)));
  };

  public login = async ({body}: Request<object, object, LoginUserDto>, response: Response): Promise<void> => {
    const dto = Object.assign(new LoginUserDto(), body);
    const user = await this.userService.findByEmail(dto.email);

    if (!user || user.password !== dto.password) {
      throw new HttpError(StatusCodes.UNAUTHORIZED, 'Invalid email or password');
    }

    const token = createAuthToken(user.id);
    this.ok(response, instanceToPlain(fillDTO(LoggedUserRdo, {token})));
  };

  public logout = async ({headers}: Request, response: Response): Promise<void> => {
    if (headers.authorization) {
      parseAuthToken(headers.authorization);
    }
    this.noContent(response);
  };

  public check = async ({headers}: Request, response: Response): Promise<void> => {
    const user = headers.authorization
      ? await this.findUserOrThrow(parseAuthToken(headers.authorization))
      : await this.findFirstUserOrThrow();
    this.ok(response, instanceToPlain(fillDTO(UserRdo, user)));
  };

  private async findUserOrThrow(userId: string): Promise<UserDocument> {
    const user = await this.userService.findById(userId);

    if (!user) {
      throw new HttpError(StatusCodes.UNAUTHORIZED, 'User not found');
    }

    return user;
  }

  private async findFirstUserOrThrow(): Promise<UserDocument> {
    const user = await this.userService.findFirst();

    if (!user) {
      throw new HttpError(StatusCodes.NOT_FOUND, 'User not found');
    }

    return user;
  }
}
