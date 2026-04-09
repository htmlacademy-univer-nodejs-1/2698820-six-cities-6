import {instanceToPlain} from 'class-transformer';
import {type Request, type Response} from 'express';
import {inject, injectable} from 'inversify';
import {StatusCodes} from 'http-status-codes';
import {type CommentService, type CreateCommentDto as CreateCommentServiceDto} from './comment-service.interface.js';
import {CreateCommentDto} from './dto/create-comment.dto.js';
import {CommentRdo} from './rdo/comment.rdo.js';
import {type OfferService} from '../offer/offer-service.interface.js';
import {type UserDocument} from '../user/user.entity.js';
import {type UserService} from '../user/user-service.interface.js';
import {fillDTO} from '../../shared/helpers/common.js';
import {HttpError} from '../../shared/http-error/http-error.js';
import {type Logger} from '../../shared/libs/logger/logger.interface.js';
import {ParseObjectIdMiddleware} from '../../shared/middleware/parse-objectid.middleware.js';
import {ValidateDtoMiddleware} from '../../shared/middleware/validate-dto.middleware.js';
import {Controller} from '../../shared/rest/controller.abstract.js';
import {Component} from '../../shared/types/component.js';

type OfferIdParams = {offerId: string};

@injectable()
export class CommentController extends Controller {
  constructor(
    @inject(Component.Logger) logger: Logger,
    @inject(Component.CommentService) private readonly commentService: CommentService,
    @inject(Component.OfferService) private readonly offerService: OfferService,
    @inject(Component.UserService) private readonly userService: UserService
  ) {
    super(logger, {mergeParams: true});

    const offerIdMiddleware = new ParseObjectIdMiddleware('offerId');

    this.addRoute({path: '/', method: 'get', handler: this.index, middlewares: [offerIdMiddleware]});
    this.addRoute({
      path: '/',
      method: 'post',
      handler: this.create,
      middlewares: [offerIdMiddleware, new ValidateDtoMiddleware(CreateCommentDto)]
    });
  }

  public index = async ({params}: Request<OfferIdParams>, response: Response): Promise<void> => {
    await this.findOfferOrThrow(params.offerId);
    const comments = await this.commentService.findByOfferId(params.offerId);
    this.ok(response, instanceToPlain(fillDTO(CommentRdo, comments)));
  };

  public create = async ({params, body}: Request<OfferIdParams, object, CreateCommentDto>, response: Response): Promise<void> => {
    const offer = await this.findOfferOrThrow(params.offerId);
    const user = await this.resolveUser();
    const dto = body as CreateCommentDto;

    const serviceDto: CreateCommentServiceDto = {
      text: dto.text,
      rating: dto.rating,
      offerId: offer._id,
      authorId: user._id
    };

    const comment = await this.commentService.create(serviceDto);
    this.created(response, instanceToPlain(fillDTO(CommentRdo, comment)));
  };

  private async findOfferOrThrow(offerId: string) {
    const offer = await this.offerService.findById(offerId);

    if (!offer) {
      throw new HttpError(StatusCodes.NOT_FOUND, 'Offer not found');
    }

    return offer;
  }

  private async resolveUser(): Promise<UserDocument> {
    const user = await this.userService.findFirst();

    if (!user) {
      throw new HttpError(StatusCodes.BAD_REQUEST, 'No users available to link comment');
    }

    return user;
  }
}
