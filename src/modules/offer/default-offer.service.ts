import {inject, injectable} from 'inversify';
import {type OfferDocument, type OfferModel} from './offer.entity.js';
import {type CityName} from '../../types/entities.js';
import {type CreateOfferDto, type OfferService, type UpdateOfferDto} from './offer-service.interface.js';
import {type CommentModel} from '../comment/comment.entity.js';
import {Component} from '../../shared/types/component.js';

@injectable()
export class DefaultOfferService implements OfferService {
  constructor(
    @inject(Component.OfferModel) private readonly offerModel: OfferModel,
    @inject(Component.CommentModel) private readonly commentModel: CommentModel
  ) {}

  public async find(limit = 60, userId?: string): Promise<OfferDocument[]> {
    const offers = await this.offerModel
      .find()
      .sort({publishDate: -1})
      .limit(limit)
      .exec();

    return this.setFavoriteStatus(offers, userId);
  }

  public async findById(id: string, userId?: string): Promise<OfferDocument | null> {
    const offer = await this.offerModel.findById(id).populate('authorId').exec();
    return offer ? this.setFavoriteStatus(offer, userId) : null;
  }

  public async create(dto: CreateOfferDto): Promise<OfferDocument> {
    const offer = await this.offerModel.create(dto);
    return this.setFavoriteStatus(await offer.populate('authorId'));
  }

  public async updateById(id: string, dto: UpdateOfferDto, userId?: string): Promise<OfferDocument | null> {
    const offer = await this.offerModel.findByIdAndUpdate(id, dto, {new: true}).populate('authorId').exec();
    return offer ? this.setFavoriteStatus(offer, userId) : null;
  }

  public async deleteById(id: string): Promise<OfferDocument | null> {
    const offer = await this.offerModel.findByIdAndDelete(id).exec();

    if (offer) {
      await this.commentModel.deleteMany({offerId: offer._id}).exec();
    }

    return offer;
  }

  public async findPremiumByCity(cityName: CityName, userId?: string): Promise<OfferDocument[]> {
    const offers = await this.offerModel
      .find({'city.name': cityName, isPremium: true})
      .sort({publishDate: -1})
      .limit(3)
      .exec();

    return this.setFavoriteStatus(offers, userId);
  }

  public async findFavorites(userId: string): Promise<OfferDocument[]> {
    const offers = await this.offerModel.find({favoriteUserIds: userId}).sort({publishDate: -1}).exec();
    return this.setFavoriteStatus(offers, userId);
  }

  public async updateFavoriteStatus(id: string, userId: string, isFavorite: boolean): Promise<OfferDocument | null> {
    const updateOperation = isFavorite
      ? {$addToSet: {favoriteUserIds: userId}}
      : {$pull: {favoriteUserIds: userId}};

    const offer = await this.offerModel
      .findByIdAndUpdate(id, updateOperation, {new: true})
      .populate('authorId')
      .exec();

    return offer ? this.setFavoriteStatus(offer, userId) : null;
  }

  public async updateCommentsInfo(id: string, commentsCount: number, rating: number): Promise<OfferDocument | null> {
    return this.offerModel.findByIdAndUpdate(id, {commentsCount, rating}, {new: true}).exec();
  }

  private setFavoriteStatus(offer: OfferDocument, userId?: string): OfferDocument;
  private setFavoriteStatus(offers: OfferDocument[], userId?: string): OfferDocument[];
  private setFavoriteStatus(offerOrOffers: OfferDocument | OfferDocument[], userId?: string): OfferDocument | OfferDocument[] {
    const applyFavoriteStatus = (offer: OfferDocument): OfferDocument => {
      const favoriteUserIds = offer.favoriteUserIds?.map((id) => id.toString()) ?? [];
      offer.isFavorite = Boolean(userId && favoriteUserIds.includes(userId));
      return offer;
    };

    return Array.isArray(offerOrOffers)
      ? offerOrOffers.map(applyFavoriteStatus)
      : applyFavoriteStatus(offerOrOffers);
  }
}
