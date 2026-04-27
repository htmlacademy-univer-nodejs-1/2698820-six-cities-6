import {instanceToPlain} from 'class-transformer';
import {Types} from 'mongoose';
import {type Request, type Response} from 'express';
import {inject, injectable} from 'inversify';
import {StatusCodes} from 'http-status-codes';
import {type OfferDocument} from './offer.entity.js';
import {type CreateOfferDto as CreateOfferServiceDto, type OfferService, type UpdateOfferDto as UpdateOfferServiceDto} from './offer-service.interface.js';
import {CreateOfferDto} from './dto/create-offer.dto.js';
import {UpdateOfferDto} from './dto/update-offer.dto.js';
import {OfferDetailRdo} from './rdo/offer-detail.rdo.js';
import {OfferSummaryRdo} from './rdo/offer-summary.rdo.js';
import {fillDTO} from '../../shared/helpers/common.js';
import {HttpError} from '../../shared/http-error/http-error.js';
import {type Logger} from '../../shared/libs/logger/logger.interface.js';
import {DocumentExistsMiddleware} from '../../shared/middleware/document-exists.middleware.js';
import {ParseObjectIdMiddleware} from '../../shared/middleware/parse-objectid.middleware.js';
import {PrivateRouteMiddleware} from '../../shared/middleware/private-route.middleware.js';
import {ValidateDtoMiddleware} from '../../shared/middleware/validate-dto.middleware.js';
import {Controller} from '../../shared/rest/controller.abstract.js';
import {type TokenService} from '../../shared/token/token-service.interface.js';
import {Component} from '../../shared/types/component.js';
import {type CityName} from '../../types/entities.js';

type OfferIdParams = {offerId: string};
type PremiumCityParams = {cityName: CityName};
type FavoriteParams = OfferIdParams & {status: string};

@injectable()
export class OfferController extends Controller {
  constructor(
    @inject(Component.Logger) logger: Logger,
    @inject(Component.OfferService) private readonly offerService: OfferService,
    @inject(Component.TokenService) private readonly tokenService: TokenService
  ) {
    super(logger);

    const offerIdMiddleware = new ParseObjectIdMiddleware('offerId');
    const optionalAuthMiddleware = new PrivateRouteMiddleware(this.tokenService, false);
    const privateRouteMiddleware = new PrivateRouteMiddleware(this.tokenService);

    this.addRoute({path: '/premium/:cityName', method: 'get', handler: this.getPremiumByCity, middlewares: [optionalAuthMiddleware]});
    this.addRoute({path: '/favorites', method: 'get', handler: this.getFavorites, middlewares: [privateRouteMiddleware]});
    this.addRoute({
      path: '/:offerId/favorite/:status',
      method: 'post',
      handler: this.changeFavoriteStatus,
      middlewares: [
        offerIdMiddleware,
        privateRouteMiddleware,
        new DocumentExistsMiddleware(this.offerService, 'Offer', 'offerId', 'offer')
      ]
    });
    this.addRoute({
      path: '/:offerId',
      method: 'get',
      handler: this.show,
      middlewares: [offerIdMiddleware, optionalAuthMiddleware, new DocumentExistsMiddleware(this.offerService, 'Offer', 'offerId', 'offer')]
    });
    this.addRoute({
      path: '/:offerId',
      method: 'patch',
      handler: this.update,
      middlewares: [
        offerIdMiddleware,
        new ValidateDtoMiddleware(UpdateOfferDto),
        privateRouteMiddleware,
        new DocumentExistsMiddleware(this.offerService, 'Offer', 'offerId', 'offer')
      ]
    });
    this.addRoute({
      path: '/:offerId',
      method: 'delete',
      handler: this.delete,
      middlewares: [offerIdMiddleware, privateRouteMiddleware, new DocumentExistsMiddleware(this.offerService, 'Offer', 'offerId', 'offer')]
    });
    this.addRoute({path: '/', method: 'get', handler: this.index, middlewares: [optionalAuthMiddleware]});
    this.addRoute({path: '/', method: 'post', handler: this.create, middlewares: [new ValidateDtoMiddleware(CreateOfferDto), privateRouteMiddleware]});
  }

  public index = async ({query}: Request, response: Response): Promise<void> => {
    const limit = Number(query.limit) || 60;
    const offers = await this.offerService.find(limit, this.getCurrentUserId(response));
    this.ok(response, instanceToPlain(fillDTO(OfferSummaryRdo, offers)));
  };

  public show = async (_request: Request<OfferIdParams>, response: Response): Promise<void> => {
    const existingOffer = response.locals.offer as OfferDocument;
    const offer = await this.offerService.findById(existingOffer.id, this.getCurrentUserId(response)) ?? existingOffer;
    this.ok(response, instanceToPlain(fillDTO(OfferDetailRdo, offer)));
  };

  public create = async ({body}: Request<object, object, CreateOfferDto>, response: Response): Promise<void> => {
    const dto = body as CreateOfferDto;
    const serviceDto: CreateOfferServiceDto = {
      title: dto.title,
      description: dto.description,
      publishDate: new Date(),
      city: {
        name: dto.city,
        location: dto.coordinates
      },
      previewImage: dto.previewImage,
      images: dto.images,
      isPremium: dto.isPremium,
      isFavorite: false,
      favoriteUserIds: [],
      rating: 0,
      housingType: dto.housingType,
      roomsCount: dto.roomsCount,
      guestsCount: dto.guestsCount,
      rentalPrice: dto.rentalPrice,
      amenities: dto.amenities,
      authorId: new Types.ObjectId(this.getRequiredUserId(response)),
      commentsCount: 0
    };

    const offer = await this.offerService.create(serviceDto);
    this.created(response, instanceToPlain(fillDTO(OfferDetailRdo, offer)));
  };

  public update = async ({body}: Request<OfferIdParams, object, UpdateOfferDto>, response: Response): Promise<void> => {
    const existingOffer = response.locals.offer as OfferDocument;
    this.ensureOfferAuthor(existingOffer, this.getRequiredUserId(response));

    const dto = body as UpdateOfferDto;
    const currentCity = existingOffer.city;

    if (!currentCity) {
      throw new HttpError(StatusCodes.INTERNAL_SERVER_ERROR, 'Offer city is missing');
    }

    const serviceDto: UpdateOfferServiceDto = {
      title: dto.title,
      description: dto.description,
      city: dto.city ? {name: dto.city, location: dto.coordinates ?? currentCity.location} : undefined,
      previewImage: dto.previewImage,
      images: dto.images,
      isPremium: dto.isPremium,
      housingType: dto.housingType,
      roomsCount: dto.roomsCount,
      guestsCount: dto.guestsCount,
      rentalPrice: dto.rentalPrice,
      amenities: dto.amenities
    };

    if (!serviceDto.city && dto.coordinates) {
      serviceDto.city = {
        name: currentCity.name,
        location: dto.coordinates
      };
    }

    const updatedOffer = await this.offerService.updateById(existingOffer.id, serviceDto, this.getRequiredUserId(response)) ?? existingOffer;

    this.ok(response, instanceToPlain(fillDTO(OfferDetailRdo, updatedOffer)));
  };

  public delete = async ({params}: Request<OfferIdParams>, response: Response): Promise<void> => {
    this.ensureOfferAuthor(response.locals.offer as OfferDocument, this.getRequiredUserId(response));
    await this.offerService.deleteById(params.offerId);
    this.noContent(response);
  };

  public getPremiumByCity = async ({params}: Request<PremiumCityParams>, response: Response): Promise<void> => {
    const offers = await this.offerService.findPremiumByCity(params.cityName, this.getCurrentUserId(response));
    this.ok(response, instanceToPlain(fillDTO(OfferSummaryRdo, offers)));
  };

  public getFavorites = async (_request: Request, response: Response): Promise<void> => {
    const offers = await this.offerService.findFavorites(this.getRequiredUserId(response));
    this.ok(response, instanceToPlain(fillDTO(OfferSummaryRdo, offers)));
  };

  public changeFavoriteStatus = async ({params}: Request<FavoriteParams>, response: Response): Promise<void> => {
    if (!['0', '1'].includes(params.status)) {
      throw new HttpError(StatusCodes.BAD_REQUEST, 'Favorite status must be 0 or 1');
    }

    const isFavorite = params.status === '1';
    const offer = await this.offerService.updateFavoriteStatus(params.offerId, this.getRequiredUserId(response), isFavorite)
      ?? response.locals.offer as OfferDocument;

    this.ok(response, instanceToPlain(fillDTO(OfferDetailRdo, offer)));
  };

  private getCurrentUserId(response: Response): string | undefined {
    return response.locals.userId as string | undefined;
  }

  private getRequiredUserId(response: Response): string {
    const userId = this.getCurrentUserId(response);

    if (!userId) {
      throw new HttpError(StatusCodes.UNAUTHORIZED, 'User is not authenticated');
    }

    return userId;
  }

  private ensureOfferAuthor(offer: OfferDocument, userId: string): void {
    const author = offer.authorId as unknown as {id?: string; _id?: Types.ObjectId; toString(): string};
    const offerAuthorId = author.id ?? author._id?.toString() ?? author.toString();

    if (offerAuthorId !== userId) {
      throw new HttpError(StatusCodes.FORBIDDEN, 'You can edit only your own offers');
    }
  }
}
