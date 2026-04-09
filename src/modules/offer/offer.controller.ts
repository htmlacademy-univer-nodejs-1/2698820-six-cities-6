import {instanceToPlain} from 'class-transformer';
import {type Request, type Response} from 'express';
import {inject, injectable} from 'inversify';
import {StatusCodes} from 'http-status-codes';
import {type OfferDocument} from './offer.entity.js';
import {type CreateOfferDto as CreateOfferServiceDto, type OfferService, type UpdateOfferDto as UpdateOfferServiceDto} from './offer-service.interface.js';
import {CreateOfferDto} from './dto/create-offer.dto.js';
import {UpdateOfferDto} from './dto/update-offer.dto.js';
import {OfferDetailRdo} from './rdo/offer-detail.rdo.js';
import {OfferSummaryRdo} from './rdo/offer-summary.rdo.js';
import {type UserDocument} from '../user/user.entity.js';
import {type UserService} from '../user/user-service.interface.js';
import {fillDTO} from '../../shared/helpers/common.js';
import {HttpError} from '../../shared/http-error/http-error.js';
import {type Logger} from '../../shared/libs/logger/logger.interface.js';
import {ParseObjectIdMiddleware} from '../../shared/middleware/parse-objectid.middleware.js';
import {ValidateDtoMiddleware} from '../../shared/middleware/validate-dto.middleware.js';
import {Controller} from '../../shared/rest/controller.abstract.js';
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
    @inject(Component.UserService) private readonly userService: UserService
  ) {
    super(logger);

    this.addRoute({path: '/premium/:cityName', method: 'get', handler: this.getPremiumByCity});
    this.addRoute({path: '/favorites', method: 'get', handler: this.getFavorites});
    this.addRoute({
      path: '/:offerId/favorite/:status',
      method: 'post',
      handler: this.changeFavoriteStatus,
      middlewares: [new ParseObjectIdMiddleware('offerId')]
    });
    this.addRoute({path: '/:offerId', method: 'get', handler: this.show, middlewares: [new ParseObjectIdMiddleware('offerId')]});
    this.addRoute({
      path: '/:offerId',
      method: 'patch',
      handler: this.update,
      middlewares: [new ParseObjectIdMiddleware('offerId'), new ValidateDtoMiddleware(UpdateOfferDto)]
    });
    this.addRoute({path: '/:offerId', method: 'delete', handler: this.delete, middlewares: [new ParseObjectIdMiddleware('offerId')]});
    this.addRoute({path: '/', method: 'get', handler: this.index});
    this.addRoute({path: '/', method: 'post', handler: this.create, middlewares: [new ValidateDtoMiddleware(CreateOfferDto)]});
  }

  public index = async ({query}: Request, response: Response): Promise<void> => {
    const limit = Number(query.limit) || 60;
    const offers = await this.offerService.find(limit);
    this.ok(response, instanceToPlain(fillDTO(OfferSummaryRdo, offers)));
  };

  public show = async ({params}: Request<OfferIdParams>, response: Response): Promise<void> => {
    const offer = await this.findOfferOrThrow(params.offerId);
    this.ok(response, instanceToPlain(fillDTO(OfferDetailRdo, offer)));
  };

  public create = async ({body}: Request<object, object, CreateOfferDto>, response: Response): Promise<void> => {
    const user = await this.resolveUser();
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
      rating: 0,
      housingType: dto.housingType,
      roomsCount: dto.roomsCount,
      guestsCount: dto.guestsCount,
      rentalPrice: dto.rentalPrice,
      amenities: dto.amenities,
      authorId: user._id,
      commentsCount: 0
    };

    const offer = await this.offerService.create(serviceDto);
    this.created(response, instanceToPlain(fillDTO(OfferDetailRdo, offer)));
  };

  public update = async ({params, body}: Request<OfferIdParams, object, UpdateOfferDto>, response: Response): Promise<void> => {
    const existingOffer = await this.findOfferOrThrow(params.offerId);

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

    const updatedOffer = await this.offerService.updateById(params.offerId, serviceDto);

    if (!updatedOffer) {
      throw new HttpError(StatusCodes.NOT_FOUND, 'Offer not found');
    }

    this.ok(response, instanceToPlain(fillDTO(OfferDetailRdo, updatedOffer)));
  };

  public delete = async ({params}: Request<OfferIdParams>, response: Response): Promise<void> => {
    await this.findOfferOrThrow(params.offerId);
    await this.offerService.deleteById(params.offerId);
    this.noContent(response);
  };

  public getPremiumByCity = async ({params}: Request<PremiumCityParams>, response: Response): Promise<void> => {
    const offers = await this.offerService.findPremiumByCity(params.cityName);
    this.ok(response, instanceToPlain(fillDTO(OfferSummaryRdo, offers)));
  };

  public getFavorites = async (_request: Request, response: Response): Promise<void> => {
    const offers = await this.offerService.findFavorites();
    this.ok(response, instanceToPlain(fillDTO(OfferSummaryRdo, offers)));
  };

  public changeFavoriteStatus = async ({params}: Request<FavoriteParams>, response: Response): Promise<void> => {
    const isFavorite = params.status === '1';
    const offer = await this.offerService.updateFavoriteStatus(params.offerId, isFavorite);

    if (!offer) {
      throw new HttpError(StatusCodes.NOT_FOUND, 'Offer not found');
    }

    this.ok(response, instanceToPlain(fillDTO(OfferDetailRdo, offer)));
  };

  private async findOfferOrThrow(offerId: string): Promise<OfferDocument> {
    const offer = await this.offerService.findById(offerId);

    if (!offer) {
      throw new HttpError(StatusCodes.NOT_FOUND, 'Offer not found');
    }

    return offer;
  }

  private async resolveUser(): Promise<UserDocument> {
    const user = await this.userService.findFirst();

    if (!user) {
      throw new HttpError(StatusCodes.BAD_REQUEST, 'No users available to link offer');
    }

    return user;
  }
}
