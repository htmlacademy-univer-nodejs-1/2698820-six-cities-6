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
import {HttpError} from '../../shared/http-error/http-error.js';
import {type Logger} from '../../shared/libs/logger/logger.interface.js';
import {AnonymousRouteMiddleware} from '../../shared/middleware/anonymous-route.middleware.js';
import {PrivateRouteMiddleware} from '../../shared/middleware/private-route.middleware.js';
import {UploadFileMiddleware} from '../../shared/middleware/upload-file.middleware.js';
import {ValidateDtoMiddleware} from '../../shared/middleware/validate-dto.middleware.js';
import {Controller} from '../../shared/rest/controller.abstract.js';
import {type TokenService} from '../../shared/token/token-service.interface.js';
import {Component} from '../../shared/types/component.js';
import {type Config} from '../../shared/config/config.interface.js';

type AvatarUploadRequest = Request & {file?: {filename: string}};

@injectable()
export class UserController extends Controller {
  constructor(
    @inject(Component.Logger) logger: Logger,
    @inject(Component.UserService) private readonly userService: UserService,
    @inject(Component.Config) private readonly config: Config,
    @inject(Component.TokenService) private readonly tokenService: TokenService
  ) {
    super(logger);

    const privateRouteMiddleware = new PrivateRouteMiddleware(this.tokenService);

    this.addRoute({path: '/register', method: 'post', handler: this.create, middlewares: [new ValidateDtoMiddleware(CreateUserDto), new AnonymousRouteMiddleware()]});
    this.addRoute({path: '/login', method: 'post', handler: this.login, middlewares: [new ValidateDtoMiddleware(LoginUserDto)]});
    this.addRoute({path: '/logout', method: 'delete', handler: this.logout, middlewares: [privateRouteMiddleware]});
    this.addRoute({path: '/check', method: 'get', handler: this.check, middlewares: [privateRouteMiddleware]});
    this.addRoute({
      path: '/avatar',
      method: 'post',
      handler: this.uploadAvatar,
      middlewares: [
        privateRouteMiddleware,
        new UploadFileMiddleware('avatar', this.config.get('UPLOAD_DIRECTORY'), ['image/jpeg', 'image/png']),
      ]
    });
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
    const user = await this.userService.verifyUser(dto.email, dto.password);

    if (!user) {
      throw new HttpError(StatusCodes.UNAUTHORIZED, 'Invalid email or password');
    }

    const token = await this.tokenService.createToken({userId: user.id});
    this.ok(response, instanceToPlain(fillDTO(LoggedUserRdo, {token})));
  };

  public logout = async (_request: Request, response: Response): Promise<void> => {
    this.noContent(response);
  };

  public check = async (_request: Request, response: Response): Promise<void> => {
    const user = await this.findUserOrThrow(response.locals.userId as string);
    this.ok(response, instanceToPlain(fillDTO(UserRdo, user)));
  };

  public uploadAvatar = async ({file}: AvatarUploadRequest, response: Response): Promise<void> => {
    const currentUser = await this.findUserOrThrow(response.locals.userId as string);
    const avatarPath = `/static/${file?.filename}`;
    const updatedUser = await this.userService.updateById(currentUser.id, {avatarPath}) ?? currentUser;

    this.ok(response, instanceToPlain(fillDTO(UserRdo, updatedUser)));
  };

  private async findUserOrThrow(userId: string): Promise<UserDocument> {
    const user = await this.userService.findById(userId);

    if (!user) {
      throw new HttpError(StatusCodes.UNAUTHORIZED, 'User not found');
    }

    return user;
  }
}
